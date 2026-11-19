const Joi = require("joi");

// 1. Anomaly Resolution Validation
const resolveAnomalySchema = Joi.object({
  status: Joi.string()
    .valid("Pending", "Investigating", "Resolved", "Dismissed")
    .required(),
  investigationNotes: Joi.string().allow("").max(1000).optional()
});

// 2. What-If Simulation Validation
const simulationSchema = Joi.object({
  simulationType: Joi.string()
    .valid("individual", "department", "bonus", "hiring", "company")
    .required(),
  employeeId: Joi.string().allow(null, "").optional(),
  departmentId: Joi.string().allow(null, "").optional(),
  incrementPercentage: Joi.number().min(-100).max(500).optional(),
  incrementAmount: Joi.number().min(0).optional(),
  bonusAmount: Joi.number().min(0).optional(),
  bonusPercentage: Joi.number().min(0).max(500).optional(),
  newHiresCount: Joi.number().integer().min(1).max(500).optional(),
  estimatedSalary: Joi.number().min(0).optional(),
  applyToComponent: Joi.string().valid("gross", "basic").default("gross")
});

// 3. Employee Discrepancy Ticket Creation
const createDiscrepancySchema = Joi.object({
  payrollPeriodId: Joi.string().allow(null, "").optional(),
  category: Joi.string()
    .valid(
      "Incorrect Deduction",
      "Missing Bonus",
      "Incorrect Overtime",
      "Salary Calculation Error",
      "Attendance Mismatch",
      "Other"
    )
    .required(),
  subject: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  claimedAmount: Joi.number().min(0).default(0)
});

// 4. Admin Discrepancy Status Update
const updateDiscrepancyStatusSchema = Joi.object({
  status: Joi.string()
    .valid("Pending", "Under Review", "Resolved", "Rejected")
    .required(),
  adminRemarks: Joi.string().allow("").max(1000).optional()
});

module.exports = {
  resolveAnomalySchema,
  simulationSchema,
  createDiscrepancySchema,
  updateDiscrepancyStatusSchema
};

