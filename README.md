# PayMaster — Salary Management System 💼

A complete, full-stack, web-based Salary & Payroll Management System built for college micro-projects and viva demonstrations.

---

## 📌 Project Overview
PayMaster automates employee salary administration, attendance tracking, leave requests, statutory deductions (PF, Professional Tax), income tax calculation, monthly payroll finalization, and printable salary slip generation.

Built with a clean, streamlined **MVC (Model-View-Controller)** backend and a responsive, component-based **React** frontend.

---

## 🛠️ Technology Stack

* **Backend**: Node.js & Express.js (CommonJS MVC structure)
* **Database**: MongoDB with Mongoose ODM
* **Authentication**: JWT (JSON Web Tokens) & `bcryptjs` password hashing
* **Frontend**: React (Vite), Vanilla CSS (responsive, clean typography, printable CSS)
* **API Style**: RESTful JSON APIs

---

## 📂 Streamlined Project Directory Structure

```text
Micro-project-1/
├── server/
│   ├── config/
│   │   └── db.js                        # Simple MongoDB connection
│   ├── models/                          # 4 Clean Domain Schemas
│   │   ├── userModel.js                 # System user credentials & roles
│   │   ├── employeeModel.js             # Employees, Departments, Designations
│   │   ├── attendanceModel.js           # Daily Attendance & Leave records
│   │   └── payrollModel.js              # Salary Structures, Tax Slabs, Payroll Snapshots, Audit
│   ├── controllers/                     # 4 Simple Logic Controllers
│   │   ├── authController.js            # Register, Login, Profile
│   │   ├── employeeController.js        # Organization & Employee management
│   │   ├── attendanceController.js      # Attendance & Leave approvals
│   │   └── payrollController.js         # Structures, Tax/Deduction rules, Payroll, Reports
│   ├── routes/                          # 4 Clean Route Files
│   │   ├── authRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── attendanceRoutes.js
│   │   └── payrollRoutes.js
│   ├── middleware/                      # JWT protect & role authorization
│   ├── services/
│   │   └── payrollCalculationService.js # Formula functions for payroll
│   ├── utils/                           # Custom errors & audit logger
│   ├── init/
│   │   └── seed.js                      # Database seeder with sample data
│   ├── server.js                        # Express server entry point
│   └── package.json
│
├── client/                              # React Single Page Application
│   ├── src/
│   │   ├── components/                  # Navbar, Sidebar, Alert
│   │   ├── pages/                       # Dashboard, Employees, Organization, Payroll, etc.
│   │   ├── services/                    # api.js fetch helper
│   │   ├── App.jsx                      # Navigation & auth state
│   │   ├── main.jsx                     # Vite DOM entry
│   │   └── index.css                    # Professional styling & print rules
│   ├── package.json
│   └── vite.config.js
├── VIVA_EXPLANATION_GUIDE.md            # Complete Viva Q&A & Code Explanation Guide
└── README.md
```

---

## 👥 User Roles & Permissions

| Role | Permissions & Access Scope |
| :--- | :--- |
| **Admin** | Full system administration, User account role assignment, System audit logs, Department/Designation management. |
| **HR** | Employee management, Attendance recording, Leave approvals, Salary structure assignment, Monthly payroll processing, Finalization. |
| **Employee** | View personal dashboard, View own attendance history, Apply for leaves, View and print own monthly Salary Slips. |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
* Node.js (v18 or newer)
* MongoDB running locally on `mongodb://127.0.0.1:27017`

### 2. Configure & Run Backend
```bash
cd server
npm install
node init/seed.js      # Populates database with sample employees, structures & users
npm start              # Starts backend on http://localhost:5000
```

### 3. Run Frontend
```bash
cd ../client
npm install
npm run dev            # Starts Vite development server on http://localhost:5173
```

---

## 🔑 Demo Login Credentials (Ready to Test)

The database seeder pre-configures test accounts:

| User Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@salary.com` | `password123` |
| **HR** | `hr@salary.com` | `password123` |
| **Employee** | `rahul@salary.com` | `password123` |

*(Quick demo buttons are also built directly into the Login screen for 1-click access!)*

---

## 🧮 How Salary & Payroll Are Calculated (Viva Explanation)

### 1. Gross Salary Formula:
$$\text{Gross Salary} = \text{Basic Salary} + \text{HRA} + \text{Special Allowances} + \text{Performance Bonus} + (\text{Overtime Hours} \times \text{OT Rate}) + \text{Other Earnings}$$

### 2. Total Deductions Formula:
$$\text{Total Deductions} = \text{PF (12\% of Basic)} + \text{Professional Tax (₹200)} + \text{Attendance Cut} + \text{Income Tax (TDS)} + \text{Other Deductions}$$

### 3. Attendance Deduction:
$$\text{Daily Salary Rate} = \frac{\text{Basic Salary}}{\text{Total Days in Month}}$$
$$\text{Attendance Cut} = \text{Daily Rate} \times (\text{Absent Days} + 0.5 \times \text{Half Days} + \text{Unpaid Leaves})$$

### 4. Income Tax (TDS) Calculation:
* Monthly Gross is annualized: $\text{Annual Income} = \text{Gross Salary} \times 12$
* Standard Deduction is subtracted: $\text{Taxable Income} = \text{Annual Income} - ₹50,000$
* Taxable income is run through progressive tax slabs:
  * ₹0 to ₹3,00,000 $\rightarrow 0\%$
  * ₹3,00,001 to ₹7,00,000 $\rightarrow 5\%$
  * ₹7,00,001 to ₹10,00,000 $\rightarrow 10\%$
  * ₹10,00,001 to ₹12,00,000 $\rightarrow 15\%$
  * ₹12,00,001 to ₹15,00,000 $\rightarrow 20\%$
  * Above ₹15,00,000 $\rightarrow 30\%$
* Monthly tax deducted: $\text{Monthly TDS} = \frac{\text{Annual Tax}}{12}$

### 5. Net Take-Home Salary:
$$\text{Net Salary} = \text{Gross Salary} - \text{Total Deductions}$$
