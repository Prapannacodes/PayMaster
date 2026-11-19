import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Alert from "../components/Alert";

export default function Organization() {
  const [activeTab, setActiveTab] = useState("departments");
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  // Department Form State
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");

  // Designation Form State
  const [desigTitle, setDesigTitle] = useState("");
  const [desigDeptId, setDesigDeptId] = useState("");
  const [desigDesc, setDesigDesc] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptRes, desigRes] = await Promise.all([
        api.getDepartments(),
        api.getDesignations()
      ]);
      setDepartments(deptRes.departments);
      setDesignations(desigRes.designations);
      if (deptRes.departments.length > 0 && !desigDeptId) {
        setDesigDeptId(deptRes.departments[0]._id);
      }
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.createDepartment({ departmentName: deptName, description: deptDesc });
      setAlert({ type: "success", message: "Department created successfully!" });
      setDeptName("");
      setDeptDesc("");
      loadData();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  };

  const handleCreateDesig = async (e) => {
    e.preventDefault();
    try {
      await api.createDesignation({ designationTitle: desigTitle, departmentId: desigDeptId, description: desigDesc });
      setAlert({ type: "success", message: "Designation created successfully!" });
      setDesigTitle("");
      setDesigDesc("");
      loadData();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  };

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          className={`btn ${activeTab === "departments" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("departments")}
        >
          🏢 Departments ({departments.length})
        </button>
        <button
          className={`btn ${activeTab === "designations" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("designations")}
        >
          🏷️ Designations ({designations.length})
        </button>
      </div>

      {/* Departments View */}
      {activeTab === "departments" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
          <div className="card">
            <h3 style={{ marginBottom: "16px" }}>Add Department</h3>
            <form onSubmit={handleCreateDept}>
              <div className="form-group">
                <label>Department Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Finance & Accounts"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Scope and purpose..."
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Save Department
              </button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: "16px" }}>All Departments</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d._id}>
                      <td><strong>{d.departmentName}</strong></td>
                      <td>{d.description || "—"}</td>
                      <td><span className="role-pill role-employee">{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Designations View */}
      {activeTab === "designations" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
          <div className="card">
            <h3 style={{ marginBottom: "16px" }}>Add Designation</h3>
            <form onSubmit={handleCreateDesig}>
              <div className="form-group">
                <label>Designation Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Lead Engineer"
                  value={desigTitle}
                  onChange={(e) => setDesigTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <select
                  className="form-control"
                  value={desigDeptId}
                  onChange={(e) => setDesigDeptId(e.target.value)}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.departmentName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Role duties..."
                  value={desigDesc}
                  onChange={(e) => setDesigDesc(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Save Designation
              </button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: "16px" }}>All Designations</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {designations.map((d) => (
                    <tr key={d._id}>
                      <td><strong>{d.designationTitle}</strong></td>
                      <td>{d.departmentId?.departmentName || "—"}</td>
                      <td><span className="role-pill role-employee">{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
