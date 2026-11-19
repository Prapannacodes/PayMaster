const mongoose = require("mongoose");

// 1. Salary Structure Schema
const salaryStructureSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  basicSalary: { type: Number, required: true, min: 0 },
  hra: { type: Number, default: 0, min: 0 },
  allowances: { type: Number, default: 0, min: 0 },
  bonus: { type: Number, default: 0, min: 0 },
  overtimeRate: { type: Number, default: 0, min: 0 },
  otherEarnings: { type: Number, default: 0, min: 0 },
  otherDeductions: { type: Number, default: 0, min: 0 },
  effectiveFrom: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now }
});

// 2. Tax Rule Schema
const taxRuleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  financialYear: { type: String, required: true, default: "2025-2026" },
  regime: { type: String, enum: ["New Regime", "Old Regime", "Standard"], default: "Standard" },
  standardDeduction: { type: Number, default: 50000, min: 0 },
  slabs: [{
    minIncome: { type: Number, required: true },
    maxIncome: { type: Number, default: null },
    ratePercentage: { type: Number, required: true }
  }],
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now }
});

// 3. Deduction Rule Schema (PF, PT)
const deductionRuleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  type: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
  value: { type: Number, required: true, min: 0 },
  appliesTo: { type: String, enum: ["basic", "gross"], default: "basic" },
  description: { type: String, default: "" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now }
});

// 4. Payroll Period Schema
const payrollPeriodSchema = new mongoose.Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  periodName: { type: String, required: true },
  totalDays: { type: Number, required: true },
  status: { type: String, enum: ["Draft", "Processing", "Finalized"], default: "Draft" },
  totalEmployees: { type: Number, default: 0 },
  totalGross: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  totalNet: { type: Number, default: 0 },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  finalizedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});
payrollPeriodSchema.index({ year: 1, month: 1 }, { unique: true });

// 5. Payroll Record Schema (Immutable employee snapshot)
const payrollRecordSchema = new mongoose.Schema({
  payrollPeriodId: { type: mongoose.Schema.Types.ObjectId, ref: "PayrollPeriod", required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  employeeSnapshot: {
    employeeCode: String,
    name: String,
    email: String,
    departmentName: String,
    designationTitle: String,
    panNumber: String,
    bankName: String,
    accountNumber: String
  },
  month: Number,
  year: Number,
  totalDays: Number,
  presentDays: Number,
  absentDays: Number,
  halfDays: Number,
  paidLeaveDays: Number,
  unpaidLeaveDays: Number,
  payableDays: Number,
  overtimeHours: Number,
  earnings: {
    basicSalary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    otherEarnings: { type: Number, default: 0 }
  },
  grossSalary: { type: Number, default: 0 },
  deductions: {
    pf: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    attendanceDeduction: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    tax: { type: Number, default: 0 }
  },
  totalDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  status: { type: String, enum: ["Draft", "Finalized"], default: "Draft" },
  createdAt: { type: Date, default: Date.now }
});
payrollRecordSchema.index({ payrollPeriodId: 1, employeeId: 1 }, { unique: true });

// 6. Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  performedByName: { type: String, default: "System" },
  details: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now }
});

const SalaryStructure = mongoose.model("SalaryStructure", salaryStructureSchema);
const TaxRule = mongoose.model("TaxRule", taxRuleSchema);
const DeductionRule = mongoose.model("DeductionRule", deductionRuleSchema);
const PayrollPeriod = mongoose.model("PayrollPeriod", payrollPeriodSchema);
const PayrollRecord = mongoose.model("PayrollRecord", payrollRecordSchema);
const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = {
  SalaryStructure,
  TaxRule,
  DeductionRule,
  PayrollPeriod,
  PayrollRecord,
  AuditLog
};
