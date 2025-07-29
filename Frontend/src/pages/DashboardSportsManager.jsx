import React, { useState } from "react";

const SIDEBAR_OPTIONS = [
  { key: "home", label: "Home" },
  // Add more options here as you build features
];

const DashboardSportsManager = () => {
  const [selectedMenu, setSelectedMenu] = useState("home");

  // Responsive styles (reuse from Treasurer dashboard for consistency)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowWidth < 600;
  const responsiveContainerStyle = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    width: "100vw",
    height: isMobile ? "auto" : "100vh",
    minHeight: isMobile ? 0 : "100vh",
    maxWidth: isMobile ? "100vw" : 700,
    margin: isMobile ? 0 : "40px auto",
    border: "1px solid #eee",
    borderRadius: 8,
    background: "#fff",
    boxSizing: "border-box",
    overflow: "auto",
  };
  const responsiveSidebarStyle = {
    width: isMobile ? "100%" : 180,
    minWidth: isMobile ? "100%" : 120,
    background: "#f5f5f5",
    padding: isMobile ? 12 : 20,
    borderRight: isMobile ? "none" : "1px solid #eee",
    borderBottom: isMobile ? "1px solid #eee" : "none",
    borderRadius: isMobile ? "8px 8px 0 0" : 8,
    minHeight: isMobile ? 0 : 400,
    boxSizing: "border-box",
  };
  const responsiveMainStyle = {
    flex: 1,
    padding: isMobile ? 12 : 24,
    minHeight: isMobile ? 0 : 400,
    boxSizing: "border-box",
  };
  const menuItemStyle = (active) => ({
    padding: "12px 8px",
    marginBottom: 8,
    cursor: "pointer",
    background: active ? "#1976d2" : "transparent",
    color: active ? "#fff" : "#222",
    borderRadius: 4,
    fontWeight: active ? 600 : 400,
    transition: "background 0.2s, color 0.2s",
  });

  return (
    <div style={responsiveContainerStyle}>
      {/* Sidebar */}
      <div style={responsiveSidebarStyle}>
        <h3 style={{ marginTop: 0 }}>Sports Manager</h3>
        {SIDEBAR_OPTIONS.map(opt => (
          <div
            key={opt.key}
            style={menuItemStyle(selectedMenu === opt.key)}
            onClick={() => setSelectedMenu(opt.key)}
          >
            {opt.label}
          </div>
        ))}
      </div>
      {/* Main Content */}
      <div style={responsiveMainStyle}>
        {selectedMenu === "home" && (
          <>
            <h2>Welcome, Sports Manager!</h2>
            <p>This is your dashboard. Select a feature from the sidebar to get started.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardSportsManager; 