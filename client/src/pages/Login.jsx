import React, { useState } from "react";
import { api } from "../services/api";

export default function Login({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.login({ identifier, password });
      localStorage.setItem("token", data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (email, pwd) => {
    setIdentifier(email);
    setPassword(pwd);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Brand Logo Header */}
        <div className="login-header-logo">
          <div className="brand-badge" style={{ width: "42px", height: "42px", fontSize: "19px" }}>
            PM
          </div>
          <div style={{ textAlign: "left" }}>
            <h2 style={{ fontSize: "19px", textAlign: "left", letterSpacing: "-0.3px" }}>
              Pay<span style={{ color: "var(--cyan)" }}>Master</span>
            </h2>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
              Enterprise HR & Payroll Platform
            </div>
          </div>
        </div>

        <p className="login-subtitle">
          Sign in to access organizational payroll, analytics & compensation ledgers
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username / Corporate Email</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. admin@salary.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Security Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "10px", padding: "10px 16px", fontSize: "13px" }}
            disabled={loading}
          >
            {loading ? "Authenticating Session..." : "Sign In to Portal →"}
          </button>
        </form>

        {/* Quick Fill Demo Credentials */}
        <div className="test-credentials">
          <small style={{ color: "var(--text-muted)", display: "block", marginBottom: "8px", fontWeight: 700, textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.5px" }}>
            Select Test Persona (One-Click Fill):
          </small>
          <div className="quick-fill-grid">
            <button
              type="button"
              className="quick-fill-btn"
              onClick={() => quickFill("admin@salary.com", "password123")}
            >
              <strong>Admin</strong>
              <div style={{ fontSize: "9.5px", color: "var(--text-muted)", marginTop: "2px" }}>Full Access</div>
            </button>
            <button
              type="button"
              className="quick-fill-btn"
              onClick={() => quickFill("hr@salary.com", "password123")}
            >
              <strong>HR Spec.</strong>
              <div style={{ fontSize: "9.5px", color: "var(--text-muted)", marginTop: "2px" }}>Operations</div>
            </button>
            <button
              type="button"
              className="quick-fill-btn"
              onClick={() => quickFill("rahul@salary.com", "password123")}
            >
              <strong>Employee</strong>
              <div style={{ fontSize: "9.5px", color: "var(--text-muted)", marginTop: "2px" }}>Self Portal</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
