const express = require("express");
const router = express.Router();

const {
  getAttendance,
  markAttendance,
  getLeaves,
  applyLeave,
  updateLeaveStatus
} = require("../controllers/attendanceController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.use(protect);

// Attendance
router.get("/attendance", getAttendance);
router.post("/attendance", authorizeRoles("admin", "hr"), markAttendance);

// Leaves
router.get("/leaves", getLeaves);
router.post("/leaves", applyLeave);
router.put("/leaves/:id/status", authorizeRoles("admin", "hr"), updateLeaveStatus);

module.exports = router;
