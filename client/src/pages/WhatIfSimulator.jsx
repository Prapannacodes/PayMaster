import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function WhatIfSimulator() {
  const [activeTab, setActiveTab] = useState("company"); // individual, department, bonus, hiring, company
  const [baseline, setBaseline] = useState(null);
  const [loadingBaseline, setLoadingBaseline] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [alert, setAlert] = useState(null);

  // Form Inputs
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [incrementPct, setIncrementPct] = useState(8);
  const [incrementAmount, setIncrementAmount] = useState(0);
  const [bonusAmount, setBonusAmount] = useState(5000);
  const [bonusPct, setBonusPct] = useState(0);
  const [newHiresCount, setNewHiresCount] = useState(2);
  const [estimatedSalary, setEstimatedSalary] = useState(50000);

  // Simulation Results
  const [result, setResult] = useState(null);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadBaseline();
  }, []);

  const loadBaseline = async () => {
    try {
      setLoadingBaseline(true);
      const res = await api.getSimulatorBaseline();
      setBaseline(res.baseline);
      if (res.baseline.employees?.length > 0) {
        setSelectedEmployeeId(res.baseline.employees[0].employeeId);
      }
      if (res.baseline.departments?.length > 0) {
        setSelectedDepartmentId(res.baseline.departments[0]._id);
      }
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to load baseline metrics" });
    } finally {
      setLoadingBaseline(false);
    }
  };

  // Re-run simulation on input or tab change
  useEffect(() => {
    if (baseline) {
      executeSimulation();
    }
  }, [
    activeTab,
    selectedEmployeeId,
    selectedDepartmentId,
    incrementPct,
    incrementAmount,
    bonusAmount,
    bonusPct,
    newHiresCount,
    estimatedSalary,
    baseline
  ]);

  const executeSimulation = async () => {
    try {
      setCalculating(true);
      const payload = {
        simulationType: activeTab,
        employeeId: selectedEmployeeId,
        departmentId: selectedDepartmentId,
        incrementPercentage: Number(incrementPct) || 0,
        incrementAmount: Number(incrementAmount) || 0,
        bonusAmount: Number(bonusAmount) || 0,
        bonusPercentage: Number(bonusPct) || 0,
        newHiresCount: Number(newHiresCount) || 1,
        estimatedSalary: Number(estimatedSalary) || 0
      };

      const res = await api.runSimulation(payload);
      setResult(res.result);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setCalculating(false);
    }
  };

  const handleApplyToLive = async () => {
    try {
      setApplying(true);
      const payload = {
        simulationType: activeTab,
        employeeId: selectedEmployeeId,
        departmentId: selectedDepartmentId,
        incrementPercentage: Number(incrementPct) || 0,
        incrementAmount: Number(incrementAmount) || 0,
        bonusAmount: Number(bonusAmount) || 0,
        bonusPercentage: Number(bonusPct) || 0
      };

      const res = await api.applySimulation(payload);
      setAlert({
        type: "success",
        message: res.message || "Simulated revisions applied to live records."
      });
      setShowApplyConfirm(false);
      loadBaseline();
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to apply simulation" });
    } finally {
      setApplying(false);
    }
  };

  if (loadingBaseline) {
    return <div className="card">Loading baseline organization payroll data...</div>;
  }

  const currentGross = result?.currentMetrics?.monthlyGross || baseline?.totalMonthlyGross || 0;
  const proposedGross = result?.proposedMetrics?.monthlyGross || currentGross;
  const monthlyDiff = result?.financialImpact?.monthlyDifference || 0;
  const annualDiff = result?.financialImpact?.annualDifference || 0;
  const pctIncrease = result?.financialImpact?.percentageIncrease || 0;

  // Max for comparison bar scaling
  const maxBarValue = Math.max(currentGross, proposedGross, 1);
  const currentBarWidth = Math.min(100, Math.round((currentGross / maxBarValue) * 100));
  const proposedBarWidth = Math.min(100, Math.round((proposedGross / maxBarValue) * 100));

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Simulator Header & Notice */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Interactive Salary What-If Simulator</h3>
            <p style={{ color: "#6c757d", fontSize: "12px", marginTop: "2px" }}>
              Model proposed compensation hikes, team bonuses, and hiring expansions BEFORE budgeting commitments.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span className="role-pill role-employee" style={{ padding: "5px 10px" }}>
              ⚡ Interactive Modeling
            </span>
            {result?.impactedEmployeesCount > 0 && activeTab !== "hiring" && (
              <button
                className="btn btn-success btn-sm"
                onClick={() => setShowApplyConfirm(true)}
                disabled={applying}
              >
                {applying ? "Applying..." : "✓ Apply Revisions to Live Records"}
              </button>
            )}
          </div>
        </div>

        {/* Live Simulation KPIs */}
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <h4>Current Monthly Payroll</h4>
            <p className="stat-number">₹{currentGross.toLocaleString()}</p>
            <span style={{ fontSize: "11px", color: "#6c757d" }}>
              Annual: ₹{(currentGross * 12).toLocaleString()}
            </span>
          </div>

          <div className="stat-card">
            <h4>Proposed Monthly Payroll</h4>
            <p className="stat-number" style={{ color: "#0d6efd" }}>
              ₹{proposedGross.toLocaleString()}
            </p>
            <span style={{ fontSize: "11px", color: "#6c757d" }}>
              Annual: ₹{(proposedGross * 12).toLocaleString()}
            </span>
          </div>

          <div className="stat-card">
            <h4>Monthly Added Expense</h4>
            <p className="stat-number" style={{ color: monthlyDiff >= 0 ? "#dc3545" : "#198754" }}>
              {monthlyDiff >= 0 ? `+₹${monthlyDiff.toLocaleString()}` : `-₹${Math.abs(monthlyDiff).toLocaleString()}`}
            </p>
            <span style={{ fontSize: "11px", color: "#6c757d" }}>
              Net increase: {pctIncrease}%
            </span>
          </div>

          <div className="stat-card">
            <h4>Annual Budget Impact</h4>
            <p className="stat-number" style={{ color: annualDiff >= 0 ? "#dc3545" : "#198754" }}>
              {annualDiff >= 0 ? `+₹${annualDiff.toLocaleString()}` : `-₹${Math.abs(annualDiff).toLocaleString()}`}
            </p>
            <span style={{ fontSize: "11px", color: "#6c757d" }}>
              Across {result?.proposedMetrics?.employeeCount || baseline?.totalEmployees} staff
            </span>
          </div>
        </div>

        {/* Visual Comparison Progress Bars */}
        <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
          <div className="comparison-container">
            <div className="comparison-label">
              <span>Current Payroll Baseline</span>
              <strong>₹{currentGross.toLocaleString()} / mo</strong>
            </div>
            <div className="comparison-bar-track">
              <div className="comparison-bar-fill bar-current" style={{ width: `${currentBarWidth}%` }} />
            </div>
          </div>

          <div className="comparison-container" style={{ marginBottom: 0 }}>
            <div className="comparison-label">
              <span>Simulated Proposed Payroll</span>
              <strong style={{ color: "var(--accent-teal)" }}>₹{proposedGross.toLocaleString()} / mo ({pctIncrease >= 0 ? `+${pctIncrease}%` : `${pctIncrease}%`})</strong>
            </div>
            <div className="comparison-bar-track">
              <div className="comparison-bar-fill bar-proposed" style={{ width: `${proposedBarWidth}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Scenario Tabs */}
      <div className="card">
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === "company" ? "active" : ""}`}
            onClick={() => setActiveTab("company")}
          >
            🏢 Company-Wide Hike
          </button>
          <button
            className={`tab-btn ${activeTab === "individual" ? "active" : ""}`}
            onClick={() => setActiveTab("individual")}
          >
            👤 Individual Employee
          </button>
          <button
            className={`tab-btn ${activeTab === "department" ? "active" : ""}`}
            onClick={() => setActiveTab("department")}
          >
            👥 Department Revision
          </button>
          <button
            className={`tab-btn ${activeTab === "bonus" ? "active" : ""}`}
            onClick={() => setActiveTab("bonus")}
          >
            🎁 Bonus Distribution
          </button>
          <button
            className={`tab-btn ${activeTab === "hiring" ? "active" : ""}`}
            onClick={() => setActiveTab("hiring")}
          >
            💼 New Team Expansion
          </button>
        </div>

        {/* Interactive Controls based on Scenario Tab */}
        <div style={{ padding: "8px 0" }}>
          {activeTab === "company" && (
            <div className="form-row">
              <div className="form-group">
                <label>Proposed Company-Wide Increment (%):</label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="0.5"
                    value={incrementPct}
                    onChange={(e) => setIncrementPct(Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: "90px" }}
                    value={incrementPct}
                    onChange={(e) => setIncrementPct(Number(e.target.value))}
                  />
                  <span>%</span>
                </div>
                <small style={{ color: "#6c757d" }}>
                  Simulates uniform revision across all {baseline.totalEmployees} employees.
                </small>
              </div>
            </div>
          )}

          {activeTab === "individual" && (
            <div className="form-row">
              <div className="form-group">
                <label>Select Target Employee:</label>
                <select
                  className="form-control"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  {baseline.employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.name} ({emp.employeeCode}) — Current Gross: ₹{emp.grossSalary.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Proposed Increment Percentage (%):</label>
                <input
                  type="number"
                  className="form-control"
                  value={incrementPct}
                  onChange={(e) => {
                    setIncrementPct(Number(e.target.value));
                    setIncrementAmount(0);
                  }}
                  placeholder="e.g. 10%"
                />
              </div>

              <div className="form-group">
                <label>Or Flat Monthly Increment (₹):</label>
                <input
                  type="number"
                  className="form-control"
                  value={incrementAmount}
                  onChange={(e) => {
                    setIncrementAmount(Number(e.target.value));
                    setIncrementPct(0);
                  }}
                  placeholder="e.g. 10000"
                />
              </div>
            </div>
          )}

          {activeTab === "department" && (
            <div className="form-row">
              <div className="form-group">
                <label>Select Target Department:</label>
                <select
                  className="form-control"
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                >
                  {baseline.departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Department Increment (%):</label>
                <input
                  type="number"
                  className="form-control"
                  value={incrementPct}
                  onChange={(e) => setIncrementPct(Number(e.target.value))}
                  placeholder="e.g. 12%"
                />
              </div>
            </div>
          )}

          {activeTab === "bonus" && (
            <div className="form-row">
              <div className="form-group">
                <label>Target Group:</label>
                <select
                  className="form-control"
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                >
                  <option value="">Entire Organization (All Departments)</option>
                  {baseline.departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      Only {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Flat Bonus Amount per Employee (₹):</label>
                <input
                  type="number"
                  className="form-control"
                  value={bonusAmount}
                  onChange={(e) => {
                    setBonusAmount(Number(e.target.value));
                    setBonusPct(0);
                  }}
                  placeholder="e.g. 15000"
                />
              </div>

              <div className="form-group">
                <label>Or Percentage of Basic Salary (%):</label>
                <input
                  type="number"
                  className="form-control"
                  value={bonusPct}
                  onChange={(e) => {
                    setBonusPct(Number(e.target.value));
                    setBonusAmount(0);
                  }}
                  placeholder="e.g. 25%"
                />
              </div>
            </div>
          )}

          {activeTab === "hiring" && (
            <div className="form-row">
              <div className="form-group">
                <label>Number of Proposed New Hires:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="form-control"
                  value={newHiresCount}
                  onChange={(e) => setNewHiresCount(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Estimated Monthly Gross per Hire (₹):</label>
                <input
                  type="number"
                  step="5000"
                  className="form-control"
                  value={estimatedSalary}
                  onChange={(e) => setEstimatedSalary(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Target Department:</label>
                <select
                  className="form-control"
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                >
                  {baseline.departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Impacted Employee Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <h3>
            Projected Employee Impact Table ({result?.impactedEmployeesCount || 0} Affected Staff)
          </h3>
          {calculating && <span style={{ fontSize: "12px", color: "#6c757d" }}>Recalculating...</span>}
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Current Gross</th>
                <th>Proposed Gross</th>
                <th>Monthly Impact</th>
                <th>Annual Impact</th>
                <th>% Change</th>
              </tr>
            </thead>
            <tbody>
              {(!result?.impactedEmployees || result.impactedEmployees.length === 0) ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", color: "#6c757d" }}>
                    No impacted employees for this scenario configuration.
                  </td>
                </tr>
              ) : (
                result.impactedEmployees.map((emp) => (
                  <tr key={emp.employeeId}>
                    <td><code>{emp.employeeCode}</code></td>
                    <td><strong>{emp.name}</strong></td>
                    <td>{emp.departmentName}</td>
                    <td>₹{Number(emp.currentGross || 0).toLocaleString()}</td>
                    <td><strong style={{ color: "var(--accent-cyan)" }}>₹{Number(emp.proposedGross || 0).toLocaleString()}</strong></td>
                    <td>
                      <span className={emp.monthlyDifference >= 0 ? "diff-positive" : "diff-gain"}>
                        {emp.monthlyDifference >= 0 ? `+₹${emp.monthlyDifference.toLocaleString()}` : `-₹${Math.abs(emp.monthlyDifference).toLocaleString()}`}
                      </span>
                    </td>
                    <td>
                      <span className={emp.annualDifference >= 0 ? "diff-positive" : "diff-gain"}>
                        {emp.annualDifference >= 0 ? `+₹${emp.annualDifference.toLocaleString()}` : `-₹${Math.abs(emp.annualDifference).toLocaleString()}`}
                      </span>
                    </td>
                    <td>
                      <span className="role-pill role-employee">
                        +{emp.percentageIncrease}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Confirmation Modal to Apply Simulation to Live Records */}
      {showApplyConfirm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="card-header">
              <h3>Confirm Applying Simulation to Real Records</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowApplyConfirm(false)}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.5" }}>
                You are about to apply the simulated compensation changes to <strong>{result?.impactedEmployeesCount} live employee records</strong>.
              </p>
              <div className="stats-grid" style={{ marginTop: "12px", marginBottom: 0 }}>
                <div className="stat-card" style={{ padding: "10px" }}>
                  <h4 style={{ fontSize: "11px" }}>Monthly Added Expense</h4>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#dc3545" }}>
                    +₹{result?.financialImpact?.monthlyDifference?.toLocaleString()}
                  </p>
                </div>
                <div className="stat-card" style={{ padding: "10px" }}>
                  <h4 style={{ fontSize: "11px" }}>Annual Impact</h4>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#dc3545" }}>
                    +₹{result?.financialImpact?.annualDifference?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <p style={{ fontSize: "12px", color: "#6c757d", marginBottom: "16px" }}>
              Note: This will mark existing salary structures as inactive and create new active salary structures matching this scenario. This action is logged in the system audit trail.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowApplyConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleApplyToLive}
                disabled={applying}
              >
                {applying ? "Applying Changes..." : "Confirm & Apply Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

