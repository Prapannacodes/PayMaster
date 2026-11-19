const mongoose = require("mongoose");

// 1. Attendance Schema
const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Present", "Absent", "Half Day", "Leave"], default: "Present" },
  checkIn: { type: String, default: "" },
  checkOut: { type: String, default: "" },
  overtimeHours: { type: Number, default: 0, min: 0 },
  remarks: { type: String, default: "" }
});

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// 2. Leave Application Schema
const leaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  leaveType: {
    type: String,
    enum: ["Casual Leave", "Sick Leave", "Paid Leave", "Unpaid Leave"],
    default: "Paid Leave"
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true, min: 0.5 },
  isPaid: { type: Boolean, default: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  appliedAt: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
  reviewRemarks: { type: String, default: "" }
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
const Leave = mongoose.model("Leave", leaveSchema);

module.exports = Attendance;
module.exports.Attendance = Attendance;
module.exports.Leave = Leave;
