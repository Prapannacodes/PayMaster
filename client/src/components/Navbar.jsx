import React, { useState, useEffect } from "react";
import { IconBell, IconCalendar, IconClock } from "./Icons";

export default function Navbar({ title, user, onLogout }) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const formattedTime = currentDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const getInitials = (name) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">Enterprise Compensation & Human Resource Portal</p>
      </div>

      <div className="navbar-right">
        {/* Date & Time capsule matching HRFlow */}
        <div className="time-capsule">
          <IconCalendar size={13} color="#00e5ff" />
          <span>{formattedDate}</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <IconClock size={13} color="#10b981" />
          <span>{formattedTime}</span>
        </div>

        {/* Notification Bell matching HRFlow */}
        <button
          className="notification-btn"
          title="System notifications"
          aria-label="Notifications"
        >
          <IconBell size={17} />
          <span className="notification-pulse" />
        </button>

        {/* User Capsule matching HRFlow */}
        <div className="user-profile-capsule">
          <div className="user-avatar-circle">
            {getInitials(user?.username || user?.email)}
          </div>
          <div className="user-meta">
            <span className="user-name">{user?.username || "Authorized User"}</span>
            <span className="user-role-tag">{user?.role || "Employee"}</span>
          </div>
          <button
            onClick={onLogout}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: "18px", padding: "4px 10px", fontSize: "11px" }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
