import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function SalaryStructures() {
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: "",
    basicSalary: 30000,
    hra: 12000,
    allowances: 5000,
    bonus: 2000,
    overtimeRate: 200,
    otherEarnings: 0,
    otherDeductions: 0,
    effectiveFrom: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [structRes, empRes] = await Promise.all([
        api.getSalaryStructures(),
        api.getEmployees()
      ]);
      setStructures(structRes.structures);
      setEmployees(empRes.employees);
      if (empRes.employees.length > 0 && !formData.employeeId) {
        setFormData(prev => ({ ...prev, employeeId: empRes.employees[0]._id }));
      }
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (empId) => {
    const existing = structures.find(s => (s.employeeId?._id || s.employeeId) === empId && s.status === "active");
    if (existing) {
      setFormData({
        employeeId: empId,
        basicSalary: existing.basicSalary || 0,
        hra: existing.hra || 0,
        allowances: existing.allowances || 0,
        bonus: existing.bonus || 0,
        overtimeRate: existing.overtimeRate || 0,
        otherEarnings: existing.otherEarnings || 0,
        otherDeductions: existing.otherDeductions || 0,
        effectiveFrom: existing.effectiveFrom ? existing.effectiveFrom.split("T")[0] : new Date().toISOString().split("T")[0]
      });
    } else {
      setFormData(prev => ({ ...prev, employeeId: empId }));
    }
  };

  const openConfigureModal = (structure = null) => {
    if (structure) {
      const empId = structure.employeeId?._id || structure.employeeId;
      setFormData({
        employeeId: empId,
        basicSalary: structure.basicSalary || 0,
        hra: structure.hra || 0,
        allowances: structure.allowances || 0,
        bonus: structure.bonus || 0,
        overtimeRate: structure.overtimeRate || 0,
        otherEarnings: structure.otherEarnings || 0,
        otherDeductions: structure.otherDeductions || 0,
        effectiveFrom: structure.effectiveFrom ? structure.effectiveFrom.split("T")[0] : new Date().toISOString().split("T")[0]
      });
    } else if (employees.length > 0) {
      handleEmployeeChange(employees[0]._id);
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.createSalaryStructure(formData);
      setAlert({ type: "success", message: "Salary structure assigned successfully!" });
      setShowModal(false);
      loadData();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  };

  const currentGross = (
    Number(formData.basicSalary || 0) +
    Number(formData.hra || 0) +
    Number(formData.allowances || 0) +
    Number(formData.bonus || 0) +
    Number(formData.otherEarnings || 0)
  );

  const netEstimated = currentGross - Number(formData.otherDeductions || 0);

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div className="card-header">
          <h3>Employee Salary Structures</h3>
          <button className="btn btn-primary" onClick={() => openConfigureModal()}>
            + Configure / Assign Salary
          </button>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Basic Salary</th>
                <th>HRA</th>
                <th>Allowances</th>
                <th>Bonus</th>
                <th>OT Rate/Hr</th>
                <th>Est. Monthly Gross</th>
                <th>Other Deductions</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {structures.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    {loading ? "Loading salary structures..." : "No salary structures configured yet."}
                  </td>
                </tr>
              ) : (
                structures.map((s) => {
                  const estGross = (s.basicSalary + s.hra + s.allowances + s.bonus + s.otherEarnings);
                  return (
                    <tr key={s._id}>
                      <td>
                        <strong>{s.employeeId?.name || "Unknown"}</strong>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {s.employeeId?.employeeCode} • {s.employeeId?.departmentId?.departmentName}
                        </div>
                      </td>
                      <td>₹{s.basicSalary.toLocaleString()}</td>
                      <td>₹{s.hra.toLocaleString()}</td>
                      <td>₹{s.allowances.toLocaleString()}</td>
                      <td>₹{s.bonus.toLocaleString()}</td>
                      <td>₹{s.overtimeRate}/hr</td>
                      <td><strong style={{ color: "var(--accent-cyan)" }}>₹{estGross.toLocaleString()}</strong></td>
                      <td>
                        {s.otherDeductions > 0 ? (
                          <span style={{ color: "var(--accent-red)", fontWeight: 600 }}>
                            -₹{s.otherDeductions.toLocaleString()}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>₹0</span>
                        )}
                      </td>
                      <td>
                        <span className={`role-pill ${s.status === "active" ? "role-employee" : "role-admin"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openConfigureModal(s)}
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configure Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "560px" }}>
            <div className="card-header">
              <h3>Configure Salary Structure</h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Select Employee *</label>
                <select
                  className="form-control"
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeCode} - {emp.departmentId?.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "1px", margin: "14px 0 8px" }}>
                1. Earnings & Allowances
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Basic Salary (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>HRA (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.hra}
                    onChange={(e) => setFormData({ ...formData, hra: Number(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Special Allowances (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Performance Bonus (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: Number(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Other Earnings / Perks (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.otherEarnings}
                    onChange={(e) => setFormData({ ...formData, otherEarnings: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Overtime Rate (₹/Hour)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.overtimeRate}
                    onChange={(e) => setFormData({ ...formData, overtimeRate: Number(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>

              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-red)", textTransform: "uppercase", letterSpacing: "1px", margin: "16px 0 8px" }}>
                2. Custom Deductions & Adjustments
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Other Deductions (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 0, loan recovery, or test anomaly value"
                    value={formData.otherDeductions}
                    onChange={(e) => setFormData({ ...formData, otherDeductions: Number(e.target.value) })}
                    min="0"
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "3px", display: "block" }}>
                    Manual/abnormal monthly deduction (tested against statutory 50% cap).
                  </small>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Effective Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                  />
                </div>
              </div>

              {/* Calculated Monthly Gross & Net Preview Box */}
              <div style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                padding: "14px 16px",
                margin: "16px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Monthly Compensation Preview
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Gross: ₹{currentGross.toLocaleString()} | Other Deductions: -₹{Number(formData.otherDeductions || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: 700, color: netEstimated >= 0 ? "var(--accent-cyan)" : "var(--accent-red)" }}>
                    ₹{netEstimated.toLocaleString()}
                  </span>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Est. Net (Pre-Tax/PF)</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Salary Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
