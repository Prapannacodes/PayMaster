const Joi = require("joi");
const {
  PayrollPeriod,
  PayrollRecord,
  SalaryStructure,
  TaxRule,
  DeductionRule,
  AuditLog
} = require("../models/payrollModel");

const { Employee, Department, Designation } = require("../models/employeeModel");
const { Attendance, Leave } = require("../models/attendanceModel");

const {
  calculatePayableDays,
  calculateGrossSalary,
  calculateAttendanceDeduction,
  calculateMonthlyTax,
  calculateDeductions,
  calculateNetSalary
} = require("../services/payrollCalculationService");

// --- 1. Salary Structures ---
async function getSalaryStructures(req, res) {
  try {
    const structures = await SalaryStructure.find()
      .populate({
        path: "employeeId",
        select: "employeeCode name email departmentId",
        populate: { path: "departmentId", select: "departmentName" }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: structures.length, structures });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch salary structures", error: error.message });
  }
}

async function createSalaryStructure(req, res) {
  try {
    // Joi validation
    const schema = Joi.object({
      employeeId: Joi.string().required(),
      basicSalary: Joi.number().min(0).required(),
      hra: Joi.number().min(0).optional(),
      allowances: Joi.number().min(0).optional(),
      bonus: Joi.number().min(0).optional(),
      overtimeRate: Joi.number().min(0).optional(),
      otherEarnings: Joi.number().min(0).optional(),
      otherDeductions: Joi.number().min(0).optional(),
      effectiveFrom: Joi.date().optional()
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { employeeId, basicSalary, hra, allowances, bonus, overtimeRate, otherEarnings, otherDeductions, effectiveFrom } = req.body;

    await SalaryStructure.updateMany({ employeeId, status: "active" }, { status: "inactive" });

    const structure = new SalaryStructure({
      employeeId,
      basicSalary: Number(basicSalary) || 0,
      hra: Number(hra) || 0,
      allowances: Number(allowances) || 0,
      bonus: Number(bonus) || 0,
      overtimeRate: Number(overtimeRate) || 0,
      otherEarnings: Number(otherEarnings) || 0,
      otherDeductions: Number(otherDeductions) || 0,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      status: "active"
    });

    await structure.save();
    res.status(201).json({ success: true, message: "Salary structure saved", structure });
  } catch (error) {
    res.status(500).json({ message: "Could not save salary structure", error: error.message });
  }
}

// --- 2. Tax & Deduction Rules ---
async function getTaxRules(req, res) {
  try {
    const rules = await TaxRule.find().sort({ createdAt: -1 });
    res.json({ success: true, rules });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tax rules", error: error.message });
  }
}

async function getDeductionRules(req, res) {
  try {
    const rules = await DeductionRule.find().sort({ createdAt: 1 });
    res.json({ success: true, rules });
  } catch (error) {
    res.status(500).json({ message: "Error fetching deduction rules", error: error.message });
  }
}

// --- 3. Payroll Period & Calculation Engine ---
async function getPayrollPeriods(req, res) {
  try {
    const periods = await PayrollPeriod.find().sort({ year: -1, month: -1 });
    res.json({ success: true, periods });
  } catch (error) {
    res.status(500).json({ message: "Error fetching periods", error: error.message });
  }
}

async function getPayrollPeriodById(req, res) {
  try {
    const period = await PayrollPeriod.findById(req.params.id);
    if (!period) return res.status(404).json({ message: "Period not found" });

    const records = await PayrollRecord.find({ payrollPeriodId: period._id })
      .populate("employeeId", "employeeCode name email")
      .sort({ "employeeSnapshot.employeeCode": 1 });

    res.json({ success: true, period, records });
  } catch (error) {
    res.status(500).json({ message: "Error fetching period details", error: error.message });
  }
}

async function generatePayrollDraft(req, res) {
  try {
    // Joi validation
    const schema = Joi.object({
      month: Joi.number().min(1).max(12).required(),
      year: Joi.number().min(2000).required()
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { month, year } = req.body;
    const m = Number(month);
    const y = Number(year);
    const totalDaysInMonth = new Date(y, m, 0).getDate();
    const periodName = `${new Date(y, m - 1).toLocaleString('default', { month: 'long' })} ${y}`;

    let period = await PayrollPeriod.findOne({ month: m, year: y });
    if (period && period.status === "Finalized") {
      return res.status(400).json({ message: `Payroll for ${periodName} is already Finalized` });
    }

    if (!period) {
      period = new PayrollPeriod({ month: m, year: y, periodName, totalDays: totalDaysInMonth, status: "Draft" });
      await period.save();
    }

    const activeTaxRule = await TaxRule.findOne({ status: "active" });
    const activeDeductionRules = await DeductionRule.find({ status: "active" });
    const employees = await Employee.find({ status: "active" }).populate("departmentId").populate("designationId");

    let periodGross = 0;
    let periodDeductions = 0;
    let periodNet = 0;
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    for (const emp of employees) {
      const structure = await SalaryStructure.findOne({ employeeId: emp._id, status: "active" });
      const basic = structure ? structure.basicSalary : 0;
      const hra = structure ? structure.hra : 0;
      const allowances = structure ? structure.allowances : 0;
      const bonus = structure ? structure.bonus : 0;
      const overtimeRate = structure ? structure.overtimeRate : 0;
      const otherEarnings = structure ? structure.otherEarnings : 0;
      const otherDeductions = structure ? structure.otherDeductions : 0;

      // Attendance check
      const attendanceList = await Attendance.find({ employeeId: emp._id, date: { $gte: startDate, $lte: endDate } });
      let presentDays = 0, absentDays = 0, halfDays = 0, totalOt = 0;

      for (const att of attendanceList) {
        if (att.status === "Present") presentDays++;
        else if (att.status === "Absent") absentDays++;
        else if (att.status === "Half Day") halfDays++;
        if (att.overtimeHours) totalOt += att.overtimeHours;
      }
      if (attendanceList.length === 0) presentDays = totalDaysInMonth;

      // Leaves check
      const leaves = await Leave.find({ employeeId: emp._id, status: "Approved" });
      let paidLeaveDays = 0, unpaidLeaveDays = 0;
      for (const lv of leaves) {
        if (lv.isPaid) paidLeaveDays += lv.days;
        else unpaidLeaveDays += lv.days;
      }

      // Calculations
      const payableDays = calculatePayableDays(totalDaysInMonth, presentDays, halfDays, paidLeaveDays);
      const overtimePay = Number((totalOt * overtimeRate).toFixed(2));
      const grossSalary = calculateGrossSalary(basic, hra, allowances, bonus, overtimePay, otherEarnings);
      const attDeduction = calculateAttendanceDeduction(basic, totalDaysInMonth, absentDays, halfDays, unpaidLeaveDays);
      const monthlyTax = calculateMonthlyTax(grossSalary * 12, activeTaxRule);

      const deductions = calculateDeductions(basic, grossSalary, activeDeductionRules, attDeduction, monthlyTax, otherDeductions);
      const netSalary = calculateNetSalary(grossSalary, deductions.totalDeductions);

      await PayrollRecord.findOneAndUpdate(
        { payrollPeriodId: period._id, employeeId: emp._id },
        {
          employeeSnapshot: {
            employeeCode: emp.employeeCode,
            name: emp.name,
            email: emp.email,
            departmentName: emp.departmentId?.departmentName || "General",
            designationTitle: emp.designationId?.designationTitle || "Staff",
            panNumber: emp.bankDetails?.panNumber || "",
            bankName: emp.bankDetails?.bankName || "",
            accountNumber: emp.bankDetails?.accountNumber || ""
          },
          month: m,
          year: y,
          totalDays: totalDaysInMonth,
          presentDays,
          absentDays,
          halfDays,
          paidLeaveDays,
          unpaidLeaveDays,
          payableDays,
          overtimeHours: totalOt,
          earnings: { basicSalary: basic, hra, allowances, bonus, overtimePay, otherEarnings },
          grossSalary,
          deductions,
          totalDeductions: deductions.totalDeductions,
          netSalary,
          status: "Draft"
        },
        { new: true, upsert: true }
      );

      periodGross += grossSalary;
      periodDeductions += deductions.totalDeductions;
      periodNet += netSalary;
    }

    period.totalEmployees = employees.length;
    period.totalGross = Number(periodGross.toFixed(2));
    period.totalDeductions = Number(periodDeductions.toFixed(2));
    period.totalNet = Number(periodNet.toFixed(2));
    period.status = "Draft";
    await period.save();

    const records = await PayrollRecord.find({ payrollPeriodId: period._id });
    res.json({ success: true, message: `Payroll draft generated for ${periodName}`, period, records });
  } catch (error) {
    res.status(500).json({ message: "Could not generate payroll", error: error.message });
  }
}

async function finalizePayroll(req, res) {
  try {
    const period = await PayrollPeriod.findByIdAndUpdate(
      req.params.id,
      { status: "Finalized", finalizedAt: new Date() },
      { new: true }
    );
    if (!period) return res.status(404).json({ message: "Period not found" });

    await PayrollRecord.updateMany({ payrollPeriodId: period._id }, { status: "Finalized" });
    res.json({ success: true, message: `Payroll for ${period.periodName} finalized successfully`, period });
  } catch (error) {
    res.status(500).json({ message: "Could not finalize payroll", error: error.message });
  }
}

// --- 4. Salary Slips ---
async function getSalarySlip(req, res) {
  try {
    const record = await PayrollRecord.findById(req.params.recordId).populate("payrollPeriodId").populate("employeeId");
    if (!record) return res.status(404).json({ message: "Salary record not found" });
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ message: "Error fetching slip", error: error.message });
  }
}

async function getMySalarySlips(req, res) {
  try {
    if (!req.user.employeeId) return res.status(400).json({ message: "No employee profile linked to your user" });
    const slips = await PayrollRecord.find({ employeeId: req.user.employeeId, status: "Finalized" })
      .populate("payrollPeriodId", "periodName month year")
      .sort({ year: -1, month: -1 });

    res.json({ success: true, slips });
  } catch (error) {
    res.status(500).json({ message: "Error fetching your slips", error: error.message });
  }
}

// --- 5. Dashboard, Reports & Audit ---
async function getDashboardSummary(req, res) {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: "active" });
    const totalDepartments = await Department.countDocuments({ status: "active" });
    const pendingLeaves = await Leave.countDocuments({ status: "Pending" });
    const latestPayroll = await PayrollPeriod.findOne().sort({ year: -1, month: -1 });

    res.json({
      success: true,
      stats: { totalEmployees, activeEmployees, totalDepartments, pendingLeaves, latestPayroll }
    });
  } catch (error) {
    res.status(500).json({ message: "Error loading dashboard", error: error.message });
  }
}

async function getMonthlyPayrollReport(req, res) {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const periods = await PayrollPeriod.find({ year }).sort({ month: 1 });
    res.json({ success: true, year, periods });
  } catch (error) {
    res.status(500).json({ message: "Error loading report", error: error.message });
  }
}

async function getDepartmentSalaryReport(req, res) {
  try {
    const departments = await Department.find({ status: "active" });
    const report = [];
    for (const d of departments) {
      const count = await Employee.countDocuments({ departmentId: d._id, status: "active" });
      report.push({ departmentId: d._id, departmentName: d.departmentName, employeeCount: count });
    }
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ message: "Error loading department report", error: error.message });
  }
}

async function getAuditLogs(req, res) {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching audit logs", error: error.message });
  }
}

module.exports = {
  getSalaryStructures,
  createSalaryStructure,
  getTaxRules,
  getDeductionRules,
  getPayrollPeriods,
  getPayrollPeriodById,
  generatePayrollDraft,
  finalizePayroll,
  getSalarySlip,
  getMySalarySlips,
  getDashboardSummary,
  getMonthlyPayrollReport,
  getDepartmentSalaryReport,
  getAuditLogs
};
