require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Database connect karo
connectDB();

// Core middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Salary Management System API is running smoothly",
    time: new Date()
  });
});

// Manual database seed endpoint
app.get("/api/seed-database", async (req, res) => {
  try {
    const { seedDatabase } = require("./init/seed");
    await seedDatabase(false);
    res.json({
      success: true,
      message: "Database seeded successfully with default Admin, HR, and Employee demo accounts!"
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4 Core Domain Routers + Intelligent Enhancement Routers
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/employeeRoutes"));
app.use("/api", require("./routes/attendanceRoutes"));
app.use("/api", require("./routes/payrollRoutes"));
app.use("/api", require("./routes/intelligentRoutes"));

// Serve frontend build in production
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA Fallback: for any non-API get route, serve client index.html
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
      if (err) next();
    });
  });
}

// 404 Route handling
app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found!"
  });
});

// Central error handling middleware
app.use((err, req, res, next) => {
  let { status = 500, message = "Something went wrong! Galat Hai Galat Hai!!!!!" } = err;
  res.status(status).json({
    success: false,
    message: message
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
