// Simple API service for backend communication
const BASE_URL = "http://localhost:5000/api";

// Helper function to send requests with Auth token
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  getProfile: () => request("/auth/profile"),
  getUsers: () => request("/auth/users"),
  updateUserRole: (id, role) => request(`/auth/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),

  // Dashboard & Reports
  getDashboard: () => request("/reports/dashboard"),
  getMonthlyReport: (year) => request(`/reports/monthly-payroll?year=${year}`),
  getDepartmentReport: () => request("/reports/department-salary"),
  getAuditLogs: () => request("/reports/audit-logs"),

  // Employees
  getEmployees: (search = "") => request(`/employees?search=${encodeURIComponent(search)}`),
  getEmployee: (id) => request(`/employees/${id}`),
  createEmployee: (data) => request("/employees", { method: "POST", body: JSON.stringify(data) }),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: "DELETE" }),

  // Departments & Designations
  getDepartments: () => request("/departments"),
  createDepartment: (data) => request("/departments", { method: "POST", body: JSON.stringify(data) }),
  getDesignations: () => request("/designations"),
  createDesignation: (data) => request("/designations", { method: "POST", body: JSON.stringify(data) }),

  // Salary Structures
  getSalaryStructures: () => request("/salary-structures"),
  createSalaryStructure: (data) => request("/salary-structures", { method: "POST", body: JSON.stringify(data) }),

  // Attendance
  getAttendance: (month) => request(`/attendance?month=${month}`),
  markAttendance: (data) => request("/attendance", { method: "POST", body: JSON.stringify(data) }),

  // Leaves
  getLeaves: () => request("/leaves"),
  applyLeave: (data) => request("/leaves", { method: "POST", body: JSON.stringify(data) }),
  updateLeaveStatus: (id, data) => request(`/leaves/${id}/status`, { method: "PUT", body: JSON.stringify(data) }),

  // Tax & Deductions
  getTaxRules: () => request("/tax-rules"),
  getActiveTaxRule: () => request("/tax-rules/active"),
  getDeductionRules: () => request("/deduction-rules"),

  // Payroll
  getPayrollPeriods: () => request("/payroll/periods"),
  getPayrollPeriod: (id) => request(`/payroll/periods/${id}`),
  generatePayroll: (month, year) => request("/payroll/generate", { method: "POST", body: JSON.stringify({ month, year }) }),
  finalizePayroll: (id) => request(`/payroll/finalize/${id}`, { method: "POST" }),
  revertPayroll: (id) => request(`/payroll/revert/${id}`, { method: "POST" }),
  deletePayrollPeriod: (id) => request(`/payroll/periods/${id}`, { method: "DELETE" }),
  getSalarySlip: (recordId) => request(`/payroll/slips/${recordId}`),
  getMySalarySlips: () => request("/payroll/my-slips"),

  // Intelligent Features:
  // 1. Smart Salary Anomaly Detection
  scanAnomalies: (periodId = "latest") => request(`/anomalies/scan/${periodId}`, { method: "POST" }),
  getAnomalies: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.severity && params.severity !== "all") query.append("severity", params.severity);
    if (params.periodId && params.periodId !== "all") query.append("periodId", params.periodId);
    return request(`/anomalies?${query.toString()}`);
  },
  resolveAnomaly: (id, data) => request(`/anomalies/${id}/resolve`, { method: "PUT", body: JSON.stringify(data) }),

  // 2. Salary What-If Simulator
  getSimulatorBaseline: () => request("/simulator/baseline"),
  runSimulation: (data) => request("/simulator/run", { method: "POST", body: JSON.stringify(data) }),
  applySimulation: (data) => request("/simulator/apply", { method: "POST", body: JSON.stringify(data) }),

  // 3. Predictive Payroll Analytics
  getAnalyticsOverview: () => request("/analytics/overview"),

  // 4. Employee Salary Transparency Portal & Discrepancies
  getEmployeeSalaryOverview: () => request("/employee-portal/overview"),
  getEmployeeSalaryHistory: () => request("/employee-portal/history"),
  createDiscrepancy: (data) => request("/discrepancies", { method: "POST", body: JSON.stringify(data) }),
  getMyDiscrepancies: () => request("/discrepancies/my"),
  getAllDiscrepancies: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.category && params.category !== "all") query.append("category", params.category);
    return request(`/discrepancies?${query.toString()}`);
  },
  updateDiscrepancyStatus: (id, data) => request(`/discrepancies/${id}/status`, { method: "PUT", body: JSON.stringify(data) })
};
