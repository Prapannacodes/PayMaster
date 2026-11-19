const express = require("express");
const router = express.Router();

const {
  getDepartments,
  createDepartment,
  getDesignations,
  createDesignation,
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require("../controllers/employeeController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.use(protect);

// 1. Departments
router.get("/departments", getDepartments);
router.post("/departments", authorizeRoles("admin", "hr"), createDepartment);

// 2. Designations
router.get("/designations", getDesignations);
router.post("/designations", authorizeRoles("admin", "hr"), createDesignation);

// 3. Employees
router.get("/employees", getEmployees);
router.get("/employees/:id", getEmployeeById);
router.post("/employees", authorizeRoles("admin", "hr"), createEmployee);
router.put("/employees/:id", authorizeRoles("admin", "hr"), updateEmployee);
router.delete("/employees/:id", authorizeRoles("admin", "hr"), deleteEmployee);

module.exports = router;
