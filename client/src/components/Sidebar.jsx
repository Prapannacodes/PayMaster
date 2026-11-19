import React from "react";
import {
  IconDashboard,
  IconUsers,
  IconOrganization,
  IconPayroll,
  IconSimulator,
  IconAnomaly,
  IconAnalytics,
  IconDiscrepancy,
  IconAttendance,
  IconLeaves,
  IconSalaryStructure,
  IconSalarySlip,
  IconTax,
  IconReports,
  IconAdmin,
  IconPortal
} from "./Icons";

export default function Sidebar({ currentPage, onNavigate, userRole }) {
  const isEmployee = userRole === "employee";
  const isHR = userRole === "hr";
  const isAdmin = userRole === "admin";

  const navSections = [
    {
      title: "Core",
      items: [
        { id: "dashboard", label: "Dashboard", icon: IconDashboard, show: !isEmployee },
        { id: "employee-portal", label: "My Salary Portal", icon: IconPortal, show: isEmployee },
        { id: "employees", label: "Employees", icon: IconUsers, show: isAdmin || isHR },
        { id: "organization", label: "Departments & Roles", icon: IconOrganization, show: isAdmin || isHR }
      ]
    },
    {
      title: "Finance & Simulator",
      items: [
        { id: "payroll", label: "Payroll Processing", icon: IconPayroll, show: isAdmin || isHR },
        { id: "simulator", label: "What-If Simulator", icon: IconSimulator, show: isAdmin || isHR },
        { id: "anomalies", label: "Anomaly Detection", icon: IconAnomaly, show: isAdmin || isHR },
        { id: "analytics", label: "Predictive Analytics", icon: IconAnalytics, show: isAdmin || isHR }
      ]
    },
    {
      title: "Workforce",
      items: [
        { id: "attendance", label: "Attendance", icon: IconAttendance, show: true },
        { id: "leaves", label: "Leaves", icon: IconLeaves, show: true }
      ]
    },
    {
      title: "System & Governance",
      items: [
        { id: "discrepancies", label: "Discrepancy Tickets", icon: IconDiscrepancy, show: isAdmin || isHR },
        { id: "salary-structures", label: "Salary Structures", icon: IconSalaryStructure, show: isAdmin || isHR },
        { id: "tax-deductions", label: "Tax & Deductions", icon: IconTax, show: isAdmin || isHR },
        { id: "reports", label: "Reports & Summaries", icon: IconReports, show: isAdmin || isHR },
        { id: "admin", label: "Admin Panel", icon: IconAdmin, show: isAdmin }
      ]
    },
    {
      title: "Personal",
      items: [
        { id: "salary-slips", label: "Salary Slips", icon: IconSalarySlip, show: true }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge">PM</div>
        <div className="brand-info">
          <h3>Pay<span>Master</span></h3>
          <p>Enterprise HR & Payroll</p>
        </div>
      </div>

      {/* Nav Groups */}
      <div className="sidebar-content">
        {navSections.map((sec, idx) => {
          const visibleItems = sec.items.filter((item) => item.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              <div className="nav-section-label">{sec.title}</div>
              <ul className="sidebar-menu">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <li key={item.id} className={isActive ? "active" : ""}>
                      <button onClick={() => onNavigate(item.id)}>
                        <Icon size={17} />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="sidebar-footer">
        <div className="system-status-capsule">
          <span>Enterprise v2.4</span>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
