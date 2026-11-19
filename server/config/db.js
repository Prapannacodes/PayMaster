const mongoose = require("mongoose");
const User = require("../models/userModel");

// Database connection function
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/salary_management";
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed if database is brand new (e.g. freshly deployed MongoDB Atlas)
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log("Empty database detected (0 users found). Auto-seeding initial demo records...");
        const { seedDatabase } = require("../init/seed");
        await seedDatabase(false);
        console.log("Auto-seeding completed successfully!");
      }
    } catch (seedErr) {
      console.warn("Auto-seeding check encountered an issue (continuing startup):", seedErr.message);
    }
  } catch (error) {
    console.log("MongoDB Connection Error: ", error.message);
    // Exit process if database is not connected
    process.exit(1);
  }
};

module.exports = connectDB;
