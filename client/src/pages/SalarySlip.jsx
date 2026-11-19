import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export default function SalarySlip({ recordId, user, onBack }) {
  const [record, setRecord] = useState(null);
  const [mySlips, setMySlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (recordId) {
      loadSlip(recordId);
    } else {
      loadMySlips();
    }
  }, [recordId]);

  const loadSlip = async (id) => {
    try {
      setLoading(true);
      const res = await api.getSalarySlip(id);
      setRecord(res.record);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMySlips = async () => {
    try {
      setLoading(true);
      const res = await api.getMySalarySlips();
      setMySlips(res.slips);
      if (res.slips.length > 0) {
        setRecord(res.slips[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="card">Loading salary slip document...</div>;
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">{error}</div>
        {onBack && <button className="btn btn-secondary" onClick={onBack}>← Back</button>}
      </div>
    );
  }

  if (!record) {
    return (
      <div className="card">
        <h3>My Salary Slips</h3>
        <p style={{ color: "#717171", marginTop: "10px" }}>
          No finalized salary slips found for your account yet. Once HR finalizes a payroll period, your slip will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Action buttons (hidden when printed) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }} className="no-print">
        {onBack ? (
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back to Payroll
          </button>
        ) : <div />}

        <button className="btn btn-primary" onClick={handlePrint}>
          Print / Save as PDF
        </button>
      </div>

      {/* Selector if multiple slips are available */}
      {mySlips.length > 1 && (
        <div className="card no-print" style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: 600, marginRight: "10px" }}>Select Month Slip:</label>
          <select
            className="form-control"
            style={{ width: "220px", display: "inline-block" }}
            value={record._id}
            onChange={(e) => loadSlip(e.target.value)}
          >
            {mySlips.map((s) => (
              <option key={s._id} value={s._id}>
                {s.payrollPeriodId?.periodName} (₹{s.netSalary.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Printable Salary Slip Document */}
      <div className="slip-box">
        {/* Header */}
        <div className="slip-header">
          <h2>XYZ ENTERPRISES PVT. LTD.</h2>
          <p style={{ fontSize: "0.85rem", color: "#484848" }}>
            Campus Tech Park, Sector 62, Noida, UP - 201301
          </p>
          <h3 style={{ marginTop: "10px", fontSize: "1.1rem", textDecoration: "underline" }}>
            PAYSLIP FOR {record.payrollPeriodId?.periodName || `${record.month}/${record.year}`}
          </h3>
        </div>

        {/* Employee Info Grid */}
        <div className="slip-info-grid">
          <div><strong>Employee Name:</strong> {record.employeeSnapshot?.name}</div>
          <div><strong>Employee Code:</strong> {record.employeeSnapshot?.employeeCode}</div>
          <div><strong>Department:</strong> {record.employeeSnapshot?.departmentName}</div>
          <div><strong>Designation:</strong> {record.employeeSnapshot?.designationTitle}</div>
          <div><strong>Bank Name:</strong> {record.employeeSnapshot?.bankName || "State Bank of India"}</div>
          <div><strong>Account No:</strong> {record.employeeSnapshot?.accountNumber || "XXXXXXXX1234"}</div>
          <div><strong>PAN Number:</strong> {record.employeeSnapshot?.panNumber || "ABCDE1234F"}</div>
          <div><strong>Payable Days:</strong> {record.payableDays} / {record.totalDays} Days</div>
        </div>

        {/* Earnings & Deductions Comparison */}
        <div className="slip-table-container">
          {/* Earnings Column */}
          <div className="slip-column">
            <h4>EARNINGS (₹)</h4>
            <div className="slip-row">
              <span>Basic Salary</span>
              <span>₹{record.earnings?.basicSalary.toLocaleString()}</span>
            </div>
            <div className="slip-row">
              <span>House Rent Allowance (HRA)</span>
              <span>₹{record.earnings?.hra.toLocaleString()}</span>
            </div>
            <div className="slip-row">
              <span>Special Allowances</span>
              <span>₹{record.earnings?.allowances.toLocaleString()}</span>
            </div>
            <div className="slip-row">
              <span>Performance Bonus</span>
              <span>₹{record.earnings?.bonus.toLocaleString()}</span>
            </div>
            <div className="slip-row">
              <span>Overtime Pay ({record.overtimeHours || 0} hrs)</span>
              <span>₹{record.earnings?.overtimePay.toLocaleString()}</span>
            </div>
            <div className="slip-row">
              <span>Other Earnings</span>
              <span>₹{record.earnings?.otherEarnings.toLocaleString()}</span>
            </div>
            <div className="slip-row total">
              <span>GROSS EARNINGS</span>
              <span>₹{record.grossSalary.toLocaleString()}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="slip-column">
            <h4>DEDUCTIONS (₹)</h4>
            <div className="slip-row">
              <span>Provident Fund (PF 12%)</span>
              <span>₹{record.deductions?.pf.toLocaleString()}</span>
            </div>
            <div className="slip-row">
              <span>Professional Tax (PT)</span>
              <span>₹{record.deductions?.professionalTax.toLocaleString()}</span>
            </div>
            <div className="slip-row">
              <span>Attendance / Unpaid Leave Cut</span>
              <span>₹{record.deductions?.attendanceDeduction.toLocaleString()}</span>
            </div>
            <div className="slip-row">
              <span>Income Tax (TDS)</span>
              <span>₹{record.deductions?.tax.toLocaleString()}</span>
            </div>
            <div className="slip-row">
              <span>Other Deductions</span>
              <span>₹{record.deductions?.otherDeductions.toLocaleString()}</span>
            </div>
            <div className="slip-row">
              <span>&nbsp;</span>
              <span>&nbsp;</span>
            </div>
            <div className="slip-row total">
              <span>TOTAL DEDUCTIONS</span>
              <span>₹{record.totalDeductions.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Net Salary Box */}
        <div className="slip-net">
          <span>NET TAKE-HOME PAY:</span>
          <span style={{ color: "#111", fontSize: "1.3rem" }}>
            ₹{record.netSalary.toLocaleString()}
          </span>
        </div>

        {/* Signatures */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "50px", paddingTop: "20px", borderTop: "1px dashed #aaa" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "180px", borderBottom: "1px solid #333", marginBottom: "6px" }} />
            <span style={{ fontSize: "0.8rem", color: "#555" }}>Employee Signature</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "180px", borderBottom: "1px solid #333", marginBottom: "6px" }} />
            <span style={{ fontSize: "0.8rem", color: "#555" }}>Authorized Signatory (HR)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
