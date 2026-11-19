import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function EmployeePortal({ user, onViewSalarySlip }) {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, breakdown, history, disputes

  // Discrepancy Modal
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("Incorrect Overtime");
  const [payrollPeriodId, setPayrollPeriodId] = useState("");
  const [claimedAmount, setClaimedAmount] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      setLoading(true);
      const [overviewRes, historyRes, ticketsRes, periodsRes] = await Promise.all([
        api.getEmployeeSalaryOverview(),
        api.getEmployeeSalaryHistory(),
        api.getMyDiscrepancies(),
        api.getPayrollPeriods()
      ]);

      setData(overviewRes);
      setHistory(historyRes.history || []);
      setTickets(ticketsRes.tickets || []);
      setPeriods(periodsRes.periods || []);
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Could not load employee portal data" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createDiscrepancy({
        category,
        payrollPeriodId: payrollPeriodId || undefined,
        claimedAmount: Number(claimedAmount) || 0,
        subject,
        description
      });

      setAlert({
        type: "success",
        message: "Discrepancy dispute ticket submitted successfully. HR/Payroll team will review it."
      });
      setShowModal(false);
      setSubject("");
      setDescription("");
      setClaimedAmount("");
      // Refresh tickets
      const res = await api.getMyDiscrepancies();
      setTickets(res.tickets || []);
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to submit discrepancy ticket" });
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

  if (loading) {
    return <div className="card">Loading your verified salary and compensation profile...</div>;
  }

  const emp = data?.employee;
  const struct = data?.structure;
  const latest = data?.latestSlip;

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Employee Profile Header */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Welcome, {emp?.name || user?.username}</h3>
            <p style={{ color: "#6c757d", fontSize: "12px", marginTop: "2px" }}>
              Employee Code: <strong>{emp?.employeeCode}</strong> | Department: <strong>{emp?.departmentName}</strong> | Designation: <strong>{emp?.designationTitle}</strong>
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowModal(true)}
          >
            + Raise Discrepancy Ticket
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <h4>Current Base Salary</h4>
            <p className="stat-number">₹{Number(struct?.basicSalary || 0).toLocaleString()}</p>
            <span style={{ fontSize: "11px", color: "#6c757d" }}>Monthly basic pay</span>
          </div>

          <div className="stat-card">
            <h4>Latest Monthly Gross</h4>
            <p className="stat-number" style={{ color: "var(--accent-cyan)" }}>
              ₹{Number(latest?.grossSalary || 0).toLocaleString()}
            </p>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{latest?.payrollPeriodId?.periodName || "Latest cycle"}</span>
          </div>

          <div className="stat-card">
            <h4>Latest Net Disbursed</h4>
            <p className="stat-number" style={{ color: "var(--accent-green)" }}>
              ₹{Number(latest?.netSalary || 0).toLocaleString()}
            </p>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Take-home pay</span>
          </div>

          <div className="stat-card">
            <h4>Total Deductions</h4>
            <p className="stat-number" style={{ color: "var(--accent-red)" }}>
              ₹{Number(latest?.totalDeductions || 0).toLocaleString()}
            </p>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>PF, PT & Taxes</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📋 Salary Overview & Slip
          </button>
          <button
            className={`tab-btn ${activeTab === "breakdown" ? "active" : ""}`}
            onClick={() => setActiveTab("breakdown")}
          >
            🔍 Component Breakdown
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            📈 Month-over-Month History
          </button>
          <button
            className={`tab-btn ${activeTab === "disputes" ? "active" : ""}`}
            onClick={() => setActiveTab("disputes")}
          >
            🎫 Discrepancy Tickets ({tickets.length})
          </button>
        </div>

        {/* Tab 1: Overview & Latest Payslip */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4>Latest Official Finalized Payslip</h4>
              {latest && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onViewSalarySlip(latest._id)}
                >
                  View & Print Full Document →
                </button>
              )}
            </div>

            {!latest ? (
              <p style={{ color: "var(--text-secondary)" }}>
                No finalized payroll slip available yet for your employee account. Once HR finalizes a monthly cycle, your slip will appear here.
              </p>
            ) : (
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                  <div>
                    <strong>Period: {latest.payrollPeriodId?.periodName}</strong>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Payable Days: {latest.payableDays} / {latest.totalDays} | Present: {latest.presentDays} | Overtime: {latest.overtimeHours} hrs
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="role-pill role-employee">FINALIZED</span>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent-green)", marginTop: "4px" }}>
                      Net: ₹{latest.netSalary.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div>
                    <h5 style={{ fontSize: "12px", color: "var(--accent-cyan)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>
                      Earnings Summary
                    </h5>
                    <div style={{ fontSize: "13px", lineHeight: "1.9" }}>
                      <div>Basic Salary: <strong>₹{Number(latest.earnings?.basicSalary || 0).toLocaleString()}</strong></div>
                      <div>HRA: <strong>₹{Number(latest.earnings?.hra || 0).toLocaleString()}</strong></div>
                      <div>Allowances: <strong>₹{Number(latest.earnings?.allowances || 0).toLocaleString()}</strong></div>
                      <div>Bonus: <strong>₹{Number(latest.earnings?.bonus || 0).toLocaleString()}</strong></div>
                      <div>Overtime Pay: <strong>₹{Number(latest.earnings?.overtimePay || 0).toLocaleString()}</strong></div>
                      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "6px", fontWeight: 700, color: "var(--text-primary)" }}>
                        Total Gross: ₹{Number(latest.grossSalary || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 style={{ fontSize: "12px", color: "var(--accent-red)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>
                      Deductions Summary
                    </h5>
                    <div style={{ fontSize: "13px", lineHeight: "1.9" }}>
                      <div>Provident Fund (PF): <strong>₹{Number(latest.deductions?.pf || 0).toLocaleString()}</strong></div>
                      <div>Professional Tax (PT): <strong>₹{Number(latest.deductions?.professionalTax || 0).toLocaleString()}</strong></div>
                      <div>Income Tax (TDS): <strong>₹{Number(latest.deductions?.tax || 0).toLocaleString()}</strong></div>
                      <div>Attendance Deductions: <strong>₹{Number(latest.deductions?.attendanceDeduction || 0).toLocaleString()}</strong></div>
                      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "6px", fontWeight: 700, color: "var(--accent-red)" }}>
                        Total Deductions: -₹{Number(latest.totalDeductions || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Salary Component Breakdown */}
        {activeTab === "breakdown" && (
          <div>
            <h4 style={{ marginBottom: "12px" }}>Active Compensation & Allowance Structure</h4>
            {!struct ? (
              <p style={{ color: "#6c757d" }}>No active salary structure configured for your profile.</p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Type</th>
                      <th>Monthly Amount (₹)</th>
                      <th>Annualized Amount (₹)</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Basic Salary</strong></td>
                      <td>Fixed Earning</td>
                      <td><strong>₹{struct.basicSalary.toLocaleString()}</strong></td>
                      <td>₹{(struct.basicSalary * 12).toLocaleString()}</td>
                      <td>Core taxable base</td>
                    </tr>
                    <tr>
                      <td><strong>House Rent Allowance (HRA)</strong></td>
                      <td>Allowance</td>
                      <td>₹{struct.hra.toLocaleString()}</td>
                      <td>₹{(struct.hra * 12).toLocaleString()}</td>
                      <td>Exempt subject to rent receipts</td>
                    </tr>
                    <tr>
                      <td><strong>Special Allowances</strong></td>
                      <td>Allowance</td>
                      <td>₹{struct.allowances.toLocaleString()}</td>
                      <td>₹{(struct.allowances * 12).toLocaleString()}</td>
                      <td>Standard monthly allowance</td>
                    </tr>
                    <tr>
                      <td><strong>Bonus Baseline</strong></td>
                      <td>Variable Earning</td>
                      <td>₹{struct.bonus.toLocaleString()}</td>
                      <td>₹{(struct.bonus * 12).toLocaleString()}</td>
                      <td>Performance incentive</td>
                    </tr>
                    <tr>
                      <td><strong>Overtime Rate</strong></td>
                      <td>Hourly Rate</td>
                      <td>₹{struct.overtimeRate} / hr</td>
                      <td>Variable</td>
                      <td>Paid per approved overtime hour</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Month-over-Month History & Comparison */}
        {activeTab === "history" && (
          <div>
            <h4 style={{ marginBottom: "12px" }}>Compensation Progression & Month-over-Month Variance</h4>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Payroll Period</th>
                    <th>Basic (₹)</th>
                    <th>Gross Salary (₹)</th>
                    <th>Deductions (₹)</th>
                    <th>Net Disbursed (₹)</th>
                    <th>MoM Difference</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", color: "#6c757d" }}>
                        No historical finalized salary records found.
                      </td>
                    </tr>
                  ) : (
                    history.map((rec) => (
                      <tr key={rec.recordId}>
                        <td><strong>{rec.periodName}</strong></td>
                        <td>₹{rec.basicSalary.toLocaleString()}</td>
                        <td><strong>₹{rec.grossSalary.toLocaleString()}</strong></td>
                        <td style={{ color: "#dc3545" }}>-₹{rec.totalDeductions.toLocaleString()}</td>
                        <td><strong style={{ color: "#198754" }}>₹{rec.netSalary.toLocaleString()}</strong></td>
                        <td>
                          {rec.netDifference !== 0 ? (
                            <span className={rec.netDifference > 0 ? "diff-gain" : "diff-positive"}>
                              {rec.netDifference > 0 ? `+₹${rec.netDifference.toLocaleString()} (+${rec.percentageChange}%)` : `-₹${Math.abs(rec.netDifference).toLocaleString()} (${rec.percentageChange}%)`}
                            </span>
                          ) : (
                            <span style={{ color: "#6c757d" }}>— Baseline</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onViewSalarySlip(rec.recordId)}
                          >
                            View Slip
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Salary Discrepancy Tickets */}
        {activeTab === "disputes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4>My Submitted Salary Discrepancy Tickets</h4>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowModal(true)}
              >
                + Raise New Ticket
              </button>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Subject & Description</th>
                    <th>Period</th>
                    <th>Disputed Amount</th>
                    <th>Status</th>
                    <th>HR / Admin Remarks</th>
                    <th>Date Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", color: "#6c757d" }}>
                        You have not submitted any salary discrepancy tickets. Everything looks clean!
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr key={t._id}>
                        <td><strong>{t.category}</strong></td>
                        <td style={{ maxWidth: "300px" }}>
                          <div style={{ fontWeight: 600 }}>{t.subject}</div>
                          <div style={{ fontSize: "12px", color: "#495057", marginTop: "2px" }}>
                            {t.description}
                          </div>
                        </td>
                        <td>{t.periodName}</td>
                        <td>
                          <strong>{t.claimedAmount > 0 ? `₹${t.claimedAmount.toLocaleString()}` : "—"}</strong>
                        </td>
                        <td>
                          <span className={getStatusClass(t.status)}>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          {t.adminRemarks ? (
                            <span style={{ fontSize: "12px", color: "#2c3e50" }}>
                              {t.adminRemarks}
                              {t.reviewedByName && (
                                <div style={{ fontSize: "10px", color: "#6c757d" }}>
                                  — {t.reviewedByName}
                                </div>
                              )}
                            </span>
                          ) : (
                            <span style={{ color: "#6c757d", fontSize: "12px" }}>Pending review</span>
                          )}
                        </td>
                        <td style={{ fontSize: "12px", color: "#6c757d" }}>
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Discrepancy Ticket Submission Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="card-header">
              <h3>Raise Salary Discrepancy Request</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowModal(false)}
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label>Issue Category:</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="Incorrect Overtime">Incorrect Overtime Payment</option>
                  <option value="Incorrect Deduction">Incorrect Deduction (PF / Tax / Attendance)</option>
                  <option value="Missing Bonus">Missing Bonus / Allowance</option>
                  <option value="Salary Calculation Error">Salary Calculation Error</option>
                  <option value="Attendance Mismatch">Attendance / Leave Mismatch</option>
                  <option value="Other">Other Compensation Query</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Affected Payroll Period:</label>
                  <select
                    className="form-control"
                    value={payrollPeriodId}
                    onChange={(e) => setPayrollPeriodId(e.target.value)}
                  >
                    <option value="">General Query (No Specific Period)</option>
                    {periods.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.periodName} ({p.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Claimed Discrepancy Amount (₹):</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 1800 (optional)"
                    value={claimedAmount}
                    onChange={(e) => setClaimedAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Subject Summary:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Overtime hours on Nov 5 not credited"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Detailed Description & Evidence:</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Provide complete details (dates worked, discrepancy amounts, manager approvals, etc.)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Discrepancy Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

