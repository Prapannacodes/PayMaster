require("dotenv").config();
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

// 4 Core Domain Routers + Intelligent Enhancement Routers
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/employeeRoutes"));
app.use("/api", require("./routes/attendanceRoutes"));
app.use("/api", require("./routes/payrollRoutes"));
app.use("/api", require("./routes/intelligentRoutes"));

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
