const mongoose = require("mongoose");

// 1. Department Schema
const departmentSchema = new mongoose.Schema({
  departmentName: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now }
});

// 2. Designation Schema
const designationSchema = new mongoose.Schema({
  designationTitle: { type: String, required: true, trim: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now }
});

// 3. Employee Schema
const employeeSchema = new mongoose.Schema({
  employeeCode: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, default: "" },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  designationId: { type: mongoose.Schema.Types.ObjectId, ref: "Designation", required: true },
  joiningDate: { type: Date, required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  bankDetails: {
    accountNumber: { type: String, default: "" },
    bankName: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    panNumber: { type: String, default: "" }
  },
  createdAt: { type: Date, default: Date.now }
});

const Department = mongoose.model("Department", departmentSchema);
const Designation = mongoose.model("Designation", designationSchema);
const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
module.exports.Employee = Employee;
module.exports.Department = Department;
module.exports.Designation = Designation;
