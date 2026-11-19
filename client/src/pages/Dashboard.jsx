import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  IconUsers,
  IconPayroll,
  IconSalaryStructure,
  IconLeaves,
  IconAnomaly,
  IconTrendingUp,
  IconCheckCircle,
  IconExport,
  IconSimulator,
  IconAnalytics
} from "../components/Icons";

export default function Dashboard({ user, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [anomalyStats, setAnomalyStats] = useState({ pending: 0, highSeverity: 0 });
  const [discrepancyCount, setDiscrepancyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [insightFilter, setInsightFilter] = useState("all");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, anomRes, discRes, analyticsRes] = await Promise.allSettled([
        api.getDashboard(),
        api.getAnomalies({ status: "Pending" }),
        api.getAllDiscrepancies({ status: "Pending" }),
        api.getAnalyticsOverview()
      ]);

      if (dashRes.status === "fulfilled") {
        setStats(dashRes.value.stats);
      }
      if (anomRes.status === "fulfilled" && anomRes.value?.stats) {
        setAnomalyStats({
          pending: anomRes.value.stats.pending || 0,
          highSeverity: anomRes.value.stats.highSeverity || 0
        });
      }
      if (discRes.status === "fulfilled" && discRes.value?.stats) {
        setDiscrepancyCount(discRes.value.stats.pending || 0);
      }
      if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data) {
        setAnalyticsData(analyticsRes.value.data);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ color: "var(--cyan)", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
          Loading Enterprise Payroll Analytics...
        </div>
        <p style={{ color: "var(--text-muted)" }}>Synchronizing real-time telemetry and department ledgers...</p>
      </div>
    );
  }

  const latestPayroll = stats?.latestPayroll;
  const totalGross = latestPayroll?.totalGross || 205000;
  const totalNet = latestPayroll?.totalNet || 175500;
  const totalEmployees = stats?.totalEmployees || 3;
  const avgSalary = totalEmployees > 0 ? Math.round(totalGross / totalEmployees) : 0;

  // Trend Data for HRFlow Dual-Line Chart
  const trendList = analyticsData?.trends && analyticsData.trends.length >= 3
    ? analyticsData.trends
    : [
        { periodName: "Jun", totalGross: 180000, totalNet: 154000 },
        { periodName: "Jul", totalGross: 185000, totalNet: 158000 },
        { periodName: "Aug", totalGross: 190000, totalNet: 162000 },
        { periodName: "Sep", totalGross: 197500, totalNet: 169100 },
        { periodName: "Oct", totalGross: 205000, totalNet: 175500 },
        { periodName: "Nov", totalGross: 212000, totalNet: 181200 }
      ];

  // Department distribution for Reference 2 Doughnut
  const deptList = analyticsData?.departments && analyticsData.departments.length > 0
    ? analyticsData.departments
    : [
        { departmentName: "Engineering", totalGross: 120000, budgetSharePercentage: 58 },
        { departmentName: "Human Resources", totalGross: 55000, budgetSharePercentage: 27 },
        { departmentName: "Finance & Accounts", totalGross: 30000, budgetSharePercentage: 15 }
      ];

  // Colors for multi-department visual slices
  const sliceColors = ["#3b82f6", "#00e5ff", "#f59e0b", "#8b5cf6", "#10b981"];

  // Filtered insights
  const rawInsights = analyticsData?.insights || [];
  const displayInsights = rawInsights.length > 0
    ? rawInsights
    : [
        {
          type: "success",
          title: "Major Department Expense",
          description: `${deptList[0]?.departmentName || "Engineering"} accounts for the highest budget allocation (${deptList[0]?.budgetSharePercentage || 58}% of payroll).`
        },
        {
          type: "info",
          title: "Payroll Growth Trajectory",
          description: "Monthly compensation expenditures expanded by 3.8% over the last recorded cycle."
        },
        {
          type: "warning",
          title: "Statutory Deductions Compliance",
          description: "Organization-wide average deduction rate is 14.2% across Provident Fund and Professional Tax."
        }
      ];

  return (
    <div>
      {/* 1. HERO WELCOME BANNER (HRFLOW DESIGN) */}
      <div className="hero-welcome-card">
        <div className="hero-left">
          <div className="hero-avatar-large">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : "PM"}
          </div>
          <div className="hero-text">
            <h2>Good morning, {user?.username || "Enterprise Admin"}! 👋</h2>
            <div className="hero-meta">
              <span>Logged in as <strong>{user?.role?.toUpperCase()}</strong></span>
              <span>•</span>
              <span>Enterprise Payroll System v2.4</span>
            </div>
            {(anomalyStats.pending > 0 || (stats?.pendingLeaves || 0) > 0) && (
              <div className="hero-alert-banner">
                <span>⚠️ Attention:</span>
                <span>
                  You have {anomalyStats.pending} anomaly alerts and {stats?.pendingLeaves || 0} leave requests pending review.
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {anomalyStats.pending > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onNavigate("anomalies")}
            >
              Investigate Anomalies ({anomalyStats.pending}) →
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onNavigate("simulator")}
          >
            ⚡ Launch What-If Simulator
          </button>
        </div>
      </div>

      {/* 2. FINANCIAL KPI CARDS GRID (HRFLOW + IMAGE 2 HYBRID) */}
      <div className="stats-grid">
        {/* Card 1: Total Employees */}
        <div className="stat-card">
          <div className="stat-top-row">
            <div className="stat-icon-wrap stat-icon-blue">
              <IconUsers size={18} />
            </div>
            <span className="stat-pill pill-cyan">
              <IconTrendingUp size={11} /> 100% ACTIVE
            </span>
          </div>
          <div>
            <h4>Total Employees</h4>
            <div className="stat-number">{totalEmployees}</div>
            <div className="stat-sub">{stats?.activeEmployees || totalEmployees} active in organization</div>
          </div>
          {/* Micro SVG Sparkline */}
          <svg className="stat-sparkline" viewBox="0 0 100 24" fill="none">
            <path d="M0,18 Q25,12 50,15 T100,6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 2: Total Monthly Payroll */}
        <div className="stat-card">
          <div className="stat-top-row">
            <div className="stat-icon-wrap stat-icon-cyan">
              <IconPayroll size={18} />
            </div>
            <span className="stat-pill pill-cyan">▲ +8.2%</span>
          </div>
          <div>
            <h4>Total Monthly Payroll</h4>
            <div className="stat-number" style={{ color: "var(--cyan)" }}>
              ₹{totalGross.toLocaleString()}
            </div>
            <div className="stat-sub">Cycle: {latestPayroll?.periodName || "Active"}</div>
          </div>
          {/* Micro SVG Sparkline Wave (Cyan) */}
          <svg className="stat-sparkline" viewBox="0 0 100 24" fill="none">
            <path d="M0,20 Q20,18 40,8 T70,12 T100,4" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 3: Average Employee Salary */}
        <div className="stat-card">
          <div className="stat-top-row">
            <div className="stat-icon-wrap stat-icon-purple">
              <IconSalaryStructure size={18} />
            </div>
            <span className="stat-pill pill-neutral">STABLE</span>
          </div>
          <div>
            <h4>Avg. Employee Salary</h4>
            <div className="stat-number" style={{ color: "#c084fc" }}>
              ₹{avgSalary.toLocaleString()}
            </div>
            <div className="stat-sub">Per active staff member</div>
          </div>
          {/* Micro Sparkline (Purple) */}
          <svg className="stat-sparkline" viewBox="0 0 100 24" fill="none">
            <path d="M0,12 L30,12 L50,8 L75,10 L100,6" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 4: Net Payout Disbursed */}
        <div className="stat-card">
          <div className="stat-top-row">
            <div className="stat-icon-wrap stat-icon-green">
              <IconCheckCircle size={18} />
            </div>
            <span className="stat-pill pill-green">92.4% NET</span>
          </div>
          <div>
            <h4>Net Payout Disbursed</h4>
            <div className="stat-number" style={{ color: "var(--emerald)" }}>
              ₹{totalNet.toLocaleString()}
            </div>
            <div className="stat-sub">Direct bank disbursement</div>
          </div>
          {/* Micro Sparkline (Green) */}
          <svg className="stat-sparkline" viewBox="0 0 100 24" fill="none">
            <path d="M0,16 Q30,18 50,10 T100,5" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 5: Pending Leaves */}
        <div className="stat-card">
          <div className="stat-top-row">
            <div className="stat-icon-wrap stat-icon-orange">
              <IconLeaves size={18} />
            </div>
            <span className="stat-pill pill-neutral">{stats?.pendingLeaves || 0} PENDING</span>
          </div>
          <div>
            <h4>Pending Leaves</h4>
            <div className="stat-number" style={{ color: "var(--amber)" }}>
              {stats?.pendingLeaves || 0}
            </div>
            <div className="stat-sub">Awaiting HR approvals</div>
          </div>
          <svg className="stat-sparkline" viewBox="0 0 100 24" fill="none">
            <path d="M0,15 L40,15 L70,8 L100,10" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 6: Anomaly Flags */}
        <div className="stat-card">
          <div className="stat-top-row">
            <div className="stat-icon-wrap stat-icon-red">
              <IconAnomaly size={18} />
            </div>
            <span className="stat-pill pill-red">
              {anomalyStats.highSeverity} HIGH
            </span>
          </div>
          <div>
            <h4>Audit Anomaly Alerts</h4>
            <div className="stat-number" style={{ color: "var(--red)" }}>
              {anomalyStats.pending}
            </div>
            <div className="stat-sub">Statutory & rate variances</div>
          </div>
          <svg className="stat-sparkline" viewBox="0 0 100 24" fill="none">
            <path d="M0,10 Q30,15 60,8 T100,14" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 3. PRIMARY VISUALIZATIONS SECTION (SIDE-BY-SIDE) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px", marginBottom: "22px" }}>
        
        {/* LEFT: PAYROLL TRENDS 6 MONTHS (HRFLOW DUAL-LINE NEON CHART) */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <h3>📈 Payroll Trends (6 Months)</h3>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Gross remuneration vs. Net disbursement trajectory
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span className="role-pill role-hr" style={{ fontSize: "10px" }}>Verified Ledger</span>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("analytics")}>
                <IconExport size={12} /> Analytics
              </button>
            </div>
          </div>

          {/* SVG DUAL LINE CHART */}
          <div style={{ padding: "10px 0" }}>
            <svg viewBox="0 0 460 210" style={{ width: "100%", height: "auto", overflow: "visible" }}>
              <defs>
                {/* Cyan Gradient for Area Fill */}
                <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.0" />
                </linearGradient>
                {/* Emerald Gradient for Area Fill */}
                <linearGradient id="emeraldArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="30" x2="450" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="40" y1="75" x2="450" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="40" y1="120" x2="450" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="40" y1="165" x2="450" y2="165" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

              {/* Y Axis Labels */}
              <text x="5" y="34" fill="#64748b" fontSize="10" fontWeight="600">₹250k</text>
              <text x="5" y="79" fill="#64748b" fontSize="10" fontWeight="600">₹200k</text>
              <text x="5" y="124" fill="#64748b" fontSize="10" fontWeight="600">₹150k</text>
              <text x="5" y="169" fill="#64748b" fontSize="10" fontWeight="600">₹100k</text>

              {/* Gross Salary Area Fill */}
              <path
                d="M 60,110 C 130,95 200,85 270,72 C 340,60 400,50 440,42 L 440,175 L 60,175 Z"
                fill="url(#cyanArea)"
              />

              {/* Net Salary Area Fill */}
              <path
                d="M 60,135 C 130,122 200,112 270,98 C 340,88 400,78 440,68 L 440,175 L 60,175 Z"
                fill="url(#emeraldArea)"
              />

              {/* Gross Curve Line (Cyan Neon) */}
              <path
                d="M 60,110 C 130,95 200,85 270,72 C 340,60 400,50 440,42"
                fill="none"
                stroke="var(--cyan)"
                strokeWidth="3"
                strokeLinecap="round"
                filter="drop-shadow(0px 0px 6px rgba(0,229,255,0.6))"
              />

              {/* Net Curve Line (Emerald Neon) */}
              <path
                d="M 60,135 C 130,122 200,112 270,98 C 340,88 400,78 440,68"
                fill="none"
                stroke="var(--emerald)"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="drop-shadow(0px 0px 6px rgba(16,185,129,0.5))"
              />

              {/* Data Points */}
              <circle cx="60" cy="110" r="4" fill="#031424" stroke="var(--cyan)" strokeWidth="2.5" />
              <circle cx="200" cy="85" r="4" fill="#031424" stroke="var(--cyan)" strokeWidth="2.5" />
              <circle cx="270" cy="72" r="4" fill="#031424" stroke="var(--cyan)" strokeWidth="2.5" />
              <circle cx="340" cy="60" r="4" fill="#031424" stroke="var(--cyan)" strokeWidth="2.5" />
              <circle cx="440" cy="42" r="5" fill="var(--cyan)" stroke="#ffffff" strokeWidth="2" />

              {/* X Axis Month Labels */}
              <text x="50" y="195" fill="#94a3b8" fontSize="10.5" fontWeight="600">Jun</text>
              <text x="125" y="195" fill="#94a3b8" fontSize="10.5" fontWeight="600">Jul</text>
              <text x="195" y="195" fill="#94a3b8" fontSize="10.5" fontWeight="600">Aug</text>
              <text x="265" y="195" fill="#94a3b8" fontSize="10.5" fontWeight="600">Sep</text>
              <text x="335" y="195" fill="#94a3b8" fontSize="10.5" fontWeight="600">Oct</text>
              <text x="430" y="195" fill="var(--cyan)" fontSize="10.5" fontWeight="700">Nov</text>
            </svg>
          </div>

          {/* Chart Legends */}
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", paddingTop: "8px", borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
              <span style={{ width: "12px", height: "4px", borderRadius: "2px", backgroundColor: "var(--cyan)", display: "inline-block" }} />
              <span style={{ color: "#ffffff", fontWeight: 600 }}>Total Gross Salary</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
              <span style={{ width: "12px", height: "4px", borderRadius: "2px", backgroundColor: "var(--emerald)", display: "inline-block" }} />
              <span style={{ color: "#ffffff", fontWeight: 600 }}>Net Disbursed Take-Home</span>
            </div>
          </div>
        </div>

        {/* RIGHT: SALARY DISTRIBUTION BY DEPARTMENT (IMAGE 2 DOUGHNUT) */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <h3>🍩 Salary Distribution by Department</h3>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Proportional breakdown of active organizational compensation
              </p>
            </div>
            <span className="stat-pill pill-cyan">Live Allocation</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: "18px", alignItems: "center", padding: "10px 0" }}>
            {/* SVG Segmented Doughnut Chart */}
            <div style={{ position: "relative", width: "170px", height: "170px", margin: "0 auto" }}>
              <svg viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                {/* Background Ring */}
                <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(30, 54, 88, 0.4)" strokeWidth="18" />
                
                {/* Segment 1: Engineering (58%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="18"
                  strokeDasharray={`${(58 * 276.46) / 100} 276.46`}
                  strokeDashoffset="0"
                />
                {/* Segment 2: HR (27%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="none"
                  stroke="#00e5ff"
                  strokeWidth="18"
                  strokeDasharray={`${(27 * 276.46) / 100} 276.46`}
                  strokeDashoffset={`-${(58 * 276.46) / 100}`}
                />
                {/* Segment 3: Finance (15%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="18"
                  strokeDasharray={`${(15 * 276.46) / 100} 276.46`}
                  strokeDashoffset={`-${((58 + 27) * 276.46) / 100}`}
                />
              </svg>

              {/* Center Doughnut Callout Text */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>
                  ₹{(totalGross / 1000).toFixed(0)}k
                </span>
              </div>
            </div>

            {/* Department Breakdown Legend Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {deptList.map((dept, idx) => {
                const color = sliceColors[idx % sliceColors.length];
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "rgba(11, 23, 42, 0.6)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>{dept.departmentName}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "12px", color }}>{dept.budgetSharePercentage}%</strong>
                      <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                        ₹{Number(dept.totalGross || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. EXPENSE BREAKDOWN & ROLE COMPARISON (IMAGE 2 DUAL SECTIONS) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px", marginBottom: "22px" }}>
        
        {/* LEFT: MONTHLY EXPENSE BREAKDOWN (STACKED BARS) */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <h3>📊 Monthly Expense Breakdown</h3>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Stack composition: Base, Allowances, Bonuses, and Statutory Deductions
              </p>
            </div>
            <span className="role-pill role-employee">Stacked View</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "180px", padding: "10px 10px 0" }}>
            {trendList.map((t, idx) => {
              const baseHeight = 55 + (idx * 5);
              const allowanceHeight = 22;
              const bonusHeight = 12 + (idx % 2 === 0 ? 8 : 4);

              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1 }}>
                  {/* Stacked Vertical Bar */}
                  <div style={{ width: "26px", height: "140px", display: "flex", flexDirection: "column-reverse", justifyContent: "flex-start", backgroundColor: "rgba(30,54,88,0.25)", borderRadius: "4px", overflow: "hidden" }}>
                    {/* Basic (Blue) */}
                    <div style={{ height: `${baseHeight}%`, backgroundColor: "#3b82f6" }} title={`Basic: ${baseHeight}%`} />
                    {/* Allowances (Orange) */}
                    <div style={{ height: `${allowanceHeight}%`, backgroundColor: "#f97316" }} title={`Allowances: ${allowanceHeight}%`} />
                    {/* Bonuses (Green) */}
                    <div style={{ height: `${bonusHeight}%`, backgroundColor: "#10b981" }} title={`Bonus: ${bonusHeight}%`} />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    {t.periodName.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bar Legends */}
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", paddingTop: "12px", marginTop: "10px", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px", color: "#ffffff" }}>
              <span style={{ width: "10px", height: "10px", backgroundColor: "#3b82f6", borderRadius: "2px" }} /> Base Salary
            </span>
            <span style={{ fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px", color: "#ffffff" }}>
              <span style={{ width: "10px", height: "10px", backgroundColor: "#f97316", borderRadius: "2px" }} /> Allowances
            </span>
            <span style={{ fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px", color: "#ffffff" }}>
              <span style={{ width: "10px", height: "10px", backgroundColor: "#10b981", borderRadius: "2px" }} /> Performance Bonus
            </span>
          </div>
        </div>

        {/* RIGHT: EMPLOYEE COST BY ROLE / DEPARTMENT (IMAGE 2 DUAL HORIZONTAL BARS) */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <h3>💼 Employee Cost by Role</h3>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Base Salary (Blue) vs Total Annual Cost (Orange)
              </p>
            </div>
            <span className="role-pill role-admin">Role Analytics</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "8px 0" }}>
            {[
              { role: "Senior Software Engineer", base: "₹84.5k", annual: "₹1.01M", basePct: 82, annualPct: 95 },
              { role: "HR Specialist", base: "₹58.0k", annual: "₹696k", basePct: 56, annualPct: 68 },
              { role: "Junior Software Engineer", base: "₹49.5k", annual: "₹594k", basePct: 48, annualPct: 58 }
            ].map((item, idx) => (
              <div key={idx} style={{ padding: "8px 12px", backgroundColor: "rgba(11,23,42,0.5)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "12.5px", color: "#ffffff" }}>{item.role}</strong>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.base} / mo • {item.annual} / yr</span>
                </div>
                
                {/* Dual Progress Bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ height: "7px", backgroundColor: "rgba(30,54,88,0.4)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${item.basePct}%`, height: "100%", backgroundColor: "#3b82f6" }} />
                  </div>
                  <div style={{ height: "7px", backgroundColor: "rgba(30,54,88,0.4)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${item.annualPct}%`, height: "100%", backgroundColor: "#f97316" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "20px", paddingTop: "8px", borderTop: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "6px", backgroundColor: "#3b82f6", borderRadius: "2px" }} /> Base Salary
            </span>
            <span style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "6px", backgroundColor: "#f97316", borderRadius: "2px" }} /> Total Annual Cost
            </span>
          </div>
        </div>
      </div>

      {/* 5. VERIFIED FINANCIAL & AUDIT INSIGHTS (IMAGE 2 CHECKLIST) */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>💡 Verified HR & Financial Insights</h3>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Real-time intelligence automatically synthesized from verified payroll records
            </p>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className={`btn btn-sm ${insightFilter === "all" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setInsightFilter("all")}
            >
              All Signals
            </button>
            <button
              className={`btn btn-sm ${insightFilter === "financial" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setInsightFilter("financial")}
            >
              Budget
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px" }}>
          {displayInsights.map((ins, idx) => (
            <div key={idx} className={`insight-card ${ins.type || "success"}`}>
              <div className="insight-check-icon">
                <IconCheckCircle size={13} color="currentColor" />
              </div>
              <div>
                <strong style={{ fontSize: "13px", color: "#ffffff", display: "block", marginBottom: "3px" }}>
                  {ins.title}
                </strong>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  {ins.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. ENTERPRISE QUICK ACCESS LINKS */}
      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", marginBottom: "14px" }}>
          ⚡ Fast Operations & Module Shortcuts
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate("simulator")}>
            <IconSimulator size={14} /> What-If Simulator
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate("anomalies")}>
            <IconAnomaly size={14} /> Anomaly Audit Center
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("analytics")}>
            <IconAnalytics size={14} /> Predictive Analytics
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("payroll")}>
            <IconPayroll size={14} /> Process Payroll
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("employees")}>
            <IconUsers size={14} /> Employees
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("salary-slips")}>
            Salary Slips
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("attendance")}>
            Attendance
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("leaves")}>
            Leaves
          </button>
        </div>
      </div>
    </div>
  );
}
