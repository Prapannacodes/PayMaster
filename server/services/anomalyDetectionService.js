const { PayrollRecord, PayrollPeriod, SalaryStructure } = require("../models/payrollModel");
const { Employee, Department } = require("../models/employeeModel");
const { Attendance } = require("../models/attendanceModel");
const { SalaryAnomaly } = require("../models/intelligentPayrollModel");

/**
 * Smart Salary Anomaly Detection Engine
 * Uses reliable rule-based heuristics and statistical analysis (mean, std dev, cohort analysis)
 * to spot inconsistencies, payroll risks, and compliance flags.
 */
class AnomalyDetectionService {
  /**
   * Run anomaly detection scan on a specific payroll period or recent period
   */
  static async scanPeriod(periodId) {
    const period = await PayrollPeriod.findById(periodId);
    if (!period) {
      throw new Error("Payroll period not found for anomaly scanning");
    }

    const records = await PayrollRecord.find({ payrollPeriodId: period._id })
      .populate("employeeId")
      .lean();

    if (!records || records.length === 0) {
      return {
        success: true,
        periodName: period.periodName,
        scannedCount: 0,
        anomaliesFound: 0,
        anomalies: []
      };
    }

    // Pre-load historical records for comparison across previous periods
    const allHistoricalPeriods = await PayrollPeriod.find({
      status: "Finalized",
      _id: { $ne: period._id }
    })
      .sort({ year: -1, month: -1 })
      .limit(6)
      .lean();

    const historicalPeriodIds = allHistoricalPeriods.map((p) => p._id);
    const historicalRecords = await PayrollRecord.find({
      payrollPeriodId: { $in: historicalPeriodIds }
    }).lean();

    // Map historical records by employeeId -> array of records
    const historyByEmployee = {};
    for (const hr of historicalRecords) {
      const empIdStr = hr.employeeId.toString();
      if (!historyByEmployee[empIdStr]) {
        historyByEmployee[empIdStr] = [];
      }
      historyByEmployee[empIdStr].push(hr);
    }

    // Group current records by department to calculate department statistics
    const deptStats = {};
    for (const r of records) {
      const deptName = r.employeeSnapshot?.departmentName || "General";
      if (!deptStats[deptName]) {
        deptStats[deptName] = { salaries: [] };
      }
      deptStats[deptName].salaries.push(r.grossSalary || 0);
    }

    for (const deptName of Object.keys(deptStats)) {
      const list = deptStats[deptName].salaries;
      const count = list.length;
      const mean = list.reduce((a, b) => a + b, 0) / (count || 1);
      const variance = list.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (count || 1);
      const stdDev = Math.sqrt(variance);
      deptStats[deptName].mean = mean;
      deptStats[deptName].stdDev = stdDev;
    }

    const detectedAnomalies = [];
    const seenEmployeeCodes = new Set();

    for (const record of records) {
      const emp = record.employeeId;
      const empCode = record.employeeSnapshot?.employeeCode || (emp ? emp.employeeCode : "UNKNOWN");
      const empName = record.employeeSnapshot?.name || (emp ? emp.name : "Employee");
      const deptName = record.employeeSnapshot?.departmentName || "General";
      const empIdStr = (emp?._id || record.employeeId).toString();

      // --- Rule 1: Duplicate Payroll Entries ---
      if (seenEmployeeCodes.has(empCode)) {
        detectedAnomalies.push({
          periodId: period._id,
          periodName: period.periodName,
          employeeId: emp?._id || record.employeeId,
          employeeCode: empCode,
          employeeName: empName,
          departmentName: deptName,
          anomalyType: "DUPLICATE_ENTRY",
          severity: "High",
          title: `Duplicate Payroll Record Detected`,
          description: `Employee ${empName} (${empCode}) appears multiple times within the ${period.periodName} payroll cycle. This will cause double disbursement.`,
          affectedAmount: record.netSalary,
          baselineAmount: 0,
          currentAmount: record.netSalary
        });
      }
      seenEmployeeCodes.add(empCode);

      // --- Rule 2: Unusually High or Low Deductions & Negative Net Pay ---
      if (record.netSalary <= 0 && record.grossSalary > 0) {
        detectedAnomalies.push({
          periodId: period._id,
          periodName: period.periodName,
          employeeId: emp?._id || record.employeeId,
          employeeCode: empCode,
          employeeName: empName,
          departmentName: deptName,
          anomalyType: "HIGH_DEDUCTION",
          severity: "High",
          title: `Zero or Negative Net Salary Payout`,
          description: `Total deductions of ₹${record.totalDeductions.toLocaleString()} completely exceed or wipe out gross earnings (₹${record.grossSalary.toLocaleString()}), resulting in net pay of ₹${record.netSalary.toLocaleString()}.`,
          affectedAmount: record.totalDeductions,
          baselineAmount: record.grossSalary,
          currentAmount: record.netSalary
        });
      } else if (record.grossSalary > 0 && record.totalDeductions > record.grossSalary * 0.5) {
        const deductionPct = Math.round((record.totalDeductions / record.grossSalary) * 100);
        detectedAnomalies.push({
          periodId: period._id,
          periodName: period.periodName,
          employeeId: emp?._id || record.employeeId,
          employeeCode: empCode,
          employeeName: empName,
          departmentName: deptName,
          anomalyType: "HIGH_DEDUCTION",
          severity: "High",
          title: `Deductions Exceed 50% Threshold`,
          description: `Total deductions are ${deductionPct}% of gross salary (₹${record.totalDeductions.toLocaleString()} out of ₹${record.grossSalary.toLocaleString()}). Statutory regulations recommend investigating deductions exceeding 50%.`,
          affectedAmount: record.totalDeductions,
          baselineAmount: record.grossSalary * 0.2, // Expected typical deduction ~15-20%
          currentAmount: record.totalDeductions
        });
      }

      // --- Rule 3: Missing Overtime Payments when Overtime Hours are logged ---
      if ((record.overtimeHours || 0) > 0 && (record.earnings?.overtimePay || 0) === 0) {
        detectedAnomalies.push({
          periodId: period._id,
          periodName: period.periodName,
          employeeId: emp?._id || record.employeeId,
          employeeCode: empCode,
          employeeName: empName,
          departmentName: deptName,
          anomalyType: "MISSING_OVERTIME",
          severity: "High",
          title: `Unpaid Overtime Recorded`,
          description: `Employee has ${record.overtimeHours} approved overtime hours recorded for ${period.periodName}, but received ₹0 in overtime remuneration.`,
          affectedAmount: record.overtimeHours * 200, // Estimated benchmark minimum rate
          baselineAmount: record.overtimeHours,
          currentAmount: 0
        });
      }

      // --- Rule 4: Unexpected Bonus Amounts ---
      const basic = record.earnings?.basicSalary || 0;
      const bonus = record.earnings?.bonus || 0;
      if (basic > 0 && bonus > basic * 0.5) {
        const bonusPct = Math.round((bonus / basic) * 100);
        const severity = bonus > basic ? "High" : "Medium";
        detectedAnomalies.push({
          periodId: period._id,
          periodName: period.periodName,
          employeeId: emp?._id || record.employeeId,
          employeeCode: empCode,
          employeeName: empName,
          departmentName: deptName,
          anomalyType: "UNEXPECTED_BONUS",
          severity: severity,
          title: `Disproportionate Bonus Disbursed`,
          description: `Disbursed bonus of ₹${bonus.toLocaleString()} is ${bonusPct}% of base salary (₹${basic.toLocaleString()}). Such large one-off payouts require managerial verification.`,
          affectedAmount: bonus,
          baselineAmount: basic * 0.1, // Benchmark standard ~10%
          currentAmount: bonus
        });
      }

      // --- Rule 5: Historical Salary Comparison & Sudden Swings ---
      const pastRecords = historyByEmployee[empIdStr] || [];
      if (pastRecords.length > 0) {
        const lastRecord = pastRecords[0];
        const previousGross = lastRecord.grossSalary || 0;

        if (previousGross > 0) {
          const delta = record.grossSalary - previousGross;
          const pctChange = (delta / previousGross) * 100;

          if (pctChange >= 35) {
            detectedAnomalies.push({
              periodId: period._id,
              periodName: period.periodName,
              employeeId: emp?._id || record.employeeId,
              employeeCode: empCode,
              employeeName: empName,
              departmentName: deptName,
              anomalyType: "UNEXPECTED_SALARY_CHANGE",
              severity: pctChange > 60 ? "High" : "Medium",
              title: `Sudden Salary Surge (+${pctChange.toFixed(1)}%)`,
              description: `Gross salary jumped from ₹${previousGross.toLocaleString()} in previous cycle to ₹${record.grossSalary.toLocaleString()} (+₹${delta.toLocaleString()}). Requires review of recent promotion or structure change.`,
              affectedAmount: Math.abs(delta),
              baselineAmount: previousGross,
              currentAmount: record.grossSalary
            });
          } else if (pctChange <= -25) {
            detectedAnomalies.push({
              periodId: period._id,
              periodName: period.periodName,
              employeeId: emp?._id || record.employeeId,
              employeeCode: empCode,
              employeeName: empName,
              departmentName: deptName,
              anomalyType: "UNEXPECTED_SALARY_CHANGE",
              severity: "High",
              title: `Sharp Salary Contraction (${pctChange.toFixed(1)}%)`,
              description: `Gross salary dropped sharply from ₹${previousGross.toLocaleString()} to ₹${record.grossSalary.toLocaleString()} (-₹${Math.abs(delta).toLocaleString()}). Verify if unpaid leaves or rate reductions were applied.`,
              affectedAmount: Math.abs(delta),
              baselineAmount: previousGross,
              currentAmount: record.grossSalary
            });
          }
        }

        // --- Rule 6: Historical Rolling Average Deviation ---
        if (pastRecords.length >= 3) {
          const historicalGrossSum = pastRecords.reduce((acc, r) => acc + (r.grossSalary || 0), 0);
          const historicalAvg = historicalGrossSum / pastRecords.length;

          if (historicalAvg > 0) {
            const devPct = Math.abs(record.grossSalary - historicalAvg) / historicalAvg;
            if (devPct > 0.40) {
              detectedAnomalies.push({
                periodId: period._id,
                periodName: period.periodName,
                employeeId: emp?._id || record.employeeId,
                employeeCode: empCode,
                employeeName: empName,
                departmentName: deptName,
                anomalyType: "HISTORICAL_DEVIATION",
                severity: "Medium",
                title: `Significant Deviation from 6-Month Baseline`,
                description: `Current payout of ₹${record.grossSalary.toLocaleString()} deviates by ${(devPct * 100).toFixed(1)}% from the employee's 6-month historical average (₹${Math.round(historicalAvg).toLocaleString()}).`,
                affectedAmount: Math.abs(record.grossSalary - historicalAvg),
                baselineAmount: Math.round(historicalAvg),
                currentAmount: record.grossSalary
              });
            }
          }
        }
      }

      // --- Rule 7: Department Statistical Outlier ---
      const deptStat = deptStats[deptName];
      if (deptStat && deptStat.salaries.length >= 3 && deptStat.stdDev > 0) {
        const zScore = (record.grossSalary - deptStat.mean) / deptStat.stdDev;
        if (zScore >= 2.2) {
          detectedAnomalies.push({
            periodId: period._id,
            periodName: period.periodName,
            employeeId: emp?._id || record.employeeId,
            employeeCode: empCode,
            employeeName: empName,
            departmentName: deptName,
            anomalyType: "DEPARTMENT_OUTLIER",
            severity: "Low",
            title: `Department Statistical Outlier (Z-Score: ${zScore.toFixed(2)})`,
            description: `Gross salary of ₹${record.grossSalary.toLocaleString()} is statistically higher than the ${deptName} department average (₹${Math.round(deptStat.mean).toLocaleString()} ± ₹${Math.round(deptStat.stdDev).toLocaleString()}).`,
            affectedAmount: Math.round(record.grossSalary - deptStat.mean),
            baselineAmount: Math.round(deptStat.mean),
            currentAmount: record.grossSalary
          });
        }
      }
    }

    // Persist and Deduplicate in Database
    const savedAnomalies = [];
    for (const item of detectedAnomalies) {
      // Find existing alert for this period + employee + anomalyType
      const existing = await SalaryAnomaly.findOne({
        periodId: item.periodId,
        employeeId: item.employeeId,
        anomalyType: item.anomalyType
      });

      if (!existing) {
        const created = await SalaryAnomaly.create(item);
        savedAnomalies.push(created);
      } else if (existing.status === "Pending") {
        // Update metrics if pending without overwriting investigator notes
        existing.affectedAmount = item.affectedAmount;
        existing.baselineAmount = item.baselineAmount;
        existing.currentAmount = item.currentAmount;
        existing.description = item.description;
        await existing.save();
        savedAnomalies.push(existing);
      } else {
        // Keep resolved/dismissed status intact
        savedAnomalies.push(existing);
      }
    }

    return {
      success: true,
      periodName: period.periodName,
      scannedCount: records.length,
      anomaliesFound: savedAnomalies.length,
      anomalies: savedAnomalies
    };
  }
}

module.exports = AnomalyDetectionService;

