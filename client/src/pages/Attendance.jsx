import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function Attendance({ user }) {
  const isEmployee = user?.role === "employee";
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    status: "Present",
    checkIn: "09:30",
    checkOut: "18:00",
    overtimeHours: 0,
    remarks: ""
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attRes, empRes] = await Promise.all([
        api.getAttendance(selectedMonth),
        isEmployee ? Promise.resolve({ employees: [] }) : api.getEmployees()
      ]);
      setRecords(attRes.records);
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

  const handleMark = async (e) => {
    e.preventDefault();
    try {
      await api.markAttendance(formData);
      setAlert({ type: "success", message: "Attendance marked successfully!" });
      loadData();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  };

  const getStatusBadge = (st) => {
    if (st === "Present") return "role-employee";
    if (st === "Absent") return "role-admin";
    return "role-hr";
  };

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div style={{ display: "grid", gridTemplateColumns: isEmployee ? "1fr" : "1fr 2fr", gap: "24px" }}>
        {/* Entry Form (Only for HR & Admin) */}
        {!isEmployee && (
          <div className="card">
            <h3 style={{ marginBottom: "16px" }}>Mark Daily Attendance</h3>
            <form onSubmit={handleMark}>
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

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Present">Present (Full Day)</option>
                  <option value="Absent">Absent</option>
                  <option value="Half Day">Half Day (0.5 Day)</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Check In</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Check Out</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Overtime Hours (OT)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-control"
                  value={formData.overtimeHours}
                  onChange={(e) => setFormData({ ...formData, overtimeHours: Number(e.target.value) })}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Remarks</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Optional note..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Record Attendance
              </button>
            </form>
          </div>
        )}

        {/* Attendance Records List */}
        <div className="card">
          <div className="card-header">
            <h3>Attendance Log</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Filter Month:</label>
              <input
                type="month"
                className="form-control"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ width: "160px", padding: "6px 10px" }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  {!isEmployee && <th>Employee</th>}
                  <th>Status</th>
                  <th>Timings</th>
                  <th>Overtime</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={isEmployee ? 5 : 6} style={{ textAlign: "center", color: "#717171" }}>
                      {loading ? "Loading attendance..." : "No attendance records found for this month."}
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r._id}>
                      <td>{new Date(r.date).toLocaleDateString()}</td>
                      {!isEmployee && (
                        <td>
                          <strong>{r.employeeId?.name || "Employee"}</strong>
                          <div style={{ fontSize: "0.75rem", color: "#717171" }}>{r.employeeId?.employeeCode}</div>
                        </td>
                      )}
                      <td>
                        <span className={`role-pill ${getStatusBadge(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        {r.checkIn && r.checkOut ? `${r.checkIn} - ${r.checkOut}` : "—"}
                      </td>
                      <td>{r.overtimeHours ? `${r.overtimeHours} hrs` : "—"}</td>
                      <td>{r.remarks || "—"}</td>
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
