import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function TaxAndDeductions() {
  const [taxRules, setTaxRules] = useState([]);
  const [deductionRules, setDeductionRules] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taxRes, dedRes] = await Promise.all([
        api.getTaxRules(),
        api.getDeductionRules()
      ]);
      setTaxRules(taxRes.rules);
      setDeductionRules(dedRes.rules);
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const activeTaxRule = taxRules.find((r) => r.status === "active") || taxRules[0];

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card" style={{ backgroundColor: "rgba(0, 229, 255, 0.04)", borderLeft: "4px solid var(--accent-cyan)" }}>
        <h4 style={{ marginBottom: "6px", color: "var(--accent-cyan)" }}>Tax & Deductions Rules</h4>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
          1. <strong>Tax Calculation:</strong> Gross monthly salary is annualized (Gross × 12). Standard Deduction (₹50,000) is deducted. The remaining taxable income is evaluated through the configurable progressive tax slabs. Total annual tax is divided by 12 for the monthly deduction.<br />
          2. <strong>Provident Fund (PF):</strong> 12% calculated directly on the Employee's Basic Salary.<br />
          3. <strong>Professional Tax (PT):</strong> Fixed monthly deduction (₹200).
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
        {/* Tax Slabs Card */}
        <div className="card">
          <div className="card-header">
            <h3>Active Tax Regime & Slabs</h3>
            <span className="role-pill role-employee">Active</span>
          </div>

          {activeTaxRule ? (
            <div>
              <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                <div><strong>Regime Name:</strong> {activeTaxRule.name}</div>
                <div><strong>Financial Year:</strong> {activeTaxRule.financialYear} ({activeTaxRule.regime})</div>
                <div><strong>Standard Deduction:</strong> ₹{activeTaxRule.standardDeduction?.toLocaleString()}</div>
              </div>

              <h4 style={{ fontSize: "0.95rem", marginBottom: "10px" }}>Income Tax Slabs:</h4>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Income Range (₹)</th>
                      <th>Tax Rate (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTaxRule.slabs?.map((slab, idx) => (
                      <tr key={idx}>
                        <td>
                          {slab.minIncome.toLocaleString()} — {slab.maxIncome ? slab.maxIncome.toLocaleString() : "Above"}
                        </td>
                        <td>
                          <strong>{slab.ratePercentage}%</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)" }}>
              {loading ? "Loading tax rules..." : "No active tax regime configured."}
            </p>
          )}
        </div>

        {/* Deduction Rules Card */}
        <div className="card">
          <div className="card-header">
            <h3>Configured Statutory Deductions</h3>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Deduction Name</th>
                  <th>Code</th>
                  <th>Value</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {deductionRules.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <strong>{d.name}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#717171" }}>{d.description}</div>
                    </td>
                    <td><span className="role-pill role-hr">{d.code}</span></td>
                    <td>
                      <strong>{d.type === "percentage" ? `${d.value}%` : `₹${d.value}`}</strong>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{d.appliesTo} Salary</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
