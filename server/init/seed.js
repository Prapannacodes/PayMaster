require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/userModel");
const { Employee, Department, Designation } = require("../models/employeeModel");
const { SalaryStructure, TaxRule, DeductionRule, PayrollPeriod, PayrollRecord } = require("../models/payrollModel");
const { Attendance } = require("../models/attendanceModel");
const { SalaryAnomaly, SalaryDiscrepancy } = require("../models/intelligentPayrollModel");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/salary_management";

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected for seeding.");

    // Clean existing data for clean reset if needed
    await User.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await Employee.deleteMany({});
    await SalaryStructure.deleteMany({});
    await TaxRule.deleteMany({});
    await DeductionRule.deleteMany({});
    await PayrollPeriod.deleteMany({});
    await PayrollRecord.deleteMany({});
    await Attendance.deleteMany({});
    await SalaryAnomaly.deleteMany({});
    await SalaryDiscrepancy.deleteMany({});

    console.log("Cleared old database records.");

    // 1. Seed Departments
    const engineering = await Department.create({
      departmentName: "Engineering",
      description: "Software development and IT infrastructure"
    });
    const hrDept = await Department.create({
      departmentName: "Human Resources",
      description: "People operations and recruitment"
    });
    const finance = await Department.create({
      departmentName: "Finance & Accounts",
      description: "Accounting, payroll and budgets"
    });

    console.log("Created Departments");

    // 2. Seed Designations
    const sde = await Designation.create({
      designationTitle: "Senior Software Engineer",
      departmentId: engineering._id,
      description: "Lead developer for applications"
    });
    const jde = await Designation.create({
      designationTitle: "Junior Software Engineer",
      departmentId: engineering._id,
      description: "Full stack developer"
    });
    const hrExec = await Designation.create({
      designationTitle: "HR Specialist",
      departmentId: hrDept._id,
      description: "HR operations executive"
    });
    const accountant = await Designation.create({
      designationTitle: "Accountant",
      departmentId: finance._id,
      description: "Financial ledger specialist"
    });

    console.log("Created Designations");

    // 3. Seed Employees
    const emp1 = await Employee.create({
      employeeCode: "EMP001",
      name: "Rahul Sharma",
      email: "rahul@salary.com",
      phone: "9876543210",
      departmentId: engineering._id,
      designationId: sde._id,
      joiningDate: new Date("2023-01-15"),
      bankDetails: {
        accountNumber: "912345678901",
        bankName: "State Bank of India",
        ifscCode: "SBIN0001234",
        panNumber: "ABCDE1234F"
      }
    });

    const emp2 = await Employee.create({
      employeeCode: "EMP002",
      name: "Priya Verma",
      email: "priya@salary.com",
      phone: "9876543211",
      departmentId: engineering._id,
      designationId: jde._id,
      joiningDate: new Date("2024-03-01"),
      bankDetails: {
        accountNumber: "912345678902",
        bankName: "HDFC Bank",
        ifscCode: "HDFC0002345",
        panNumber: "BCDEF2345G"
      }
    });

    const emp3 = await Employee.create({
      employeeCode: "EMP003",
      name: "Amit Patel",
      email: "amit@salary.com",
      phone: "9876543212",
      departmentId: hrDept._id,
      designationId: hrExec._id,
      joiningDate: new Date("2022-06-10"),
      bankDetails: {
        accountNumber: "912345678903",
        bankName: "ICICI Bank",
        ifscCode: "ICIC0003456",
        panNumber: "CDEFG3456H"
      }
    });

    console.log("Created Employees");

    // 4. Seed Users
    const passwordHash = await bcrypt.hash("password123", 10);

    // Admin user
    await User.create({
      username: "admin",
      email: "admin@salary.com",
      password: passwordHash,
      role: "admin"
    });

    // HR user
    await User.create({
      username: "hr",
      email: "hr@salary.com",
      password: passwordHash,
      role: "hr"
    });

    // Employee user linked to Rahul
    await User.create({
      username: "rahul",
      email: "rahul@salary.com",
      password: passwordHash,
      role: "employee",
      employeeId: emp1._id
    });

    console.log("Created Users (admin, hr, rahul with password 'password123')");

    // 5. Seed Salary Structures
    await SalaryStructure.create({
      employeeId: emp1._id,
      basicSalary: 50000,
      hra: 20000,
      allowances: 10000,
      bonus: 3000,
      overtimeRate: 300,
      otherEarnings: 0,
      otherDeductions: 0,
      status: "active"
    });

    await SalaryStructure.create({
      employeeId: emp2._id,
      basicSalary: 30000,
      hra: 12000,
      allowances: 6000,
      bonus: 1500,
      overtimeRate: 200,
      otherEarnings: 0,
      otherDeductions: 0,
      status: "active"
    });

    await SalaryStructure.create({
      employeeId: emp3._id,
      basicSalary: 35000,
      hra: 14000,
      allowances: 7000,
      bonus: 2000,
      overtimeRate: 220,
      otherEarnings: 0,
      otherDeductions: 0,
      status: "active"
    });

    console.log("Created Salary Structures");

    // 6. Seed Standard Tax Rule
    await TaxRule.create({
      name: "Standard Indian Tax Regime FY 2025-26",
      financialYear: "2025-2026",
      regime: "Standard",
      standardDeduction: 50000,
      slabs: [
        { minIncome: 0, maxIncome: 300000, ratePercentage: 0 },
        { minIncome: 300000, maxIncome: 700000, ratePercentage: 5 },
        { minIncome: 700000, maxIncome: 1000000, ratePercentage: 10 },
        { minIncome: 1000000, maxIncome: 1200000, ratePercentage: 15 },
        { minIncome: 1200000, maxIncome: 1500000, ratePercentage: 20 },
        { minIncome: 1500000, maxIncome: null, ratePercentage: 30 }
      ],
      status: "active"
    });

    console.log("Created Tax Rules");

    // 7. Seed Deduction Rules
    await DeductionRule.create({
      name: "Provident Fund (PF)",
      code: "PF",
      type: "percentage",
      value: 12,
      appliesTo: "basic",
      description: "12% of basic salary towards employee provident fund",
      status: "active"
    });

    await DeductionRule.create({
      name: "Professional Tax (PT)",
      code: "PT",
      type: "fixed",
      value: 200,
      appliesTo: "gross",
      description: "Fixed state professional tax per month",
      status: "active"
    });

    console.log("Created Deduction Rules");

    // 8. Seed Historical & Current Payroll Periods with Snapshot Records
    const periodSep = await PayrollPeriod.create({
      month: 9,
      year: 2026,
      periodName: "September 2026",
      totalDays: 30,
      status: "Finalized",
      totalEmployees: 3,
      totalGross: 197500,
      totalDeductions: 28400,
      totalNet: 169100,
      finalizedAt: new Date("2026-09-30T18:00:00Z")
    });

    const periodOct = await PayrollPeriod.create({
      month: 10,
      year: 2026,
      periodName: "October 2026",
      totalDays: 31,
      status: "Finalized",
      totalEmployees: 3,
      totalGross: 205000,
      totalDeductions: 29500,
      totalNet: 175500,
      finalizedAt: new Date("2026-10-31T18:00:00Z")
    });

    const periodNov = await PayrollPeriod.create({
      month: 11,
      year: 2026,
      periodName: "November 2026",
      totalDays: 30,
      status: "Draft",
      totalEmployees: 3,
      totalGross: 212000,
      totalDeductions: 30800,
      totalNet: 181200
    });

    // Seed Payroll Records for Rahul (emp1) in Sep, Oct, Nov
    await PayrollRecord.create({
      payrollPeriodId: periodSep._id,
      employeeId: emp1._id,
      employeeSnapshot: {
        employeeCode: emp1.employeeCode,
        name: emp1.name,
        email: emp1.email,
        departmentName: "Engineering",
        designationTitle: "Senior Software Engineer",
        panNumber: "ABCDE1234F",
        bankName: "HDFC Bank",
        accountNumber: "912345678901"
      },
      month: 9,
      year: 2026,
      totalDays: 30,
      presentDays: 30,
      absentDays: 0,
      halfDays: 0,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      payableDays: 30,
      overtimeHours: 5,
      earnings: {
        basicSalary: 50000,
        hra: 20000,
        allowances: 10000,
        bonus: 3000,
        overtimePay: 1500,
        otherEarnings: 0
      },
      grossSalary: 84500,
      deductions: {
        pf: 6000,
        professionalTax: 200,
        attendanceDeduction: 0,
        tax: 6250,
        otherDeductions: 0
      },
      totalDeductions: 12450,
      netSalary: 72050,
      status: "Finalized"
    });

    await PayrollRecord.create({
      payrollPeriodId: periodOct._id,
      employeeId: emp1._id,
      employeeSnapshot: {
        employeeCode: emp1.employeeCode,
        name: emp1.name,
        email: emp1.email,
        departmentName: "Engineering",
        designationTitle: "Senior Software Engineer",
        panNumber: "ABCDE1234F",
        bankName: "HDFC Bank",
        accountNumber: "912345678901"
      },
      month: 10,
      year: 2026,
      totalDays: 31,
      presentDays: 31,
      absentDays: 0,
      halfDays: 0,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      payableDays: 31,
      overtimeHours: 8,
      earnings: {
        basicSalary: 50000,
        hra: 20000,
        allowances: 10000,
        bonus: 5000,
        overtimePay: 2400,
        otherEarnings: 0
      },
      grossSalary: 87400,
      deductions: {
        pf: 6000,
        professionalTax: 200,
        attendanceDeduction: 0,
        tax: 6500,
        otherDeductions: 0
      },
      totalDeductions: 12700,
      netSalary: 74700,
      status: "Finalized"
    });

    await PayrollRecord.create({
      payrollPeriodId: periodNov._id,
      employeeId: emp1._id,
      employeeSnapshot: {
        employeeCode: emp1.employeeCode,
        name: emp1.name,
        email: emp1.email,
        departmentName: "Engineering",
        designationTitle: "Senior Software Engineer",
        panNumber: "ABCDE1234F",
        bankName: "HDFC Bank",
        accountNumber: "912345678901"
      },
      month: 11,
      year: 2026,
      totalDays: 30,
      presentDays: 28,
      absentDays: 2,
      halfDays: 0,
      paidLeaveDays: 0,
      unpaidLeaveDays: 2,
      payableDays: 28,
      overtimeHours: 6,
      earnings: {
        basicSalary: 50000,
        hra: 20000,
        allowances: 10000,
        bonus: 3000,
        overtimePay: 0, // Unpaid overtime anomaly simulation
        otherEarnings: 0
      },
      grossSalary: 83000,
      deductions: {
        pf: 6000,
        professionalTax: 200,
        attendanceDeduction: 3333.33,
        tax: 6100,
        otherDeductions: 0
      },
      totalDeductions: 15633.33,
      netSalary: 67366.67,
      status: "Draft"
    });

    // Seed Payroll Records for Priya (emp2) & Amit (emp3) for October & November
    await PayrollRecord.create({
      payrollPeriodId: periodOct._id,
      employeeId: emp2._id,
      employeeSnapshot: {
        employeeCode: emp2.employeeCode,
        name: emp2.name,
        email: emp2.email,
        departmentName: "Engineering",
        designationTitle: "Junior Software Engineer",
        panNumber: "BCDEF2345G",
        bankName: "SBI",
        accountNumber: "912345678902"
      },
      month: 10,
      year: 2026,
      totalDays: 31,
      presentDays: 31,
      payableDays: 31,
      overtimeHours: 0,
      earnings: { basicSalary: 30000, hra: 12000, allowances: 6000, bonus: 1500, overtimePay: 0, otherEarnings: 0 },
      grossSalary: 49500,
      deductions: { pf: 3600, professionalTax: 200, attendanceDeduction: 0, tax: 2800, otherDeductions: 0 },
      totalDeductions: 6600,
      netSalary: 42900,
      status: "Finalized"
    });

    await PayrollRecord.create({
      payrollPeriodId: periodOct._id,
      employeeId: emp3._id,
      employeeSnapshot: {
        employeeCode: emp3.employeeCode,
        name: emp3.name,
        email: emp3.email,
        departmentName: "Human Resources",
        designationTitle: "HR Specialist",
        panNumber: "CDEFG3456H",
        bankName: "ICICI Bank",
        accountNumber: "912345678903"
      },
      month: 10,
      year: 2026,
      totalDays: 31,
      presentDays: 31,
      payableDays: 31,
      overtimeHours: 0,
      earnings: { basicSalary: 35000, hra: 14000, allowances: 7000, bonus: 2000, overtimePay: 0, otherEarnings: 0 },
      grossSalary: 58000,
      deductions: { pf: 4200, professionalTax: 200, attendanceDeduction: 0, tax: 3500, otherDeductions: 0 },
      totalDeductions: 7900,
      netSalary: 50100,
      status: "Finalized"
    });

    console.log("Created Historical & Current Payroll Records");

    // 9. Seed Sample Attendance & Overtime for Rahul
    await Attendance.create({
      employeeId: emp1._id,
      date: new Date("2026-11-05"),
      status: "Present",
      checkIn: "09:00",
      checkOut: "20:00",
      overtimeHours: 3,
      remarks: "Project release support"
    });

    await Attendance.create({
      employeeId: emp1._id,
      date: new Date("2026-11-06"),
      status: "Present",
      checkIn: "09:00",
      checkOut: "20:00",
      overtimeHours: 3,
      remarks: "Sprint wrap-up"
    });

    // 10. Seed Realistic Smart Anomaly Alert
    await SalaryAnomaly.create({
      periodId: periodNov._id,
      periodName: periodNov.periodName,
      employeeId: emp1._id,
      employeeCode: emp1.employeeCode,
      employeeName: emp1.name,
      departmentName: "Engineering",
      anomalyType: "MISSING_OVERTIME",
      severity: "High",
      title: "Unpaid Overtime Remuneration Recorded",
      description: "Employee Rahul Sharma logged 6 approved overtime hours in November 2026, but the generated draft payroll credit is ₹0.",
      affectedAmount: 1800,
      baselineAmount: 6,
      currentAmount: 0,
      status: "Pending"
    });

    // 11. Seed Sample Employee Discrepancy Dispute Ticket
    await SalaryDiscrepancy.create({
      employeeId: emp1._id,
      userId: (await User.findOne({ username: "rahul" }))._id,
      employeeName: emp1.name,
      employeeCode: emp1.employeeCode,
      departmentName: "Engineering",
      payrollPeriodId: periodNov._id,
      periodName: periodNov.periodName,
      category: "Incorrect Overtime",
      subject: "Overtime hours missing from November draft payslip",
      description: "I worked 6 hours overtime on Nov 5 and Nov 6 for the project release sprint, but the draft slip displays ₹0 for overtime pay.",
      claimedAmount: 1800,
      status: "Pending"
    });

    console.log("Created Anomaly Alerts and Discrepancy Tickets");
    console.log("=========================================");
    console.log("Database seeded successfully!");
    console.log("Test Login Credentials:");
    console.log("Admin: admin@salary.com / password123");
    console.log("HR: hr@salary.com / password123");
    console.log("Employee: rahul@salary.com / password123");
    console.log("=========================================");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
