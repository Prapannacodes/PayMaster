# 🎓 PayMaster — Complete Viva & Codebase Explanation Guide

Don't panic! The codebase has been streamlined into **just 4 logical domain modules**. 
You can understand and explain this entire project in under 10 minutes.

---

## 🌟 1. The 2-Minute Project Summary (Elevator Pitch)
When the examiner asks: *"Tell me about your project."*

> "Sir/Ma'am, **PayMaster** is a web-based Salary & Payroll Management System. Its main objective is to automate the end-to-end salary cycle for an organization. 
> It handles employee records, attendance tracking, and leave management. The core highlight is the **automated payroll engine**, which calculates gross salary, attendance deductions, statutory deductions like PF and Professional Tax, and progressive income tax slabs to determine the net take-home salary. It supports role-based access control for Admins, HR, and Employees, and generates official, printable salary slips."

---

## 🏛️ 2. The Streamlined Architecture (4 Core Modules)
When the examiner asks: *"How is your backend structured?"*

Instead of having dozens of messy files, our backend is structured into **4 clean domain modules**:

```text
Backend Structure (server/):
├── config/
│   └── db.js                        # Simple MongoDB connection
├── models/                          # 4 Clean Database Models
│   ├── userModel.js                 # 1. Auth & Users
│   ├── employeeModel.js             # 2. Employees, Departments, Designations
│   ├── attendanceModel.js           # 3. Daily Attendance & Leaves
│   └── payrollModel.js              # 4. Salary Structures, Tax Slabs, Payroll Snapshots, Audit
├── controllers/                     # 4 Simple Logic Controllers
│   ├── authController.js
│   ├── employeeController.js
│   ├── attendanceController.js
│   └── payrollController.js
├── routes/                          # 4 Clean REST Route Files
│   ├── authRoutes.js
│   ├── employeeRoutes.js
│   ├── attendanceRoutes.js
│   └── payrollRoutes.js
├── services/
│   └── payrollCalculationService.js # Pure calculation math functions
├── middleware/
│   └── authMiddleware.js            # JWT Protect & Role checking
└── server.js                        # Express app entry point
```

---

## 🔁 3. The 4 Domain Modules Explained

| Domain Module | Model File | Controller File | Routes Handled |
| :--- | :--- | :--- | :--- |
| **1. Auth & Users** | [`userModel.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/models/userModel.js) | [`authController.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/controllers/authController.js) | `/api/auth/login`, `/register`, `/profile`, `/users` |
| **2. Organization & Employees** | [`employeeModel.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/models/employeeModel.js) | [`employeeController.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/controllers/employeeController.js) | `/api/departments`, `/api/designations`, `/api/employees` |
| **3. Attendance & Leaves** | [`attendanceModel.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/models/attendanceModel.js) | [`attendanceController.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/controllers/attendanceController.js) | `/api/attendance`, `/api/leaves` |
| **4. Payroll, Slips & Reports** | [`payrollModel.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/models/payrollModel.js) | [`payrollController.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/controllers/payrollController.js) | `/api/salary-structures`, `/api/tax-rules`, `/api/payroll`, `/api/reports` |

---

## 🔐 4. Authentication & Security (How Login Works)
When the examiner asks: *"How does authentication and authorization work?"*

1. **Password Hashing**: We never store plain text passwords. In [`authController.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/controllers/authController.js), we use `bcrypt.hash(password, 10)` before saving to MongoDB.
2. **Login Verification**: When a user logs in, `bcrypt.compare(enteredPassword, user.password)` checks the password.
3. **JWT Token Generation**: If valid, we create a JSON Web Token (JWT) with the user's ID and role:
   ```javascript
   jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
   ```
4. **Token Storage**: The React frontend stores this token in browser `localStorage`.
5. **Protect Middleware ([`authMiddleware.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/middleware/authMiddleware.js))**:
   * On every request, the frontend sends: `Authorization: Bearer <token>`.
   * The middleware reads the token, verifies it with `jwt.verify()`, and attaches the logged-in user object to `req.user`.
6. **Role Authorization**:
   ```javascript
   const authorizeRoles = (...roles) => {
     return (req, res, next) => {
       if (!roles.includes(req.user.role)) {
         return res.status(403).json({ message: "Access denied" });
       }
       next();
     };
   };
   ```
   *If an Employee tries to finalize payroll or add an employee, the server blocks them with HTTP 403 (Forbidden).*

---

## 💰 5. The Heart of the Project: Payroll Calculation Engine
When the examiner asks: *"How is payroll calculated? Explain the formulas."*

All math is kept in [`server/services/payrollCalculationService.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/services/payrollCalculationService.js). Here is the exact step-by-step sequence:

### Step 1: Payable Days
* Total calendar days in the month (e.g., 31 in March).
* Formula:
  $$\text{Payable Days} = \text{Present Days} + (0.5 \times \text{Half Days}) + \text{Paid Leave Days}$$

### Step 2: Gross Salary
* From `SalaryStructure`:
  $$\text{Gross Salary} = \text{Basic} + \text{HRA} + \text{Special Allowances} + \text{Bonus} + (\text{OT Hours} \times \text{OT Rate}) + \text{Other Earnings}$$

### Step 3: Attendance Deduction (Loss of Pay)
* If an employee is Absent, takes Half Days, or takes Unpaid Leave:
  $$\text{Daily Rate} = \frac{\text{Basic Salary}}{\text{Total Days in Month}}$$
  $$\text{Lost Days} = \text{Absent Days} + (0.5 \times \text{Half Days}) + \text{Unpaid Leaves}$$
  $$\text{Attendance Cut} = \text{Daily Rate} \times \text{Lost Days}$$

### Step 4: Statutory Deductions (PF & PT)
* Configured in `DeductionRule`:
  * **Provident Fund (PF)**: $12\%$ of Basic Salary.
  * **Professional Tax (PT)**: Flat ₹200 per month.

### Step 5: Income Tax (TDS) Calculation
* Configured dynamically in `TaxRule` (not hardcoded!):
  1. Annualize income: $\text{Annual Gross} = \text{Monthly Gross} \times 12$.
  2. Standard Deduction: Subtract ₹50,000.
  3. Slabs check:
     * Up to ₹3 Lakh: 0%
     * ₹3 Lakh to ₹7 Lakh: 5%
     * ₹7 Lakh to ₹10 Lakh: 10%
     * ₹10 Lakh to ₹12 Lakh: 15%
     * Above ₹15 Lakh: 30%
  4. Monthly Tax Deduction = $\frac{\text{Total Annual Tax}}{12}$.

### Step 6: Net Take-Home Salary
$$\text{Total Deductions} = \text{PF} + \text{PT} + \text{Attendance Cut} + \text{Income Tax}$$
$$\text{Net Salary} = \text{Gross Salary} - \text{Total Deductions}$$

---

## 🔒 6. Payroll Finalization & Historical Snapshots
When the examiner asks: *"What happens when you finalize a payroll? Why can't you just recalculate it on the fly?"*

> "Sir/Ma'am, in a real-world payroll system, **history must be immutable**. 
> If an employee's salary changes in April, their March salary slip must NOT change!
> Therefore, in [`payrollController.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/controllers/payrollController.js):
> 1. When HR clicks **Finalize Payroll**, we change the status from `Draft` to `Finalized`.
> 2. We save an **immutable snapshot** (`employeeSnapshot`) containing their exact designation, bank account, and earnings at that point in time inside [`payrollModel.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/models/payrollModel.js).
> 3. Once marked `Finalized`, the backend code explicitly rejects any attempt to regenerate or overwrite that period."

---

## 💻 7. How the Frontend Connects to the Backend
When the examiner asks: *"How does your React frontend talk to the Node server?"*

1. The backend runs on `http://localhost:5000` and enables `cors()` in [`server.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/server.js).
2. The frontend runs on `http://localhost:5173`.
3. In [`client/src/services/api.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/client/src/services/api.js), we wrote a simple reusable `request()` function. It automatically pulls the JWT token from `localStorage` and adds:
   `headers: { Authorization: "Bearer " + token }`.
4. In React components (like [`Employees.jsx`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/client/src/pages/Employees.jsx) or [`Payroll.jsx`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/client/src/pages/Payroll.jsx)), we use standard `useState` to store data and `useEffect` to trigger the API calls when the page loads.

---

## ❓ 8. Top 10 Viva Questions & Exact Answers

#### Q1: "Why did you use MongoDB instead of SQL/MySQL?"
> **Answer**: "MongoDB uses JSON-like documents, which maps naturally to JavaScript objects in Node.js. It also easily supports nested structures, such as saving an employee snapshot or breakdown of earnings inside a payroll record without needing multiple complex joins."

#### Q2: "How do you prevent duplicate attendance for the same employee on the same date?"
> **Answer**: "In [`attendanceModel.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/models/attendanceModel.js), we created a compound unique index:
> `attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });`
> In addition, the controller uses `findOneAndUpdate(..., { upsert: true })` so marking attendance twice updates the existing entry rather than duplicating it."

#### Q3: "What is `JWT_SECRET` and where is it stored?"
> **Answer**: "It is a private key used by the server to sign and verify JSON Web Tokens. It is stored securely in the `server/.env` file so it is never exposed in the source code."

#### Q4: "What happens if a user enters an invalid URL in the backend?"
> **Answer**: "In [`server.js`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/server/server.js), we have a 404 middleware right before the global error handler that returns `{ message: 'Route not found!' }` with HTTP status 404."

#### Q5: "What is the difference between an Admin, HR, and Employee in your app?"
> **Answer**: 
> * **Admin**: Can manage system user accounts, promote/demote roles, view audit logs, and configure master departments/designations.
> * **HR**: Manages employee profiles, records daily attendance, approves/rejects leaves, configures salary structures, and generates/finalizes monthly payroll.
> * **Employee**: Can view their personal dashboard, attendance history, apply for leaves, and view/print their official monthly salary slips.

#### Q6: "How did you implement printable salary slips?"
> **Answer**: "In [`SalarySlip.jsx`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/client/src/pages/SalarySlip.jsx), we designed a clean document layout showing employer details, employee breakdown, earnings, deductions, and net pay. We added `@media print` rules in [`index.css`](file:///c:/Users/garva/OneDrive/Documents/Micro-project-1/client/src/index.css) to hide the sidebar and navigation buttons, and trigger `window.print()` so the browser saves it cleanly as a PDF."

#### Q7: "How is an employee deactivated?"
> **Answer**: "We perform a soft delete. Instead of permanently deleting the record from the database (which would corrupt past payroll history), we set `employee.status = 'inactive'`. This hides them from active payroll while preserving their past records."

#### Q8: "How does the leave system affect payroll?"
> **Answer**: "When payroll is generated, we query approved leaves for that employee in that month. If `isPaid` is true (like Casual/Sick leave), it counts towards payable days. If `isPaid` is false (Unpaid Leave), it is deducted from basic pay using the daily salary rate."

#### Q9: "Why didn't you use Redux for frontend state management?"
> **Answer**: "For a project of this scale, Redux introduces unnecessary boilerplate and complexity. Standard React state (`useState` and `useEffect`) with simple API calls makes the frontend lightweight, fast, easy to debug, and simple to explain."

#### Q10: "What is `init/seed.js`?"
> **Answer**: "It is an automated database seeder. With one command (`node init/seed.js`), it cleans the database and seeds realistic departments, designations, employees with salary structures, tax slabs, and pre-configured user credentials for demonstration."
