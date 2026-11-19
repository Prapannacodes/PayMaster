import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    employeeCode: "",
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    designationId: "",
    joiningDate: "",
    bankDetails: {
      accountNumber: "",
      bankName: "",
      ifscCode: "",
      panNumber: ""
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (query = "") => {
    try {
      setLoading(true);
      const [empRes, deptRes, desigRes] = await Promise.all([
        api.getEmployees(query),
        api.getDepartments(),
        api.getDesignations()
      ]);
      setEmployees(empRes.employees);
      setDepartments(deptRes.departments);
      setDesignations(desigRes.designations);
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData(search);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      employeeCode: `EMP00${employees.length + 1}`,
      name: "",
      email: "",
      phone: "",
      departmentId: departments[0]?._id || "",
      designationId: designations[0]?._id || "",
      joiningDate: new Date().toISOString().split("T")[0],
      bankDetails: { accountNumber: "", bankName: "", ifscCode: "", panNumber: "" }
    });
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    setEditingId(emp._id);
    setFormData({
      employeeCode: emp.employeeCode,
      name: emp.name,
      email: emp.email,
      phone: emp.phone || "",
      departmentId: emp.departmentId?._id || emp.departmentId || "",
      designationId: emp.designationId?._id || emp.designationId || "",
      joiningDate: emp.joiningDate ? emp.joiningDate.split("T")[0] : "",
      bankDetails: emp.bankDetails || { accountNumber: "", bankName: "", ifscCode: "", panNumber: "" }
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateEmployee(editingId, formData);
        setAlert({ type: "success", message: "Employee details updated successfully!" });
      } else {
        await api.createEmployee(formData);
        setAlert({ type: "success", message: "New employee added successfully!" });
      }
      setShowModal(false);
      loadData(search);
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this employee?")) return;
    try {
      await api.deleteEmployee(id);
      setAlert({ type: "success", message: "Employee marked as inactive" });
      loadData(search);
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  };

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div className="card-header">
          <h3>Employee Directory</h3>
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add New Employee
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by Employee Code, Name or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "380px" }}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setSearch(""); loadData(""); }}
            >
              Reset
            </button>
          )}
        </form>

        {/* Employees Table */}
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Email / Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "24px" }}>
                    {loading ? "Loading employees..." : "No employees found matching criteria."}
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id}>
                    <td><strong>{emp.employeeCode}</strong></td>
                    <td>{emp.name}</td>
                    <td>{emp.departmentId?.departmentName || "—"}</td>
                    <td>{emp.designationId?.designationTitle || "—"}</td>
                    <td>
                      <div>{emp.email}</div>
                      <small style={{ color: "var(--text-secondary)" }}>{emp.phone || "—"}</small>
                    </td>
                    <td>
                      <span className={`role-pill ${emp.status === "active" ? "role-employee" : "role-admin"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(emp)}
                        style={{ marginRight: "6px" }}
                      >
                        Edit
                      </button>
                      {emp.status === "active" && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeactivate(emp._id)}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="card-header">
              <h3>{editingId ? "Edit Employee" : "Add New Employee"}</h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Employee Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    required
                    disabled={!!editingId}
                  />
                </div>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    className="form-control"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.departmentName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Designation *</label>
                  <select
                    className="form-control"
                    value={formData.designationId}
                    onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                    required
                  >
                    <option value="">Select Designation</option>
                    {designations.map((d) => (
                      <option key={d._id} value={d._id}>{d.designationTitle}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Joining Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  required
                />
              </div>

              <h4 style={{ fontSize: "0.95rem", margin: "16px 0 10px", color: "#484848" }}>Bank & Statutory Details</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.bankDetails.bankName}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.bankDetails.accountNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.bankDetails.ifscCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, ifscCode: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>PAN Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.bankDetails.panNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, panNumber: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? "Save Changes" : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
