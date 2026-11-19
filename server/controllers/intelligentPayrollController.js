const { SalaryAnomaly, SalaryDiscrepancy } = require("../models/intelligentPayrollModel");
const { PayrollPeriod, PayrollRecord, SalaryStructure } = require("../models/payrollModel");
const { Employee, Department, Designation } = require("../models/employeeModel");
const User = require("../models/userModel");
const AnomalyDetectionService = require("../services/anomalyDetectionService");
const SimulationService = require("../services/simulationService");
const AnalyticsService = require("../services/analyticsService");
const {
  resolveAnomalySchema,
  simulationSchema,
  createDiscrepancySchema,
  updateDiscrepancyStatusSchema
} = require("../utils/validation");

// --- 1. Smart Salary Anomaly Detection Endpoints ---

/**
 * Trigger anomaly scan for a given period or latest period
 */
async function triggerAnomalyScan(req, res) {
  try {
    let { periodId } = req.params;

    if (!periodId || periodId === "latest") {
      const latest = await PayrollPeriod.findOne().sort({ year: -1, month: -1 });
      if (!latest) {
        return res.status(400).json({
          success: false,
          message: "No payroll period available to scan. Please process a payroll period first."
        });
      }
      periodId = latest._id;
    }

    const result = await AnomalyDetectionService.scanPeriod(periodId);
    res.json({
      success: true,
      message: `Anomaly detection scan completed for ${result.periodName}`,
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Fetch detected salary anomalies with optional filters
 */
async function getAnomalies(req, res) {
  try {
    const { status, severity, periodId } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;
    if (severity && severity !== "all") filter.severity = severity;
    if (periodId && periodId !== "all") filter.periodId = periodId;

    const anomalies = await SalaryAnomaly.find(filter)
      .populate("periodId", "periodName month year")
      .populate("employeeId", "employeeCode name email")
      .sort({ createdAt: -1 })
      .limit(100);

    const stats = {
      total: await SalaryAnomaly.countDocuments(),
      pending: await SalaryAnomaly.countDocuments({ status: "Pending" }),
      highSeverity: await SalaryAnomaly.countDocuments({ severity: "High", status: "Pending" }),
      resolved: await SalaryAnomaly.countDocuments({ status: "Resolved" })
    };

    res.json({ success: true, stats, anomalies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Admin investigate & resolve/dismiss an anomaly alert
 */
async function resolveAnomaly(req, res) {
  try {
    const { error, value } = resolveAnomalySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { status, investigationNotes } = value;
    const anomaly = await SalaryAnomaly.findById(req.params.id);
    if (!anomaly) {
      return res.status(404).json({ success: false, message: "Anomaly alert not found" });
    }

    anomaly.status = status;
    anomaly.investigationNotes = investigationNotes || anomaly.investigationNotes;
    anomaly.investigatedBy = req.user._id;
    anomaly.investigatedByName = req.user.username;
    if (status === "Resolved" || status === "Dismissed") {
      anomaly.resolvedAt = new Date();
    }

    await anomaly.save();

    res.json({
      success: true,
      message: `Anomaly alert marked as ${status}`,
      anomaly
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// --- 2. Salary What-If Simulator Endpoints ---

/**
 * Get current organization baseline for simulation
 */
async function getSimulatorBaseline(req, res) {
  try {
    const baseline = await SimulationService.getBaseline();
    res.json({ success: true, baseline });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Execute What-If simulation calculation (non-destructive)
 */
async function runSimulation(req, res) {
  try {
    const { error, value } = simulationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const result = await SimulationService.runSimulation(value);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Apply What-If simulation changes to live employee SalaryStructures
 */
async function applySimulation(req, res) {
  try {
    const { error, value } = simulationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const result = await SimulationService.applySimulation(value, req.user);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// --- 3. Predictive Payroll Analytics Endpoints ---

/**
 * Get aggregated analytics overview, department breakdowns, trends and forecast
 */
async function getAnalyticsOverview(req, res) {
  try {
    const data = await AnalyticsService.getOverviewAnalytics();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// --- 4. Employee Salary Transparency Portal Endpoints ---

/**
 * Helper to ensure user is securely linked to an Employee record
 */
async function ensureEmployeeProfile(user) {
  let employeeId = user.employeeId;
  if (!employeeId) {
    // Attempt auto-match by email
    const match = await Employee.findOne({ email: user.email.toLowerCase() });
    if (match) {
      employeeId = match._id;
      await User.findByIdAndUpdate(user._id, { employeeId });
      user.employeeId = employeeId;
    } else {
      // Auto-provision employee profile so employee is never locked out
      const defaultDept = await Department.findOne() || await Department.create({ departmentName: "General" });
      const defaultDesig = await Designation.findOne() || await Designation.create({
        designationTitle: "Associate",
        departmentId: defaultDept._id
      });
      const newEmp = await Employee.create({
        employeeCode: `EMP${Math.floor(100 + Math.random() * 900)}`,
        name: user.username,
        email: user.email.toLowerCase(),
        departmentId: defaultDept._id,
        designationId: defaultDesig._id,
        joiningDate: new Date(),
        status: "active"
      });
      employeeId = newEmp._id;
      await User.findByIdAndUpdate(user._id, { employeeId });
      user.employeeId = employeeId;
    }
  }
  return employeeId;
}

/**
 * Get current logged-in employee's complete salary overview
 * Strictly verifies identity from req.user
 */
async function getMySalaryOverview(req, res) {
  try {
    const employeeId = await ensureEmployeeProfile(req.user);

    const employee = await Employee.findById(employeeId)
      .populate("departmentId", "departmentName")
      .populate("designationId", "designationTitle");

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found" });
    }

    // Active salary structure
    const structure = await SalaryStructure.findOne({ employeeId, status: "active" });

    // Latest finalized payroll record
    const latestSlip = await PayrollRecord.findOne({ employeeId, status: "Finalized" })
      .populate("payrollPeriodId", "periodName month year totalDays")
      .sort({ year: -1, month: -1 });

    // Recent 6 finalized records for history & trend
    const recentRecords = await PayrollRecord.find({ employeeId, status: "Finalized" })
      .populate("payrollPeriodId", "periodName month year")
      .sort({ year: -1, month: -1 })
      .limit(6);

    // Active discrepancy tickets raised by this employee
    const myTickets = await SalaryDiscrepancy.find({ employeeId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      employee: {
        id: employee._id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        departmentName: employee.departmentId?.departmentName || "General",
        designationTitle: employee.designationId?.designationTitle || "Staff",
        joiningDate: employee.joiningDate,
        bankDetails: employee.bankDetails
      },
      structure,
      latestSlip,
      recentRecords,
      ticketsCount: myTickets.length,
      recentTickets: myTickets.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get employee salary history with month-over-month comparisons
 */
async function getMySalaryHistory(req, res) {
  try {
    const employeeId = await ensureEmployeeProfile(req.user);

    const records = await PayrollRecord.find({ employeeId, status: "Finalized" })
      .populate("payrollPeriodId", "periodName month year")
      .sort({ year: 1, month: 1 });

    const historyWithDiffs = records.map((rec, idx) => {
      const prev = idx > 0 ? records[idx - 1] : null;
      const grossDiff = prev ? rec.grossSalary - prev.grossSalary : 0;
      const netDiff = prev ? rec.netSalary - prev.netSalary : 0;
      const pctChange = prev && prev.grossSalary > 0
        ? Number(((grossDiff / prev.grossSalary) * 100).toFixed(1))
        : 0;

      return {
        recordId: rec._id,
        periodName: rec.payrollPeriodId?.periodName || `${rec.month}/${rec.year}`,
        month: rec.month,
        year: rec.year,
        grossSalary: rec.grossSalary,
        totalDeductions: rec.totalDeductions,
        netSalary: rec.netSalary,
        basicSalary: rec.earnings?.basicSalary || 0,
        bonus: rec.earnings?.bonus || 0,
        overtimePay: rec.earnings?.overtimePay || 0,
        grossDifference: grossDiff,
        netDifference: netDiff,
        percentageChange: pctChange
      };
    });

    res.json({ success: true, history: historyWithDiffs.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// --- 5. Salary Discrepancy Ticket Endpoints ---

/**
 * Employee creates a salary discrepancy dispute ticket
 */
async function createDiscrepancy(req, res) {
  try {
    const employeeId = await ensureEmployeeProfile(req.user);

    const { error, value } = createDiscrepancySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const emp = await Employee.findById(employeeId).populate("departmentId");
    if (!emp) {
      return res.status(404).json({ success: false, message: "Employee record not found" });
    }

    let periodName = "General Query";
    if (value.payrollPeriodId) {
      const period = await PayrollPeriod.findById(value.payrollPeriodId);
      if (period) periodName = period.periodName;
    }

    const ticket = new SalaryDiscrepancy({
      employeeId,
      userId: req.user._id,
      employeeName: emp.name,
      employeeCode: emp.employeeCode,
      departmentName: emp.departmentId?.departmentName || "General",
      payrollPeriodId: value.payrollPeriodId || null,
      periodName,
      category: value.category,
      subject: value.subject,
      description: value.description,
      claimedAmount: value.claimedAmount || 0,
      status: "Pending"
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: "Discrepancy request submitted successfully. HR/Admin has been notified.",
      ticket
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Employee views their own discrepancy tickets
 */
async function getMyDiscrepancies(req, res) {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "No employee linked to your account" });
    }

    const tickets = await SalaryDiscrepancy.find({ employeeId }).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Admin / HR views all employee discrepancy tickets
 */
async function getAllDiscrepancies(req, res) {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (category && category !== "all") filter.category = category;

    const tickets = await SalaryDiscrepancy.find(filter)
      .populate("payrollPeriodId", "periodName month year")
      .sort({ createdAt: -1 });

    const stats = {
      total: await SalaryDiscrepancy.countDocuments(),
      pending: await SalaryDiscrepancy.countDocuments({ status: "Pending" }),
      underReview: await SalaryDiscrepancy.countDocuments({ status: "Under Review" }),
      resolved: await SalaryDiscrepancy.countDocuments({ status: "Resolved" })
    };

    res.json({ success: true, stats, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Admin / HR updates ticket status & provides resolution remarks
 */
async function updateDiscrepancyStatus(req, res) {
  try {
    const { error, value } = updateDiscrepancyStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { status, adminRemarks } = value;
    const ticket = await SalaryDiscrepancy.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Discrepancy ticket not found" });
    }

    ticket.status = status;
    if (adminRemarks !== undefined) ticket.adminRemarks = adminRemarks;
    ticket.reviewedBy = req.user._id;
    ticket.reviewedByName = req.user.username;
    ticket.reviewedAt = new Date();

    await ticket.save();

    res.json({
      success: true,
      message: `Ticket status updated to ${status}`,
      ticket
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
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
};

