import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function PayrollAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsOverview();
      setData(res.data);
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to load payroll analytics" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="card">Loading predictive payroll analytics & business intelligence...</div>;
  }

  const overview = data?.overview || {};
  const departments = data?.departments || [];
  const trends = data?.trends || [];
  const forecast = data?.forecast || {};
  const insights = data?.insights || [];

  // Find max value among trends & forecast for relative visual scaling
  const allBars = [
    ...trends.map((t) => t.totalGross),
    ...(forecast.projections || []).map((p) => p.totalGross)
  ];
  const maxGross = Math.max(...allBars, 1);

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Predictive Payroll Analytics & Intelligence</h3>
            <p style={{ color: "#6c757d", fontSize: "12px", marginTop: "2px" }}>
              Backend aggregation pipelines convert historical compensation cycles into forecasting & department insights.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadAnalytics}>
            ↻ Refresh Analytics
          </button>
        </div>

        {/* Section A: Payroll Overview KPIs */}
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <h4>Total Monthly Payroll</h4>
            <p className="stat-number">₹{Number(overview.totalMonthlyPayroll || 0).toLocaleString()}</p>
            <span style={{ fontSize: "11px", color: "#6c757d" }}>
              Cycle: {overview.latestPeriodName}
            </span>
          </div>

          <div className="stat-card">
            <h4>Annual Disbursed Budget</h4>
            <p className="stat-number" style={{ color: "var(--accent-cyan)" }}>
              ₹{Number(overview.totalAnnualPayroll || 0).toLocaleString()}
            </p>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Active year-to-date
            </span>
          </div>

          <div className="stat-card">
            <h4>Total Headcount</h4>
            <p className="stat-number">{overview.totalEmployees || 0}</p>
            <span style={{ fontSize: "11px", color: "#6c757d" }}>
              Active employees
            </span>
          </div>

          <div className="stat-card">
            <h4>Average Monthly Salary</h4>
            <p className="stat-number">₹{Number(overview.averageSalary || 0).toLocaleString()}</p>
            <span style={{ fontSize: "11px", color: "#6c757d" }}>
              Per employee
            </span>
          </div>
        </div>
      </div>

      {/* Section E: Financial & Strategic Business Insights */}
      {insights.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Automated Financial Insights</h3>
          </div>
          <div>
            {insights.map((ins, idx) => (
              <div key={idx} className={`insight-card ${ins.type}`}>
                <strong style={{ fontSize: "13px", display: "block", marginBottom: "3px" }}>
                  {ins.title}
                </strong>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {ins.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section D: Predictive Future Payroll Forecasting */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Future Payroll Expenditure Forecasting</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "2px" }}>
              Estimated trajectory computed via linear trend analysis across historical finalized periods.
            </p>
          </div>
          {forecast.hasSufficientData && (
            <span className="role-pill role-employee" style={{ padding: "4px 8px" }}>
              Trend Trajectory: {forecast.slope >= 0 ? `+₹${Math.round(forecast.slope).toLocaleString()}/mo` : `-₹${Math.round(Math.abs(forecast.slope)).toLocaleString()}/mo`}
            </span>
          )}
        </div>

        {!forecast.hasSufficientData ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-secondary)" }}>
            <p style={{ fontWeight: 600, color: "var(--accent-orange)", marginBottom: "4px" }}>
              ℹ More Historical Data Required
            </p>
            <p style={{ fontSize: "13px" }}>
              {forecast.message}
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              {forecast.message} Projected annual payroll budget run rate: <strong>₹{Number(forecast.projectedAnnual || 0).toLocaleString()}</strong>.
            </p>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Forecast Period</th>
                    <th>Projected Gross (₹)</th>
                    <th>Est. Statutory Deductions</th>
                    <th>Projected Net Payout</th>
                    <th>Relative Scale</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.projections.map((proj, idx) => {
                    const barWidth = Math.min(100, Math.round((proj.totalGross / maxGross) * 100));
                    return (
                      <tr key={idx}>
                        <td>
                          <span className="role-pill role-admin" style={{ fontWeight: 700 }}>
                            PROJECTION
                          </span>
                        </td>
                        <td><strong>{proj.periodName}</strong></td>
                        <td><strong style={{ color: "var(--accent-cyan)" }}>₹{proj.totalGross.toLocaleString()}</strong></td>
                        <td style={{ color: "var(--accent-red)" }}>-₹{proj.totalDeductions.toLocaleString()}</td>
                        <td><strong style={{ color: "var(--accent-green)" }}>₹{proj.totalNet.toLocaleString()}</strong></td>
                        <td style={{ minWidth: "160px" }}>
                          <div className="comparison-bar-track">
                            <div
                              className="comparison-bar-fill bar-proposed"
                              style={{ width: `${barWidth}%`, opacity: 0.85 }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Section B: Department-Wise Analytics */}
      <div className="card">
        <div className="card-header">
          <h3>Department-Wise Payroll Distribution</h3>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Staff Count</th>
                <th>Total Gross Payout</th>
                <th>Avg. Salary</th>
                <th>Total Bonuses</th>
                <th>Share of Budget</th>
                <th>Budget Share Bar</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "#6c757d" }}>
                    No department payroll data available yet.
                  </td>
                </tr>
              ) : (
                departments.map((dept, idx) => (
                  <tr key={idx}>
                    <td><strong>{dept.departmentName}</strong></td>
                    <td>{dept.employeeCount}</td>
                    <td><strong>₹{dept.totalGross.toLocaleString()}</strong></td>
                    <td>₹{dept.averageSalary.toLocaleString()}</td>
                    <td>₹{dept.totalBonus.toLocaleString()}</td>
                    <td>
                      <span className="role-pill role-employee">
                        {dept.budgetSharePercentage}%
                      </span>
                    </td>
                    <td style={{ minWidth: "140px" }}>
                      <div className="comparison-bar-track">
                        <div
                          className="comparison-bar-fill bar-current"
                          style={{ width: `${Math.max(5, dept.budgetSharePercentage)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section C: Historical Payroll Trends */}
      <div className="card">
        <div className="card-header">
          <h3>Historical Payroll Growth & Expenditure Trends</h3>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Period</th>
                <th>Processed Staff</th>
                <th>Gross Expenditure</th>
                <th>Deductions</th>
                <th>Net Disbursed</th>
                <th>MoM Growth</th>
              </tr>
            </thead>
            <tbody>
              {trends.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "#6c757d" }}>
                    No historical finalized cycles recorded yet.
                  </td>
                </tr>
              ) : (
                trends.map((t) => (
                  <tr key={t.periodId}>
                    <td>
                      <span className="role-pill role-employee">
                        ACTUAL
                      </span>
                    </td>
                    <td><strong>{t.periodName}</strong></td>
                    <td>{t.totalEmployees}</td>
                    <td><strong>₹{t.totalGross.toLocaleString()}</strong></td>
                    <td style={{ color: "#dc3545" }}>-₹{t.totalDeductions.toLocaleString()}</td>
                    <td><strong style={{ color: "#198754" }}>₹{t.totalNet.toLocaleString()}</strong></td>
                    <td>
                      {t.growthRate !== 0 ? (
                        <span className={t.growthRate > 0 ? "diff-positive" : "diff-gain"}>
                          {t.growthRate > 0 ? `+${t.growthRate}%` : `${t.growthRate}%`}
                        </span>
                      ) : (
                        <span style={{ color: "#6c757d" }}>Baseline</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

