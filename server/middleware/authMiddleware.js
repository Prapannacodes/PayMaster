const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// 1. User authenticate karne ka middleware
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Step 1: Check karo token header me hai ya nahi
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    // Step 2: "Bearer <token>" me se token nikaalo
    const token = authHeader.split(" ")[1];

    // Step 3: Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");

    // Step 4: Token se user dhundo (password chhod kar)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Step 5: User ko request object me daalo aur aage bhej do
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// 2. Role check karne ka middleware (Admin, HR, ya Employee)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Agar user ka role allowed list me nahi hai toh block karo
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: Role '${req.user?.role}' is not allowed to access this resource`
      });
    }

    next();
  };
};

module.exports = { protect, authorizeRoles };
