import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [periods, setPeriods] = useState([]);
  const [deptReport, setDeptReport] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [year]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [payrollRes, deptRes] = await Promise.all([
        api.getMonthlyReport(year),
        api.getDepartmentReport()
      ]);
      setPeriods(payrollRes.periods);
      setDeptReport(deptRes.report);
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const totalAnnualGross = periods.reduce((sum, p) => sum + (p.totalGross || 0), 0);
  const totalAnnualNet = periods.reduce((sum, p) => sum + (p.totalNet || 0), 0);

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Year Filter & Annual Stats */}
      <div className="card">
        <div className="card-header">
          <h3>Annual Payroll Summary</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontWeight: 600 }}>Filter Year:</label>
            <input
              type="number"
              className="form-control"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ width: "110px", padding: "6px 10px" }}
            />
          </div>
        </div>

        <div className="stats-grid" style={{ marginBottom: "20px" }}>
          <div className="stat-card">
            <h3>Periods Processed in {year}</h3>
            <div className="stat-value">{periods.length}</div>
          </div>
          <div className="stat-card">
            <h3>Total Annual Gross</h3>
            <div className="stat-value">₹{totalAnnualGross.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h3>Total Annual Net Disbursed</h3>
            <div className="stat-value" style={{ color: "#2e7d32" }}>₹{totalAnnualNet.toLocaleString()}</div>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Employees</th>
                <th>Total Gross</th>
                <th>Total Deductions</th>
                <th>Net Payout</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {periods.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "#717171" }}>
                    {loading ? "Loading reports..." : `No payroll records for year ${year}.`}
                  </td>
                </tr>
              ) : (
                periods.map((p) => (
                  <tr key={p._id}>
                    <td><strong>{p.periodName}</strong></td>
                    <td>{p.totalEmployees}</td>
                    <td>₹{p.totalGross.toLocaleString()}</td>
                    <td style={{ color: "#c62828" }}>-₹{p.totalDeductions.toLocaleString()}</td>
                    <td><strong style={{ color: "#2e7d32" }}>₹{p.totalNet.toLocaleString()}</strong></td>
                    <td>
                      <span className={`role-pill ${p.status === "Finalized" ? "role-employee" : "role-admin"}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department-wise Allocation */}
      <div className="card">
        <h3 style={{ marginBottom: "16px" }}>Department Headcount Distribution</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Active Employees Count</th>
              </tr>
            </thead>
            <tbody>
              {deptReport.map((d) => (
                <tr key={d.departmentId}>
                  <td><strong>{d.departmentName}</strong></td>
                  <td>{d.employeeCount} Members</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
