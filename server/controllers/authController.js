const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Helper function to create JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "default_secret_key", {
    expiresIn: "7d"
  });
};

// 1. Register new user
async function register(req, res) {
  try {
    const { username, email, password, role } = req.body;

    // Simple validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide username, email and password" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: "User with this email or username already exists" });
    }

    // Password hash karo
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Naya user banao
    const user = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "employee"
    });

    await user.save();

    // Token generate karo
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration", error: error.message });
  }
}

// 2. User login
async function login(req, res) {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please provide email/username and password" });
    }

    // User find karo email ya username se
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials. User does not exist." });
    }

    // Password compare karo
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials. Incorrect password." });
    }

    // Token generate karo
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
}

// 3. Get currently logged in user profile
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-password").populate("employeeId");
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching profile", error: error.message });
  }
}

// 4. Get all users (Admin only)
async function getAllUsers(req, res) {
  try {
    const users = await User.find().select("-password").populate("employeeId").sort({ createdAt: -1 });
    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching users", error: error.message });
  }
}

// 5. Update user role (Admin only)
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "hr", "employee"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "User role updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: "Server error updating user role", error: error.message });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  getAllUsers,
  updateUserRole
};
