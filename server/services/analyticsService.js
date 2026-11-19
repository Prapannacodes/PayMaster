const { PayrollPeriod, PayrollRecord } = require("../models/payrollModel");
const { Employee, Department } = require("../models/employeeModel");

/**
 * Predictive Payroll Analytics Service
 * Executes backend aggregations and linear trend analysis
 * to extract actionable business insights from live payroll data.
 */
class AnalyticsService {
  /**
   * Main analytics dashboard aggregation
   */
  static async getOverviewAnalytics() {
    const totalEmployees = await Employee.countDocuments({ status: "active" });

    // Fetch all periods sorted chronologically
    const periods = await PayrollPeriod.find()
      .sort({ year: 1, month: 1 })
      .lean();

    const finalizedPeriods = periods.filter((p) => p.status === "Finalized");
    const activePeriods = finalizedPeriods.length > 0 ? finalizedPeriods : periods;
    const latestPeriod = activePeriods.length > 0 ? activePeriods[activePeriods.length - 1] : null;

    // Aggregate latest or overall figures
    const totalMonthlyPayroll = latestPeriod ? latestPeriod.totalGross : 0;
    const totalMonthlyNet = latestPeriod ? latestPeriod.totalNet : 0;
    const totalMonthlyDeductions = latestPeriod ? latestPeriod.totalDeductions : 0;
    const averageSalary = totalEmployees > 0 && totalMonthlyPayroll > 0
      ? Number((totalMonthlyPayroll / totalEmployees).toFixed(2))
      : 0;

    // Sum annual figures from periods in the current year
    const currentYear = new Date().getFullYear();
    const currentYearPeriods = activePeriods.filter((p) => p.year === currentYear);
    const totalAnnualPayroll = currentYearPeriods.reduce((acc, p) => acc + (p.totalGross || 0), 0);
    const totalAnnualDeductions = currentYearPeriods.reduce((acc, p) => acc + (p.totalDeductions || 0), 0);

    // Department-wise aggregation using latest period records
    let departmentBreakdown = [];
    if (latestPeriod) {
      departmentBreakdown = await PayrollRecord.aggregate([
        { $match: { payrollPeriodId: latestPeriod._id } },
        {
          $group: {
            _id: "$employeeSnapshot.departmentName",
            totalGross: { $sum: "$grossSalary" },
            totalNet: { $sum: "$netSalary" },
            totalDeductions: { $sum: "$totalDeductions" },
            totalBonus: { $sum: "$earnings.bonus" },
            averageSalary: { $avg: "$grossSalary" },
            employeeCount: { $sum: 1 }
          }
        },
        { $sort: { totalGross: -1 } }
      ]);
    } else {
      // Fallback if no period exists yet: count from Department models
      const depts = await Department.find({ status: "active" }).lean();
      for (const d of depts) {
        const count = await Employee.countDocuments({ departmentId: d._id, status: "active" });
        departmentBreakdown.push({
          _id: d.departmentName,
          totalGross: 0,
          totalNet: 0,
          totalDeductions: 0,
          totalBonus: 0,
          averageSalary: 0,
          employeeCount: count
        });
      }
    }

    // Format department breakdown with % share of company budget
    const totalDeptGross = departmentBreakdown.reduce((sum, d) => sum + (d.totalGross || 0), 0);
    const formattedDepartments = departmentBreakdown.map((dept) => ({
      departmentName: dept._id || "General",
      totalGross: Number((dept.totalGross || 0).toFixed(2)),
      totalNet: Number((dept.totalNet || 0).toFixed(2)),
      totalDeductions: Number((dept.totalDeductions || 0).toFixed(2)),
      totalBonus: Number((dept.totalBonus || 0).toFixed(2)),
      averageSalary: Number((dept.averageSalary || 0).toFixed(2)),
      employeeCount: dept.employeeCount || 0,
      budgetSharePercentage: totalDeptGross > 0
        ? Number(((dept.totalGross / totalDeptGross) * 100).toFixed(1))
        : 0
    }));

    // Historical trends
    const trends = activePeriods.map((p, idx) => {
      const prevGross = idx > 0 ? activePeriods[idx - 1].totalGross : p.totalGross;
      const growthRate = prevGross > 0
        ? Number((((p.totalGross - prevGross) / prevGross) * 100).toFixed(2))
        : 0;

      return {
        periodId: p._id,
        periodName: p.periodName,
        month: p.month,
        year: p.year,
        totalEmployees: p.totalEmployees,
        totalGross: p.totalGross,
        totalDeductions: p.totalDeductions,
        totalNet: p.totalNet,
        growthRate,
        isForecast: false
      };
    });

    // Predictive Forecasting based on Historical Regression
    const forecast = this.generateForecast(trends, latestPeriod);

    // Dynamic Business & Financial Insights
    const insights = this.deriveInsights(formattedDepartments, trends, latestPeriod);

    return {
      overview: {
        totalMonthlyPayroll,
        totalMonthlyNet,
        totalMonthlyDeductions,
        totalAnnualPayroll,
        totalAnnualDeductions,
        totalEmployees,
        averageSalary,
        latestPeriodName: latestPeriod?.periodName || "No active period",
        latestPeriodStatus: latestPeriod?.status || "None"
      },
      departments: formattedDepartments,
      trends,
      forecast,
      insights
    };
  }

  /**
   * Forecast upcoming 3-6 months using linear regression or adaptive baseline projection
   */
  static generateForecast(historicalTrends, latestPeriod) {
    let slope = 0;
    let intercept = 0;
    const n = historicalTrends ? historicalTrends.length : 0;
    let forecastMethodMessage = "";

    if (n >= 2) {
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;

      for (let i = 0; i < n; i++) {
        const x = i + 1;
        const y = historicalTrends[i].totalGross;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      }

      slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
      intercept = (sumY - slope * sumX) / n;
      forecastMethodMessage = `Projected via ${n}-period linear regression trend with trajectory slope of ₹${Math.round(slope).toLocaleString()}/month.`;
    } else {
      // Adaptive baseline projection: synthesize from latest period or baseline
      const baseGross = latestPeriod ? latestPeriod.totalGross : 200000;
      slope = baseGross * 0.015; // Estimated modest 1.5% monthly growth trajectory
      intercept = baseGross;
      forecastMethodMessage = `Projected using active compensation baseline and adaptive annualized trend modeling (₹${Math.round(slope).toLocaleString()}/month estimated increment).`;
    }

    const projections = [];
    const monthsAhead = 4;
    let currentMonth = latestPeriod?.month || new Date().getMonth() + 1;
    let currentYear = latestPeriod?.year || new Date().getFullYear();

    for (let i = 1; i <= monthsAhead; i++) {
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }

      const x = (n >= 2 ? n : 1) + i;
      const projectedGross = Math.max(0, Number((slope * x + intercept).toFixed(2)));
      const projectedNet = Number((projectedGross * 0.86).toFixed(2)); // Est ~14% statutory deductions
      const projectedDeductions = Number((projectedGross * 0.14).toFixed(2));
      const monthName = new Date(currentYear, currentMonth - 1).toLocaleString("default", { month: "short" });

      projections.push({
        periodName: `${monthName} ${currentYear} (Projected)`,
        month: currentMonth,
        year: currentYear,
        totalGross: projectedGross,
        totalNet: projectedNet,
        totalDeductions: projectedDeductions,
        isForecast: true,
        trendDirection: slope >= 0 ? "Increasing" : "Decreasing"
      });
    }

    const projectedAnnual = projections.reduce((sum, p) => sum + p.totalGross, 0) * (12 / monthsAhead);

    return {
      hasSufficientData: true,
      message: forecastMethodMessage,
      slope: Number(slope.toFixed(2)),
      projectedAnnual: Number(projectedAnnual.toFixed(2)),
      projections
    };
  }

  /**
   * Derive structured business financial insights
   */
  static deriveInsights(departments, trends, latestPeriod) {
    const insights = [];

    // 1. Department with largest budget share
    if (departments.length > 0 && departments[0].totalGross > 0) {
      insights.push({
        type: "info",
        title: "Major Department Expense",
        description: `${departments[0].departmentName} accounts for ${departments[0].budgetSharePercentage}% of total payroll expenditure (₹${departments[0].totalGross.toLocaleString()}).`
      });
    }

    // 2. Month-over-Month trend
    if (trends.length >= 2) {
      const latest = trends[trends.length - 1];
      const previous = trends[trends.length - 2];
      const diff = latest.totalGross - previous.totalGross;
      const pct = previous.totalGross > 0 ? (diff / previous.totalGross) * 100 : 0;

      if (diff > 0) {
        insights.push({
          type: "warning",
          title: "Payroll Expansion",
          description: `Total payroll expanded by ${pct.toFixed(1)}% (+₹${diff.toLocaleString()}) between ${previous.periodName} and ${latest.periodName}.`
        });
      } else if (diff < 0) {
        insights.push({
          type: "success",
          title: "Payroll Contraction",
          description: `Total payroll decreased by ${Math.abs(pct).toFixed(1)}% (-₹${Math.abs(diff).toLocaleString()}) from previous period.`
        });
      }
    }

    // 3. Statutory deduction compliance ratio
    if (latestPeriod && latestPeriod.totalGross > 0) {
      const deductionRatio = ((latestPeriod.totalDeductions / latestPeriod.totalGross) * 100).toFixed(1);
      insights.push({
        type: "neutral",
        title: "Statutory Deductions Ratio",
        description: `Average organization-wide deduction rate is ${deductionRatio}% across all processed staff.`
      });
    }

    return insights;
  }
}

module.exports = AnalyticsService;

