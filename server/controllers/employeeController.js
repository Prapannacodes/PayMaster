const { Employee, Department, Designation } = require("../models/employeeModel");

// --- 1. Department Operations ---
async function getDepartments(req, res) {
  try {
    const departments = await Department.find().sort({ departmentName: 1 });
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch departments", error: error.message });
  }
}

async function createDepartment(req, res) {
  try {
    const { departmentName, description } = req.body;
    if (!departmentName) return res.status(400).json({ message: "Department name is required" });

    const department = new Department({ departmentName: departmentName.trim(), description: description || "" });
    await department.save();
    res.status(201).json({ success: true, message: "Department created", department });
  } catch (error) {
    res.status(500).json({ message: "Could not create department", error: error.message });
  }
}

// --- 2. Designation Operations ---
async function getDesignations(req, res) {
  try {
    const designations = await Designation.find().populate("departmentId", "departmentName").sort({ designationTitle: 1 });
    res.json({ success: true, designations });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch designations", error: error.message });
  }
}

async function createDesignation(req, res) {
  try {
    const { designationTitle, departmentId, description } = req.body;
    if (!designationTitle || !departmentId) return res.status(400).json({ message: "Title and department are required" });

    const designation = new Designation({ designationTitle: designationTitle.trim(), departmentId, description: description || "" });
    await designation.save();
    res.status(201).json({ success: true, message: "Designation created", designation });
  } catch (error) {
    res.status(500).json({ message: "Could not create designation", error: error.message });
  }
}

// --- 3. Employee Operations ---
async function getEmployees(req, res) {
  try {
    const { search, department, status } = req.query;
    let query = {};
    if (status) query.status = status;
    if (department) query.departmentId = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeCode: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const employees = await Employee.find(query)
      .populate("departmentId", "departmentName")
      .populate("designationId", "designationTitle")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: employees.length, employees });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch employees", error: error.message });
  }
}

async function getEmployeeById(req, res) {
  try {
    const employee = await Employee.findById(req.params.id).populate("departmentId").populate("designationId");
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ message: "Error fetching employee", error: error.message });
  }
}

async function createEmployee(req, res) {
  try {
    const { employeeCode, name, email, phone, departmentId, designationId, joiningDate, bankDetails } = req.body;
    if (!employeeCode || !name || !email || !departmentId || !designationId || !joiningDate) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const employee = new Employee({
      employeeCode: employeeCode.trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || "",
      departmentId,
      designationId,
      joiningDate: new Date(joiningDate),
      bankDetails: bankDetails || {}
    });

    await employee.save();
    res.status(201).json({ success: true, message: "Employee created successfully", employee });
  } catch (error) {
    res.status(500).json({ message: "Could not create employee", error: error.message });
  }
}

async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndUpdate(id, req.body, { new: true });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ success: true, message: "Employee updated", employee });
  } catch (error) {
    res.status(500).json({ message: "Could not update employee", error: error.message });
  }
}

async function deleteEmployee(req, res) {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, { status: "inactive" }, { new: true });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ success: true, message: "Employee marked as inactive" });
  } catch (error) {
    res.status(500).json({ message: "Could not deactivate employee", error: error.message });
  }
}

module.exports = {
  // Department
  getDepartments,
  createDepartment,
  // Designation
  getDesignations,
  createDesignation,
  // Employee
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
