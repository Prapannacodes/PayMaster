const { AuditLog } = require("../models/payrollModel");

// Simple helper function to log important actions
async function recordAudit(action, user, details) {
  try {
    const log = new AuditLog({
      action,
      performedBy: user ? user._id : null,
      performedByName: user ? user.username : "System",
      details: details || ""
    });
    await log.save();
  } catch (error) {
    console.log("Could not record audit log:", error.message);
  }
}

module.exports = { recordAudit };
