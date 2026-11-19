const { Attendance, Leave } = require("../models/attendanceModel");

function normalizeDate(dateInput) {
  const d = new Date(dateInput);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// --- 1. Attendance Handlers ---
async function getAttendance(req, res) {
  try {
    const { employeeId, month } = req.query;
    let query = {};
    if (employeeId) query.employeeId = employeeId;
    if (month) {
      const [year, m] = month.split("-").map(Number);
      const start = new Date(Date.UTC(year, m - 1, 1));
      const end = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
      query.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query).populate("employeeId", "employeeCode name email").sort({ date: -1 });
    res.json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch attendance", error: error.message });
  }
}

async function markAttendance(req, res) {
  try {
    const { employeeId, date, status, checkIn, checkOut, overtimeHours, remarks } = req.body;
    if (!employeeId || !date || !status) {
      return res.status(400).json({ message: "Employee, date and status are required" });
    }

    const normalized = normalizeDate(date);
    const record = await Attendance.findOneAndUpdate(
      { employeeId, date: normalized },
      { status, checkIn: checkIn || "", checkOut: checkOut || "", overtimeHours: Number(overtimeHours) || 0, remarks: remarks || "" },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: "Attendance saved", record });
  } catch (error) {
    res.status(500).json({ message: "Could not mark attendance", error: error.message });
  }
}

// --- 2. Leave Handlers ---
async function getLeaves(req, res) {
  try {
    let query = {};
    if (req.user.role === "employee" && req.user.employeeId) {
      query.employeeId = req.user.employeeId;
    } else if (req.query.employeeId) {
      query.employeeId = req.query.employeeId;
    }

    const leaves = await Leave.find(query).populate("employeeId", "employeeCode name email").sort({ appliedAt: -1 });
    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch leaves", error: error.message });
  }
}

async function applyLeave(req, res) {
  try {
    let { employeeId, leaveType, startDate, endDate, days, isPaid, reason } = req.body;
    if (req.user.role === "employee" && req.user.employeeId) {
      employeeId = req.user.employeeId;
    }

    if (!employeeId || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: "Please provide all leave details" });
    }

    const leave = new Leave({
      employeeId,
      leaveType: leaveType || "Paid Leave",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      days: Number(days) || 1,
      isPaid: isPaid !== undefined ? isPaid : (leaveType !== "Unpaid Leave"),
      reason
    });

    await leave.save();
    res.status(201).json({ success: true, message: "Leave submitted successfully", leave });
  } catch (error) {
    res.status(500).json({ message: "Could not submit leave", error: error.message });
  }
}

async function updateLeaveStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewRemarks } = req.body;

    const leave = await Leave.findByIdAndUpdate(
      id,
      { status, reviewRemarks: reviewRemarks || "", reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );

    if (!leave) return res.status(404).json({ message: "Leave not found" });
    res.json({ success: true, message: `Leave ${status.toLowerCase()} successfully`, leave });
  } catch (error) {
    res.status(500).json({ message: "Could not update leave", error: error.message });
  }
}

module.exports = {
  getAttendance,
  markAttendance,
  getLeaves,
  applyLeave,
  updateLeaveStatus
};
