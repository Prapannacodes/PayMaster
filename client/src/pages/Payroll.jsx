import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function Payroll({ onSelectSalarySlip }) {
  const [periods, setPeriods] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [records, setRecords] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [year, setYear] = useState(new Date().getFullYear());
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      const res = await api.getPayrollPeriods();
      setPeriods(res.periods);
      if (res.periods.length > 0) {
        // Load latest period by default
        loadPeriodDetails(res.periods[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPeriodDetails = async (id) => {
    try {
      setLoading(true);
      const res = await api.getPayrollPeriod(id);
      setCurrentPeriod(res.period);
      setRecords(res.records);
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setAlert(null);
      const res = await api.generatePayroll(month, year);
      setCurrentPeriod(res.period);
      setRecords(res.records);
      setAlert({ type: "success", message: res.message });
      fetchPeriods();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!currentPeriod) return;
    if (!window.confirm(`Are you sure you want to finalize payroll for ${currentPeriod.periodName}? Once finalized, it becomes official and locked.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.finalizePayroll(currentPeriod._id);
      setAlert({ type: "success", message: res.message });
      loadPeriodDetails(currentPeriod._id);
      fetchPeriods();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async () => {
    if (!currentPeriod) return;
    if (!window.confirm(`Reverting "${currentPeriod.periodName}" will unlock it back to Draft status, allowing you to re-run calculations or update salary records. Proceed?`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.revertPayroll(currentPeriod._id);
      setAlert({ type: "success", message: res.message });
      loadPeriodDetails(currentPeriod._id);
      fetchPeriods();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriod = async () => {
    if (!currentPeriod) return;
    const isFinalized = currentPeriod.status === "Finalized";
    const promptMsg = isFinalized
      ? `WARNING: "${currentPeriod.periodName}" is an official FINALIZED payroll. Deleting it will permanently remove all its employee payslips, anomaly audit records, and calculations. Are you sure?`
      : `Are you sure you want to delete the payroll draft for "${currentPeriod.periodName}"?`;

    if (!window.confirm(promptMsg)) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.deletePayrollPeriod(currentPeriod._id);
      setAlert({ type: "success", message: res.message });
      setCurrentPeriod(null);
      setRecords([]);
      fetchPeriods();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Generation Bar */}
      <div className="card">
        <div className="card-header">
          <h3>Payroll Processing Console</h3>
          {currentPeriod && currentPeriod.status === "Draft" && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button className="btn btn-success" onClick={handleFinalize} disabled={loading}>
                ✓ Finalize Payroll for {currentPeriod.periodName}
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDeletePeriod} disabled={loading}>
                🗑️ Discard Draft
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleGenerate} style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Select Month</label>
            <select
              className="form-control"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{ width: "150px" }}
            >
              <option value="1">1 - January</option>
              <option value="2">2 - February</option>
              <option value="3">3 - March</option>
              <option value="4">4 - April</option>
              <option value="5">5 - May</option>
              <option value="6">6 - June</option>
              <option value="7">7 - July</option>
              <option value="8">8 - August</option>
              <option value="9">9 - September</option>
              <option value="10">10 - October</option>
              <option value="11">11 - November</option>
              <option value="12">12 - December</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Select Year</label>
            <input
              type="number"
              className="form-control"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ width: "120px" }}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Processing..." : "⚡ Generate Draft / Preview"}
          </button>
        </form>

        {/* Existing Periods Tabs */}
        {periods.length > 0 && (
          <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, alignSelf: "center", marginRight: "6px" }}>
              Saved Periods:
            </span>
            {periods.map((p) => (
              <button
                key={p._id}
                className={`btn btn-sm ${currentPeriod?._id === p._id ? "btn-primary" : "btn-secondary"}`}
                onClick={() => loadPeriodDetails(p._id)}
              >
                {p.periodName} ({p.status})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Period Summary & Table */}
      {currentPeriod && (
        <div className="card">
          <div className="card-header" style={{ alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>
                {currentPeriod.periodName} — Payroll Breakdown
              </h3>
              <span className={`role-pill ${currentPeriod.status === "Finalized" ? "role-employee" : "role-admin"}`}>
                {currentPeriod.status}
              </span>
              {currentPeriod.status === "Finalized" ? (
                <span style={{ fontSize: "0.85rem", color: "var(--accent-green)", fontWeight: 600 }}>
                  🔒 Locked (Official Record)
                </span>
              ) : (
                <span style={{ fontSize: "0.85rem", color: "var(--accent-orange)", fontWeight: 600 }}>
                  ✏️ Draft (Recalculable)
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              {currentPeriod.status === "Finalized" ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleRevert}
                  disabled={loading}
                  title="Unlock this finalized payroll back to Draft status"
                >
                  ↺ Revert to Draft (Unlock)
                </button>
              ) : (
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleFinalize}
                  disabled={loading}
                >
                  ✓ Finalize Payroll
                </button>
              )}
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDeletePeriod}
                disabled={loading}
                title={currentPeriod.status === "Finalized" ? "Permanently delete this finalized payroll period" : "Discard and delete this payroll draft"}
              >
                🗑️ {currentPeriod.status === "Finalized" ? "Delete Period" : "Delete Draft"}
              </button>
            </div>
          </div>

          {/* Totals Banner */}
          <div className="stats-grid" style={{ marginBottom: "20px" }}>
            <div className="stat-card" style={{ padding: "14px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Employees</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{currentPeriod.totalEmployees}</div>
            </div>
            <div className="stat-card" style={{ padding: "14px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Total Gross</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>₹{currentPeriod.totalGross.toLocaleString()}</div>
            </div>
            <div className="stat-card" style={{ padding: "14px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Total Deductions</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent-red)" }}>₹{currentPeriod.totalDeductions.toLocaleString()}</div>
            </div>
            <div className="stat-card" style={{ padding: "14px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Net Payout</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent-green)" }}>₹{currentPeriod.totalNet.toLocaleString()}</div>
            </div>
          </div>

          {/* Interactive Payroll Preview Table */}
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Basic</th>
                  <th>HRA + Allow</th>
                  <th>Bonus / OT</th>
                  <th>Gross Salary</th>
                  <th>Att. Cut</th>
                  <th>PF + PT</th>
                  <th>Tax</th>
                  <th>Net Take-Home</th>
                  <th>Salary Slip</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.employeeSnapshot?.name}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#717171" }}>
                        {r.employeeSnapshot?.employeeCode} • {r.employeeSnapshot?.departmentName}
                      </div>
                    </td>
                    <td>₹{r.earnings?.basicSalary.toLocaleString()}</td>
                    <td>₹{((r.earnings?.hra || 0) + (r.earnings?.allowances || 0)).toLocaleString()}</td>
                    <td>₹{((r.earnings?.bonus || 0) + (r.earnings?.overtimePay || 0)).toLocaleString()}</td>
                    <td><strong>₹{r.grossSalary.toLocaleString()}</strong></td>
                    <td style={{ color: r.deductions?.attendanceDeduction > 0 ? "#c62828" : "#717171" }}>
                      -₹{r.deductions?.attendanceDeduction.toLocaleString()}
                    </td>
                    <td>-₹{((r.deductions?.pf || 0) + (r.deductions?.professionalTax || 0)).toLocaleString()}</td>
                    <td style={{ color: r.deductions?.tax > 0 ? "#c62828" : "#717171" }}>
                      -₹{r.deductions?.tax.toLocaleString()}
                    </td>
                    <td>
                      <strong style={{ color: "#2e7d32", fontSize: "1rem" }}>
                        ₹{r.netSalary.toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectSalarySlip(r._id)}
                      >
                        📄 View Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
