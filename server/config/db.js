const mongoose = require("mongoose");

// Database connection function
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/salary_management";
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB Connection Error: ", error.message);
    // Exit process if database is not connected
    process.exit(1);
  }
};

module.exports = connectDB;
