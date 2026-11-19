import React from "react";

export default function Alert({ type = "success", message, onClose }) {
  if (!message) return null;

  return (
    <div className={`alert alert-${type === "error" ? "error" : "success"}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}
        >
          ×
        </button>
      )}
    </div>
  );
}
