import React, { useState, useEffect } from "react";
import { api } from "./services/api";

// Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Consolidated Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Organization from "./pages/Organization";
import SalaryStructures from "./pages/SalaryStructures";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import TaxAndDeductions from "./pages/TaxAndDeductions";
import Payroll from "./pages/Payroll";
import SalarySlip from "./pages/SalarySlip";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";

// Four Major Intelligent Feature Modules
import AnomalyDetection from "./pages/AnomalyDetection";
import WhatIfSimulator from "./pages/WhatIfSimulator";
import PayrollAnalytics from "./pages/PayrollAnalytics";
import EmployeePortal from "./pages/EmployeePortal";
import DiscrepancyManagement from "./pages/DiscrepancyManagement";

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.getProfile();
      setUser(data.user);
      if (data.user?.role === "employee") {
        setCurrentPage("employee-portal");
      }
    } catch (err) {
      console.log("Token expired:", err.message);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setCurrentPage("dashboard");
    setSelectedRecordId(null);
  };

  const handleNavigate = (pageId) => {
    if (pageId !== "salary-slips") {
      setSelectedRecordId(null);
    }
    setCurrentPage(pageId);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <h3>Loading PayMaster System...</h3>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          if (loggedInUser.role === "employee") {
            setCurrentPage("employee-portal");
          } else {
            setCurrentPage("dashboard");
          }
        }}
      />
    );
  }

  const titles = {
    dashboard: "Dashboard Overview",
    "employee-portal": "Employee Salary Transparency Portal",
    anomalies: "Smart Salary Anomaly Detection & Audit",
    simulator: "Salary What-If Simulator & Financial Modeling",
    analytics: "Predictive Payroll Analytics & Strategic Insights",
    discrepancies: "Employee Discrepancy & Dispute Management",
    employees: "Employee Directory & Records",
    organization: "Organization (Departments & Roles)",
    "salary-structures": "Salary Structures & Allowances",
    attendance: "Attendance & Overtime Management",
    leaves: "Leave Applications & Approvals",
    "tax-deductions": "Tax Slabs & Statutory Deductions",
    payroll: "Monthly Payroll Processing",
    "salary-slips": "Employee Salary Slip Document",
    reports: "Payroll Reports & Summaries",
    admin: "System Administration & Audit Trail"
  };

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        userRole={user.role}
      />

      <main className="main-content">
        <Navbar
          title={titles[currentPage] || "PayMaster Portal"}
          user={user}
          onLogout={handleLogout}
        />

        <div className="content-body">
          {currentPage === "dashboard" && <Dashboard user={user} onNavigate={handleNavigate} />}
          {currentPage === "employee-portal" && (
            <EmployeePortal
              user={user}
              onViewSalarySlip={(recordId) => {
                setSelectedRecordId(recordId);
                setCurrentPage("salary-slips");
              }}
            />
          )}
          {currentPage === "anomalies" && <AnomalyDetection />}
          {currentPage === "simulator" && <WhatIfSimulator />}
          {currentPage === "analytics" && <PayrollAnalytics />}
          {currentPage === "discrepancies" && <DiscrepancyManagement />}
          {currentPage === "employees" && <Employees />}
          {currentPage === "organization" && <Organization />}
          {currentPage === "salary-structures" && <SalaryStructures />}
          {currentPage === "attendance" && <Attendance user={user} />}
          {currentPage === "leaves" && <Leaves user={user} />}
          {currentPage === "tax-deductions" && <TaxAndDeductions />}
          {currentPage === "payroll" && (
            <Payroll
              onSelectSalarySlip={(recordId) => {
                setSelectedRecordId(recordId);
                setCurrentPage("salary-slips");
              }}
            />
          )}
          {currentPage === "salary-slips" && (
            <SalarySlip
              recordId={selectedRecordId}
              user={user}
              onBack={() => handleNavigate(user.role === "employee" ? "employee-portal" : "payroll")}
            />
          )}
          {currentPage === "reports" && <Reports />}
          {currentPage === "admin" && <Admin />}
        </div>
      </main>
    </div>
  );
}
