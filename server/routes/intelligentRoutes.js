const express = require("express");
const router = express.Router();

const {
  triggerAnomalyScan,
  getAnomalies,
  resolveAnomaly,
  getSimulatorBaseline,
  runSimulation,
  applySimulation,
  getAnalyticsOverview,
  getMySalaryOverview,
  getMySalaryHistory,
  createDiscrepancy,
  getMyDiscrepancies,
  getAllDiscrepancies,
  updateDiscrepancyStatus
} = require("../controllers/intelligentPayrollController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// All intelligent endpoints require a verified JWT session
router.use(protect);

// 1. Feature 1: Smart Salary Anomaly Detection (Admin & HR)
router.post("/anomalies/scan/:periodId", authorizeRoles("admin", "hr"), triggerAnomalyScan);
router.get("/anomalies", authorizeRoles("admin", "hr"), getAnomalies);
router.put("/anomalies/:id/resolve", authorizeRoles("admin", "hr"), resolveAnomaly);

// 2. Feature 2: Salary What-If Simulator (Admin & HR)
router.get("/simulator/baseline", authorizeRoles("admin", "hr"), getSimulatorBaseline);
router.post("/simulator/run", authorizeRoles("admin", "hr"), runSimulation);
router.post("/simulator/apply", authorizeRoles("admin", "hr"), applySimulation);

// 3. Feature 3: Predictive Payroll Analytics (Admin & HR)
router.get("/analytics/overview", authorizeRoles("admin", "hr"), getAnalyticsOverview);

// 4. Feature 4: Employee Salary Transparency Portal (Employee Access)
router.get("/employee-portal/overview", getMySalaryOverview);
router.get("/employee-portal/history", getMySalaryHistory);

// 5. Feature 4 Sub-module: Salary Discrepancy Ticket System
router.post("/discrepancies", createDiscrepancy);
router.get("/discrepancies/my", getMyDiscrepancies);
router.get("/discrepancies", authorizeRoles("admin", "hr"), getAllDiscrepancies);
router.put("/discrepancies/:id/status", authorizeRoles("admin", "hr"), updateDiscrepancyStatus);

module.exports = router;

