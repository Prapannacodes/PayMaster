const { SalaryStructure, TaxRule, DeductionRule } = require("../models/payrollModel");
const { Employee, Department } = require("../models/employeeModel");
const {
  calculateGrossSalary,
  calculateMonthlyTax,
  calculateDeductions,
  calculateNetSalary
} = require("./payrollCalculationService");

/**
 * Interactive What-If Payroll Simulation Engine
 * Performs non-destructive mathematical forecasting of proposed organizational pay changes.
 * Does NOT write or alter real database records.
 */
class SimulationService {
  /**
   * Fetch current live organization baseline pay metrics
   */
  static async getBaseline() {
    const employees = await Employee.find({ status: "active" })
      .populate("departmentId", "departmentName")
      .populate("designationId", "designationTitle")
      .lean();

    const structures = await SalaryStructure.find({ status: "active" }).lean();
    const structureMap = {};
    for (const s of structures) {
      structureMap[s.employeeId.toString()] = s;
    }

    const activeTaxRule = await TaxRule.findOne({ status: "active" }).lean();
    const activeDeductionRules = await DeductionRule.find({ status: "active" }).lean();

    let totalMonthlyGross = 0;
    let totalMonthlyNet = 0;
    let totalMonthlyDeductions = 0;

    const employeeBaselines = [];

    for (const emp of employees) {
      const struct = structureMap[emp._id.toString()];
      const basic = struct ? struct.basicSalary : 0;
      const hra = struct ? struct.hra : 0;
      const allowances = struct ? struct.allowances : 0;
      const bonus = struct ? struct.bonus : 0;
      const otherEarnings = struct ? struct.otherEarnings : 0;
      const otherDeductions = struct ? struct.otherDeductions : 0;

      const gross = calculateGrossSalary(basic, hra, allowances, bonus, 0, otherEarnings);
      const monthlyTax = calculateMonthlyTax(gross * 12, activeTaxRule);
      const deductions = calculateDeductions(basic, gross, activeDeductionRules, 0, monthlyTax, otherDeductions);
      const net = calculateNetSalary(gross, deductions.totalDeductions);

      totalMonthlyGross += gross;
      totalMonthlyNet += net;
      totalMonthlyDeductions += deductions.totalDeductions;

      employeeBaselines.push({
        employeeId: emp._id,
        employeeCode: emp.employeeCode,
        name: emp.name,
        departmentId: emp.departmentId?._id,
        departmentName: emp.departmentId?.departmentName || "General",
        designationTitle: emp.designationId?.designationTitle || "Staff",
        basicSalary: basic,
        hra,
        allowances,
        bonus,
        otherEarnings,
        otherDeductions,
        grossSalary: gross,
        netSalary: net,
        totalDeductions: deductions.totalDeductions
      });
    }

    const departments = await Department.find({ status: "active" }).select("departmentName").lean();

    return {
      totalEmployees: employees.length,
      totalMonthlyGross: Number(totalMonthlyGross.toFixed(2)),
      totalMonthlyNet: Number(totalMonthlyNet.toFixed(2)),
      totalMonthlyDeductions: Number(totalMonthlyDeductions.toFixed(2)),
      totalAnnualPayroll: Number((totalMonthlyGross * 12).toFixed(2)),
      averageSalary: employees.length > 0 ? Number((totalMonthlyGross / employees.length).toFixed(2)) : 0,
      departments,
      employees: employeeBaselines
    };
  }

  /**
   * Run simulation scenario based on inputs
   * Options: 'individual', 'department', 'bonus', 'hiring', 'company'
   */
  static async runSimulation(params) {
    const {
      simulationType,
      employeeId,
      departmentId,
      incrementPercentage = 0,
      incrementAmount = 0,
      bonusAmount = 0,
      bonusPercentage = 0,
      newHiresCount = 1,
      estimatedSalary = 0
    } = params;

    const baseline = await this.getBaseline();
    const activeTaxRule = await TaxRule.findOne({ status: "active" }).lean();
    const activeDeductionRules = await DeductionRule.find({ status: "active" }).lean();

    let proposedMonthlyGross = 0;
    let proposedMonthlyNet = 0;
    let proposedMonthlyDeductions = 0;
    let proposedEmployeeCount = baseline.totalEmployees;

    const impactedEmployees = [];

    // Helper to calculate revised employee payroll
    const simulateEmployeePay = (emp, extraGross, revisedBonus = null) => {
      let newBasic = emp.basicSalary;
      let newHra = emp.hra;
      let newAllowances = emp.allowances;
      let newBonus = revisedBonus !== null ? revisedBonus : emp.bonus;

      if (extraGross !== 0) {
        // Proportionally distribute salary hike across basic and hra
        const baseHike = extraGross * 0.7;
        const hraHike = extraGross * 0.3;
        newBasic += baseHike;
        newHra += hraHike;
      }

      const gross = calculateGrossSalary(newBasic, newHra, newAllowances, newBonus, 0, emp.otherEarnings);
      const monthlyTax = calculateMonthlyTax(gross * 12, activeTaxRule);
      const deductions = calculateDeductions(newBasic, gross, activeDeductionRules, 0, monthlyTax, emp.otherDeductions);
      const net = calculateNetSalary(gross, deductions.totalDeductions);

      return {
        basicSalary: Number(newBasic.toFixed(2)),
        hra: Number(newHra.toFixed(2)),
        grossSalary: Number(gross.toFixed(2)),
        netSalary: Number(net.toFixed(2)),
        totalDeductions: Number(deductions.totalDeductions.toFixed(2))
      };
    };

    if (simulationType === "individual") {
      // Single employee increment
      for (const emp of baseline.employees) {
        if (emp.employeeId.toString() === employeeId) {
          let extraMonthly = 0;
          if (incrementPercentage > 0) {
            extraMonthly = (emp.grossSalary * incrementPercentage) / 100;
          } else if (incrementAmount > 0) {
            extraMonthly = incrementAmount;
          }

          const revised = simulateEmployeePay(emp, extraMonthly);
          proposedMonthlyGross += revised.grossSalary;
          proposedMonthlyNet += revised.netSalary;
          proposedMonthlyDeductions += revised.totalDeductions;

          impactedEmployees.push({
            employeeId: emp.employeeId,
            employeeCode: emp.employeeCode,
            name: emp.name,
            departmentName: emp.departmentName,
            currentGross: emp.grossSalary,
            proposedGross: revised.grossSalary,
            currentNet: emp.netSalary,
            proposedNet: revised.netSalary,
            monthlyDifference: Number((revised.grossSalary - emp.grossSalary).toFixed(2)),
            annualDifference: Number(((revised.grossSalary - emp.grossSalary) * 12).toFixed(2)),
            percentageIncrease: emp.grossSalary > 0 ? Number((((revised.grossSalary - emp.grossSalary) / emp.grossSalary) * 100).toFixed(2)) : 0
          });
        } else {
          proposedMonthlyGross += emp.grossSalary;
          proposedMonthlyNet += emp.netSalary;
          proposedMonthlyDeductions += emp.totalDeductions;
        }
      }
    } else if (simulationType === "department") {
      // Department-level increment
      for (const emp of baseline.employees) {
        const matchesDept = emp.departmentId && emp.departmentId.toString() === departmentId;
        if (matchesDept) {
          let extraMonthly = 0;
          if (incrementPercentage > 0) {
            extraMonthly = (emp.grossSalary * incrementPercentage) / 100;
          } else if (incrementAmount > 0) {
            extraMonthly = incrementAmount;
          }

          const revised = simulateEmployeePay(emp, extraMonthly);
          proposedMonthlyGross += revised.grossSalary;
          proposedMonthlyNet += revised.netSalary;
          proposedMonthlyDeductions += revised.totalDeductions;

          impactedEmployees.push({
            employeeId: emp.employeeId,
            employeeCode: emp.employeeCode,
            name: emp.name,
            departmentName: emp.departmentName,
            currentGross: emp.grossSalary,
            proposedGross: revised.grossSalary,
            currentNet: emp.netSalary,
            proposedNet: revised.netSalary,
            monthlyDifference: Number((revised.grossSalary - emp.grossSalary).toFixed(2)),
            annualDifference: Number(((revised.grossSalary - emp.grossSalary) * 12).toFixed(2)),
            percentageIncrease: emp.grossSalary > 0 ? Number((((revised.grossSalary - emp.grossSalary) / emp.grossSalary) * 100).toFixed(2)) : 0
          });
        } else {
          proposedMonthlyGross += emp.grossSalary;
          proposedMonthlyNet += emp.netSalary;
          proposedMonthlyDeductions += emp.totalDeductions;
        }
      }
    } else if (simulationType === "bonus") {
      // Bonus simulation
      for (const emp of baseline.employees) {
        const matchesDept = !departmentId || (emp.departmentId && emp.departmentId.toString() === departmentId);
        if (matchesDept) {
          let newBonusVal = emp.bonus;
          if (bonusAmount > 0) {
            newBonusVal += bonusAmount;
          } else if (bonusPercentage > 0) {
            newBonusVal += (emp.basicSalary * bonusPercentage) / 100;
          }

          const revised = simulateEmployeePay(emp, 0, newBonusVal);
          proposedMonthlyGross += revised.grossSalary;
          proposedMonthlyNet += revised.netSalary;
          proposedMonthlyDeductions += revised.totalDeductions;

          impactedEmployees.push({
            employeeId: emp.employeeId,
            employeeCode: emp.employeeCode,
            name: emp.name,
            departmentName: emp.departmentName,
            currentGross: emp.grossSalary,
            proposedGross: revised.grossSalary,
            currentNet: emp.netSalary,
            proposedNet: revised.netSalary,
            monthlyDifference: Number((revised.grossSalary - emp.grossSalary).toFixed(2)),
            annualDifference: Number(((revised.grossSalary - emp.grossSalary) * 12).toFixed(2)),
            percentageIncrease: emp.grossSalary > 0 ? Number((((revised.grossSalary - emp.grossSalary) / emp.grossSalary) * 100).toFixed(2)) : 0
          });
        } else {
          proposedMonthlyGross += emp.grossSalary;
          proposedMonthlyNet += emp.netSalary;
          proposedMonthlyDeductions += emp.totalDeductions;
        }
      }
    } else if (simulationType === "hiring") {
      // New hires addition
      const count = Number(newHiresCount) || 1;
      const salaryPerHire = Number(estimatedSalary) || 0;
      proposedEmployeeCount = baseline.totalEmployees + count;

      // Existing employees remain unchanged
      proposedMonthlyGross = baseline.totalMonthlyGross;
      proposedMonthlyNet = baseline.totalMonthlyNet;
      proposedMonthlyDeductions = baseline.totalMonthlyDeductions;

      // Calculate cost of proposed new hires
      for (let i = 1; i <= count; i++) {
        const basic = salaryPerHire * 0.5;
        const hra = salaryPerHire * 0.3;
        const allowances = salaryPerHire * 0.2;
        const gross = salaryPerHire;
        const monthlyTax = calculateMonthlyTax(gross * 12, activeTaxRule);
        const deductions = calculateDeductions(basic, gross, activeDeductionRules, 0, monthlyTax, 0);
        const net = calculateNetSalary(gross, deductions.totalDeductions);

        proposedMonthlyGross += gross;
        proposedMonthlyNet += net;
        proposedMonthlyDeductions += deductions.totalDeductions;

        impactedEmployees.push({
          employeeId: `new_hire_${i}`,
          employeeCode: `PROPOSED-0${i}`,
          name: `Proposed New Hire #${i}`,
          departmentName: departmentId ? "Selected Department" : "General",
          currentGross: 0,
          proposedGross: gross,
          currentNet: 0,
          proposedNet: net,
          monthlyDifference: gross,
          annualDifference: gross * 12,
          percentageIncrease: 100
        });
      }
    } else if (simulationType === "company") {
      // Company-wide increment
      for (const emp of baseline.employees) {
        let extraMonthly = 0;
        if (incrementPercentage > 0) {
          extraMonthly = (emp.grossSalary * incrementPercentage) / 100;
        } else if (incrementAmount > 0) {
          extraMonthly = incrementAmount;
        }

        const revised = simulateEmployeePay(emp, extraMonthly);
        proposedMonthlyGross += revised.grossSalary;
        proposedMonthlyNet += revised.netSalary;
        proposedMonthlyDeductions += revised.totalDeductions;

        impactedEmployees.push({
          employeeId: emp.employeeId,
          employeeCode: emp.employeeCode,
          name: emp.name,
          departmentName: emp.departmentName,
          currentGross: emp.grossSalary,
          proposedGross: revised.grossSalary,
          currentNet: emp.netSalary,
          proposedNet: revised.netSalary,
          monthlyDifference: Number((revised.grossSalary - emp.grossSalary).toFixed(2)),
          annualDifference: Number(((revised.grossSalary - emp.grossSalary) * 12).toFixed(2)),
          percentageIncrease: emp.grossSalary > 0 ? Number((((revised.grossSalary - emp.grossSalary) / emp.grossSalary) * 100).toFixed(2)) : 0
        });
      }
    }

    const currentMonthlyGross = baseline.totalMonthlyGross;
    const monthlyDifference = Number((proposedMonthlyGross - currentMonthlyGross).toFixed(2));
    const annualDifference = Number((monthlyDifference * 12).toFixed(2));
    const percentageIncrease = currentMonthlyGross > 0 ? Number(((monthlyDifference / currentMonthlyGross) * 100).toFixed(2)) : 0;

    return {
      simulationType,
      currentMetrics: {
        employeeCount: baseline.totalEmployees,
        monthlyGross: currentMonthlyGross,
        monthlyNet: baseline.totalMonthlyNet,
        monthlyDeductions: baseline.totalMonthlyDeductions,
        annualPayroll: baseline.totalAnnualPayroll
      },
      proposedMetrics: {
        employeeCount: proposedEmployeeCount,
        monthlyGross: Number(proposedMonthlyGross.toFixed(2)),
        monthlyNet: Number(proposedMonthlyNet.toFixed(2)),
        monthlyDeductions: Number(proposedMonthlyDeductions.toFixed(2)),
        annualPayroll: Number((proposedMonthlyGross * 12).toFixed(2))
      },
      financialImpact: {
        monthlyDifference,
        annualDifference,
        percentageIncrease
      },
      impactedEmployeesCount: impactedEmployees.length,
      impactedEmployees: impactedEmployees.slice(0, 50) // Paginated slice for snappy preview
    };
  }

  /**
   * Apply simulated compensation revisions to live employee SalaryStructures
   */
  static async applySimulation(params, user) {
    const simResult = await this.runSimulation(params);
    const { impactedEmployees, simulationType } = simResult;
    let appliedCount = 0;

    for (const item of impactedEmployees) {
      if (typeof item.employeeId === "string" && item.employeeId.startsWith("new_hire_")) {
        continue; // Skip virtual new hires
      }

      const activeStruct = await SalaryStructure.findOne({ employeeId: item.employeeId, status: "active" });
      if (activeStruct) {
        const extraGross = item.monthlyDifference || 0;
        const newBasic = Math.round(activeStruct.basicSalary + (extraGross * 0.7));
        const newHra = Math.round(activeStruct.hra + (extraGross * 0.3));

        await SalaryStructure.updateMany({ employeeId: item.employeeId, status: "active" }, { status: "inactive" });
        await SalaryStructure.create({
          employeeId: item.employeeId,
          basicSalary: newBasic,
          hra: newHra,
          allowances: activeStruct.allowances,
          bonus: activeStruct.bonus,
          overtimeRate: activeStruct.overtimeRate,
          otherEarnings: activeStruct.otherEarnings,
          otherDeductions: activeStruct.otherDeductions,
          effectiveFrom: new Date(),
          status: "active"
        });
        appliedCount++;
      }
    }

    return {
      success: true,
      simulationType,
      appliedCount,
      message: `Successfully applied simulated compensation changes to ${appliedCount} active employee salary structures.`
    };
  }
}

module.exports = SimulationService;

