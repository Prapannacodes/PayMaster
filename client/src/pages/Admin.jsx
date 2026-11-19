import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";
import AnomalyDetection from "./AnomalyDetection";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, logsRes] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs()
      ]);
      setUsers(usersRes.users);
      setLogs(logsRes.logs);
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      setAlert({ type: "success", message: "User role updated successfully!" });
      loadData();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  };

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button
          className={`btn ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("users")}
        >
          👤 User Accounts ({users.length})
        </button>
        <button
          className={`btn ${activeTab === "anomalies" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("anomalies")}
        >
          🚨 Anomaly Detection Center
        </button>
        <button
          className={`btn ${activeTab === "audit" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("audit")}
        >
          📜 Audit Trail ({logs.length})
        </button>
      </div>

      {/* Anomaly Detection Section */}
      {activeTab === "anomalies" && <AnomalyDetection />}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="card">
          <div className="card-header">
            <h3>System User Roles & Access Control</h3>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Profile Link</th>
                  <th>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-pill ${u.role === "admin" ? "role-admin" : u.role === "hr" ? "role-hr" : "role-employee"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.employeeId ? `${u.employeeId.name} (${u.employeeId.employeeCode})` : "System User"}</td>
                    <td>
                      <select
                        className="form-control"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        style={{ width: "120px", padding: "4px 8px" }}
                      >
                        <option value="admin">admin</option>
                        <option value="hr">hr</option>
                        <option value="employee">employee</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === "audit" && (
        <div className="card">
          <div className="card-header">
            <h3>Audit Activity Trail</h3>
            <button className="btn btn-secondary btn-sm" onClick={loadData}>🔄 Refresh</button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                      {loading ? "Loading audit trail..." : "No audit entries recorded yet."}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td><strong>{log.action}</strong></td>
                      <td>{log.performedByName}</td>
                      <td>{log.details || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
