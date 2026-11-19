const express = require("express");
const router = express.Router();

const {
  getSalaryStructures,
  createSalaryStructure,
  getTaxRules,
  getDeductionRules,
  getPayrollPeriods,
  getPayrollPeriodById,
  generatePayrollDraft,
  finalizePayroll,
  revertPayrollPeriod,
  deletePayrollPeriod,
  getSalarySlip,
  getMySalarySlips,
  getDashboardSummary,
  getMonthlyPayrollReport,
  getDepartmentSalaryReport,
  getAuditLogs
} = require("../controllers/payrollController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.use(protect);

// Salary structures
router.get("/salary-structures", authorizeRoles("admin", "hr"), getSalaryStructures);
router.post("/salary-structures", authorizeRoles("admin", "hr"), createSalaryStructure);

// Tax & Deductions
router.get("/tax-rules", getTaxRules);
router.get("/deduction-rules", getDeductionRules);

// Payroll operations
router.get("/payroll/periods", getPayrollPeriods);
router.get("/payroll/periods/:id", getPayrollPeriodById);
router.post("/payroll/generate", authorizeRoles("admin", "hr"), generatePayrollDraft);
router.post("/payroll/finalize/:id", authorizeRoles("admin", "hr"), finalizePayroll);
router.post("/payroll/revert/:id", authorizeRoles("admin", "hr"), revertPayrollPeriod);
router.delete("/payroll/periods/:id", authorizeRoles("admin", "hr"), deletePayrollPeriod);

// Salary Slips
router.get("/payroll/slips/:recordId", getSalarySlip);
router.get("/payroll/my-slips", getMySalarySlips);

// Reports & Dashboard
router.get("/reports/dashboard", getDashboardSummary);
router.get("/reports/monthly-payroll", authorizeRoles("admin", "hr"), getMonthlyPayrollReport);
router.get("/reports/department-salary", authorizeRoles("admin", "hr"), getDepartmentSalaryReport);
router.get("/reports/audit-logs", authorizeRoles("admin"), getAuditLogs);

module.exports = router;
