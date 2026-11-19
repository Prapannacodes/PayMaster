const mongoose = require("mongoose");

// Simple User Schema for Authentication & Roles
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["admin", "hr", "employee"],
    default: "employee"
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
