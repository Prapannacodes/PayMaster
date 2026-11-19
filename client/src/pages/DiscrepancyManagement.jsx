import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function DiscrepancyManagement() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, underReview: 0, resolved: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Review Modal State
  const [activeTicket, setActiveTicket] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("Resolved");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [statusFilter, categoryFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.getAllDiscrepancies({
        status: statusFilter,
        category: categoryFilter
      });
      setTickets(res.tickets || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to load discrepancy tickets" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (ticket) => {
    setActiveTicket(ticket);
    setReviewStatus(ticket.status === "Pending" ? "Under Review" : ticket.status);
    setAdminRemarks(ticket.adminRemarks || "");
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!activeTicket) return;

    try {
      setSubmitting(true);
      await api.updateDiscrepancyStatus(activeTicket._id, {
        status: reviewStatus,
        adminRemarks
      });
      setAlert({ type: "success", message: `Ticket updated to ${reviewStatus}` });
      setActiveTicket(null);
      loadTickets();
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to update ticket" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (st) => {
    if (st === "Resolved") return "status-pill status-resolved";
    if (st === "Under Review") return "status-pill status-review";
    if (st === "Rejected") return "status-pill status-rejected";
    return "status-pill status-pending";
  };

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Header and Stats */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Employee Salary Discrepancy & Dispute Management</h3>
            <p style={{ color: "#6c757d", fontSize: "12px", marginTop: "2px" }}>
              Review, verify, and resolve employee-submitted payroll dispute requests and compensation queries.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadTickets}>
            ↻ Refresh Tickets
          </button>
        </div>

        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <h4>Total Tickets</h4>
            <p className="stat-number">{stats.total}</p>
          </div>
          <div className="stat-card">
            <h4>Pending Review</h4>
            <p className="stat-number" style={{ color: "#fd7e14" }}>{stats.pending}</p>
          </div>
          <div className="stat-card">
            <h4>Under Investigation</h4>
            <p className="stat-number" style={{ color: "var(--accent-cyan)" }}>{stats.underReview}</p>
          </div>
          <div className="stat-card">
            <h4>Resolved Tickets</h4>
            <p className="stat-number" style={{ color: "var(--accent-green)" }}>{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
              Filter Status:
            </label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: "150px" }}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
              Filter Category:
            </label>
            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ minWidth: "180px" }}
            >
              <option value="all">All Categories</option>
              <option value="Incorrect Overtime">Incorrect Overtime</option>
              <option value="Incorrect Deduction">Incorrect Deduction</option>
              <option value="Missing Bonus">Missing Bonus</option>
              <option value="Salary Calculation Error">Calculation Error</option>
              <option value="Attendance Mismatch">Attendance Mismatch</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card">
        <div className="card-header">
          <h3>Employee Discrepancy Tickets ({tickets.length})</h3>
        </div>

        {loading ? (
          <p style={{ color: "#6c757d", padding: "10px 0" }}>Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: "#6c757d" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#198754", marginBottom: "4px" }}>
              ✓ No Active Discrepancy Tickets
            </p>
            <p style={{ fontSize: "13px" }}>
              There are no pending employee disputes matching the current filter.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>Subject & Details</th>
                  <th>Period</th>
                  <th>Claimed Amount</th>
                  <th>Status</th>
                  <th>HR Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <strong>{t.employeeName}</strong>
                      <div style={{ fontSize: "11px", color: "#6c757d" }}>
                        {t.employeeCode} • {t.departmentName}
                      </div>
                    </td>
                    <td>
                      <span className="role-pill role-hr">{t.category}</span>
                    </td>
                    <td style={{ maxWidth: "280px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.subject}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {t.description}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                        Submitted: {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>{t.periodName}</td>
                    <td>
                      <strong>{t.claimedAmount > 0 ? `₹${t.claimedAmount.toLocaleString()}` : "—"}</strong>
                    </td>
                    <td>
                      <span className={getStatusClass(t.status)}>{t.status}</span>
                    </td>
                    <td style={{ fontSize: "12px", maxWidth: "200px" }}>
                      {t.adminRemarks ? (
                        <span>
                          {t.adminRemarks}
                          {t.reviewedByName && (
                            <div style={{ fontSize: "10px", color: "#6c757d" }}>
                              by {t.reviewedByName}
                            </div>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: "#6c757d" }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenReview(t)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {activeTicket && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="card-header">
              <h3>Review Employee Discrepancy Ticket</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTicket(null)}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className={getStatusClass(activeTicket.status)}>
                  Current Status: {activeTicket.status}
                </span>
                <span style={{ fontSize: "12px", color: "#6c757d" }}>
                  {new Date(activeTicket.createdAt).toLocaleString()}
                </span>
              </div>

              <h4 style={{ fontSize: "15px", color: "var(--text-primary)", marginBottom: "4px" }}>
                {activeTicket.subject}
              </h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                {activeTicket.description}
              </p>
            </div>

            <div className="stats-grid" style={{ marginBottom: "16px" }}>
              <div className="stat-card" style={{ padding: "10px" }}>
                <h4 style={{ fontSize: "11px" }}>Employee</h4>
                <p style={{ fontSize: "13px", fontWeight: 600 }}>
                  {activeTicket.employeeName} ({activeTicket.employeeCode})
                </p>
              </div>
              <div className="stat-card" style={{ padding: "10px" }}>
                <h4 style={{ fontSize: "11px" }}>Cycle Period</h4>
                <p style={{ fontSize: "13px", fontWeight: 600 }}>
                  {activeTicket.periodName}
                </p>
              </div>
              <div className="stat-card" style={{ padding: "10px" }}>
                <h4 style={{ fontSize: "11px" }}>Claimed Discrepancy</h4>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#dc3545" }}>
                  ₹{Number(activeTicket.claimedAmount || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveReview}>
              <div className="form-group">
                <label>Update Ticket Status:</label>
                <select
                  className="form-control"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  required
                >
                  <option value="Under Review">Under Review (Investigating with Attendance / Timesheets)</option>
                  <option value="Resolved">Resolved (Approved & Adjustment Scheduled)</option>
                  <option value="Rejected">Rejected (Claim Invalid / Unsubstantiated)</option>
                  <option value="Pending">Keep as Pending</option>
                </select>
              </div>

              <div className="form-group">
                <label>Resolution & Communication Remarks:</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Provide resolution details that the employee will see (e.g., 'Overtime of 6 hours verified against badge logs. ₹1,800 adjustment added to December payroll draft')."
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTicket(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Resolution Remarks"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

