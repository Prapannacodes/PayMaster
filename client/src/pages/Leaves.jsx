import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function Leaves({ user }) {
  const isEmployee = user?.role === "employee";
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: "",
    leaveType: "Paid Leave",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    days: 1,
    isPaid: true,
    reason: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lvRes, empRes] = await Promise.all([
        api.getLeaves(),
        !isEmployee ? api.getEmployees() : Promise.resolve({ employees: [] })
      ]);
      setLeaves(lvRes.leaves);
      if (!isEmployee) {
        setEmployees(empRes.employees);
        if (empRes.employees.length > 0 && !formData.employeeId) {
          setFormData(prev => ({ ...prev, employeeId: empRes.employees[0]._id }));
        }
      }
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.applyLeave(formData);
      setAlert({ type: "success", message: "Leave application submitted successfully!" });
      setFormData(prev => ({ ...prev, reason: "", days: 1 }));
      loadData();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  };

  const handleStatusUpdate = async (id, status) => {
    const reviewRemarks = window.prompt(`Enter remarks for ${status.toLowerCase()} (optional):`) || "";
    try {
      await api.updateLeaveStatus(id, { status, reviewRemarks });
      setAlert({ type: "success", message: `Leave ${status.toLowerCase()} successfully` });
      loadData();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  };

  const getStatusBadge = (st) => {
    if (st === "Approved") return "role-employee";
    if (st === "Rejected") return "role-admin";
    return "role-hr"; // Pending
  };

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        {/* Apply Leave Form */}
        <div className="card">
          <h3 style={{ marginBottom: "16px" }}>Apply for Leave</h3>
          <form onSubmit={handleApply}>
            {!isEmployee && (
              <div className="form-group">
                <label>Select Employee *</label>
                <select
                  className="form-control"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Leave Type</label>
              <select
                className="form-control"
                value={formData.leaveType}
                onChange={(e) => {
                  const type = e.target.value;
                  setFormData({
                    ...formData,
                    leaveType: type,
                    isPaid: type !== "Unpaid Leave"
                  });
                }}
              >
                <option value="Paid Leave">Paid Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Unpaid Leave">Unpaid Leave (Affects Payroll)</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>From Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>To Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Total Days *</label>
              <input
                type="number"
                step="0.5"
                className="form-control"
                value={formData.days}
                onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
                min="0.5"
                required
              />
            </div>

            <div className="form-group">
              <label>Reason *</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Reason for taking leave..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Submit Leave Request
            </button>
          </form>
        </div>

        {/* Leaves Table */}
        <div className="card">
          <h3 style={{ marginBottom: "16px" }}>Leave Applications</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  {!isEmployee && <th>Employee</th>}
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                  {!isEmployee && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={isEmployee ? 5 : 7} style={{ textAlign: "center", color: "#717171" }}>
                      {loading ? "Loading leave requests..." : "No leave requests found."}
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l._id}>
                      {!isEmployee && (
                        <td>
                          <strong>{l.employeeId?.name || "Employee"}</strong>
                          <div style={{ fontSize: "0.75rem", color: "#717171" }}>{l.employeeId?.employeeCode}</div>
                        </td>
                      )}
                      <td>
                        {l.leaveType}
                        <div>
                          <small style={{ color: l.isPaid ? "#2e7d32" : "#c62828" }}>
                            {l.isPaid ? "Paid" : "Unpaid"}
                          </small>
                        </div>
                      </td>
                      <td>
                        {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td>{l.days} days</td>
                      <td>
                        <span className={`role-pill ${getStatusBadge(l.status)}`}>
                          {l.status}
                        </span>
                      </td>
                      <td>
                        {l.reason}
                        {l.reviewRemarks && (
                          <div style={{ fontSize: "0.75rem", color: "#717171", marginTop: "2px" }}>
                            Note: {l.reviewRemarks}
                          </div>
                        )}
                      </td>
                      {!isEmployee && (
                        <td>
                          {l.status === "Pending" ? (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleStatusUpdate(l._id, "Approved")}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleStatusUpdate(l._id, "Rejected")}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "#717171" }}>Reviewed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
