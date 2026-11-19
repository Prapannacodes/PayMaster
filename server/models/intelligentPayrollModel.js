const mongoose = require("mongoose");

// 1. Salary Anomaly Schema
const salaryAnomalySchema = new mongoose.Schema({
  periodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PayrollPeriod",
    required: false
  },
  periodName: {
    type: String,
    default: ""
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  employeeCode: {
    type: String,
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  departmentName: {
    type: String,
    default: "General"
  },
  anomalyType: {
    type: String,
    required: true,
    enum: [
      "UNEXPECTED_SALARY_CHANGE",
      "HIGH_DEDUCTION",
      "DUPLICATE_ENTRY",
      "MISSING_OVERTIME",
      "UNEXPECTED_BONUS",
      "HISTORICAL_DEVIATION",
      "DEPARTMENT_OUTLIER"
    ]
  },
  severity: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium"
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  affectedAmount: {
    type: Number,
    default: 0
  },
  baselineAmount: {
    type: Number,
    default: 0
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["Pending", "Investigating", "Resolved", "Dismissed"],
    default: "Pending"
  },
  investigatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  investigatedByName: {
    type: String,
    default: ""
  },
  investigationNotes: {
    type: String,
    default: ""
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate alerts for the same underlying issue in a period
salaryAnomalySchema.index({ periodId: 1, employeeId: 1, anomalyType: 1 }, { unique: true });

// 2. Salary Discrepancy Schema (Employee query / dispute ticket)
const salaryDiscrepancySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  employeeCode: {
    type: String,
    required: true
  },
  departmentName: {
    type: String,
    default: ""
  },
  payrollPeriodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PayrollPeriod",
    default: null
  },
  periodName: {
    type: String,
    default: "General Query"
  },
  category: {
    type: String,
    enum: [
      "Incorrect Deduction",
      "Missing Bonus",
      "Incorrect Overtime",
      "Salary Calculation Error",
      "Attendance Mismatch",
      "Other"
    ],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  claimedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ["Pending", "Under Review", "Resolved", "Rejected"],
    default: "Pending"
  },
  adminRemarks: {
    type: String,
    default: ""
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  reviewedByName: {
    type: String,
    default: ""
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

salaryDiscrepancySchema.index({ employeeId: 1, createdAt: -1 });

const SalaryAnomaly = mongoose.model("SalaryAnomaly", salaryAnomalySchema);
const SalaryDiscrepancy = mongoose.model("SalaryDiscrepancy", salaryDiscrepancySchema);

module.exports = {
  SalaryAnomaly,
  SalaryDiscrepancy
};

