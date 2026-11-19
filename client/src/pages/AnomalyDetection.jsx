import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function AnomalyDetection() {
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, highSeverity: 0, resolved: 0 });
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [alert, setAlert] = useState(null);

  // Investigation Modal State
  const [activeAnomaly, setActiveAnomaly] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState("Resolved");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submittingResolution, setSubmittingResolution] = useState(false);

  useEffect(() => {
    loadPeriods();
    loadAnomalies();
  }, [statusFilter, severityFilter, selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const res = await api.getPayrollPeriods();
      setPeriods(res.periods || []);
    } catch (err) {
      console.error("Failed to load periods:", err);
    }
  };

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const res = await api.getAnomalies({
        status: statusFilter,
        severity: severityFilter,
        periodId: selectedPeriod
      });
      setAnomalies(res.anomalies || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to load anomaly records" });
    } finally {
      setLoading(false);
    }
  };

  const handleRunScan = async () => {
    try {
      setScanning(true);
      const targetPeriodId = selectedPeriod !== "all" ? selectedPeriod : "latest";
      const res = await api.scanAnomalies(targetPeriodId);
      setAlert({
        type: "success",
        message: `Audit scan completed: Found ${res.result?.anomaliesFound || 0} anomaly alerts in ${res.result?.periodName || "period"}.`
      });
      loadAnomalies();
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to execute anomaly scan" });
    } finally {
      setScanning(false);
    }
  };

  const handleOpenInvestigate = (anomaly) => {
    setActiveAnomaly(anomaly);
    setResolutionStatus(anomaly.status === "Pending" ? "Resolved" : anomaly.status);
    setResolutionNotes(anomaly.investigationNotes || "");
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!activeAnomaly) return;

    try {
      setSubmittingResolution(true);
      await api.resolveAnomaly(activeAnomaly._id, {
        status: resolutionStatus,
        investigationNotes: resolutionNotes
      });
      setAlert({ type: "success", message: `Alert updated to ${resolutionStatus}` });
      setActiveAnomaly(null);
      loadAnomalies();
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to update alert" });
    } finally {
      setSubmittingResolution(false);
    }
  };

  const getSeverityBadgeClass = (sev) => {
    if (sev === "High") return "severity-pill severity-high";
    if (sev === "Medium") return "severity-pill severity-medium";
    return "severity-pill severity-low";
  };

  const getStatusBadgeClass = (st) => {
    if (st === "Resolved") return "status-pill status-resolved";
    if (st === "Dismissed") return "status-pill status-dismissed";
    return "status-pill status-pending";
  };

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Header and Scan Action */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Smart Salary Anomaly & Payroll Audit Engine</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "2px" }}>
              Automated statistical rules monitor unexpected salary swings, statutory deduction thresholds, duplicate entries, and unpaid overtime.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRunScan}
            disabled={scanning}
          >
            {scanning ? "Auditing Records..." : "Run Anomaly Audit Scan"}
          </button>
        </div>

        {/* Metric Cards */}
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <h4>Total Flagged Alerts</h4>
            <p className="stat-number">{stats.total}</p>
          </div>
          <div className="stat-card">
            <h4>Pending Investigation</h4>
            <p className="stat-number" style={{ color: "#fd7e14" }}>{stats.pending}</p>
          </div>
          <div className="stat-card">
            <h4>High Severity Risks</h4>
            <p className="stat-number" style={{ color: "#dc3545" }}>{stats.highSeverity}</p>
          </div>
          <div className="stat-card">
            <h4>Resolved & Audited</h4>
            <p className="stat-number" style={{ color: "#198754" }}>{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
              Filter by Period:
            </label>
            <select
              className="form-control"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{ minWidth: "180px" }}
            >
              <option value="all">All Payroll Periods</option>
              {periods.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.periodName} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
              Severity Level:
            </label>
            <select
              className="form-control"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{ minWidth: "140px" }}
            >
              <option value="all">All Severities</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="Low">Low Severity</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
              Alert Status:
            </label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: "140px" }}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Anomalies Table */}
      <div className="card">
        <div className="card-header">
          <h3>Detected Anomaly Records ({anomalies.length})</h3>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-secondary)", padding: "10px 0" }}>Loading anomaly records...</p>
        ) : anomalies.length === 0 ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-secondary)" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--accent-green)", marginBottom: "6px" }}>
              ✓ No Anomalies Found Matching Filter Criteria
            </p>
            <p style={{ fontSize: "13px" }}>
              All scanned salary transactions are consistent with baseline compensation rules.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Anomaly Type & Explanation</th>
                  <th>Discrepancy (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((anom) => (
                  <tr key={anom._id}>
                    <td>
                      <span className={getSeverityBadgeClass(anom.severity)}>
                        {anom.severity}
                      </span>
                    </td>
                    <td>
                      <strong>{anom.employeeName}</strong>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{anom.employeeCode}</div>
                    </td>
                    <td>{anom.departmentName}</td>
                    <td style={{ maxWidth: "340px" }}>
                      <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                        {anom.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {anom.description}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Period: <strong>{anom.periodName || "General"}</strong>
                      </div>
                    </td>
                    <td>
                      <strong>₹{Number(anom.affectedAmount || 0).toLocaleString()}</strong>
                      {anom.baselineAmount > 0 && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          Base: ₹{anom.baselineAmount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(anom.status)}>
                        {anom.status}
                      </span>
                      {anom.investigatedByName && (
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                          by {anom.investigatedByName}
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenInvestigate(anom)}
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Investigation & Resolution Modal */}
      {activeAnomaly && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="card-header">
              <h3>Investigate Anomaly Alert</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveAnomaly(null)}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span className={getSeverityBadgeClass(activeAnomaly.severity)}>
                  {activeAnomaly.severity} Priority
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Flagged: {new Date(activeAnomaly.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h4 style={{ fontSize: "15px", color: "var(--text-primary)", marginBottom: "6px" }}>
                {activeAnomaly.title}
              </h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                {activeAnomaly.description}
              </p>
            </div>

            <div className="stats-grid" style={{ marginBottom: "16px" }}>
              <div className="stat-card" style={{ padding: "10px" }}>
                <h4 style={{ fontSize: "11px" }}>Employee</h4>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {activeAnomaly.employeeName} ({activeAnomaly.employeeCode})
                </p>
              </div>
              <div className="stat-card" style={{ padding: "10px" }}>
                <h4 style={{ fontSize: "11px" }}>Department</h4>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {activeAnomaly.departmentName}
                </p>
              </div>
              <div className="stat-card" style={{ padding: "10px" }}>
                <h4 style={{ fontSize: "11px" }}>Discrepancy Amount</h4>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent-red)" }}>
                  ₹{Number(activeAnomaly.affectedAmount || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitResolution}>
              <div className="form-group">
                <label>Resolution Action Status:</label>
                <select
                  className="form-control"
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  required
                >
                  <option value="Resolved">Mark as Resolved (Corrected / Verified)</option>
                  <option value="Dismissed">Dismiss Alert (False Positive / Authorized)</option>
                  <option value="Investigating">Keep Investigating</option>
                  <option value="Pending">Reset to Pending</option>
                </select>
              </div>

              <div className="form-group">
                <label>Audit & Investigation Remarks:</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain resolution findings (e.g., 'Overtime confirmed and added to next payroll cycle' or 'Salary hike verified against HR promotion letter')."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveAnomaly(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingResolution}
                >
                  {submittingResolution ? "Saving Audit Trail..." : "Save Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

