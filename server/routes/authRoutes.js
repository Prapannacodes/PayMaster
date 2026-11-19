const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getProfile,
  getAllUsers,
  updateUserRole
} = require("../controllers/authController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", protect, getProfile);

// Admin-only user management routes
router.get("/users", protect, authorizeRoles("admin"), getAllUsers);
router.put("/users/:id/role", protect, authorizeRoles("admin"), updateUserRole);

module.exports = router;
