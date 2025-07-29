import React, { useState } from "react";

const SIDEBAR_OPTIONS = [
  { key: "home", label: "Home" },
  { key: "add", label: "Add Team Member" },
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

  const [addName, setAddName] = useState("");
  const [addPosition, setAddPosition] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState("");
  const [addError, setAddError] = useState("");
  const positionChoices = [
    "Forward",
    "Defender",
    "Midfielder",
    "Coach",
    "Ass_Coach",
    "Manager",
    "Team_doctor",
    "GK",
  ];

  // Add Team Member handler
  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddSuccess("");
    setAddError("");
    if (!addName || !addPosition) {
      setAddError("Please enter a name and select a position.");
      return;
    }
    setAddLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      await fetch("https://savings-with-records.onrender.com/api/register-players/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: addName, position: addPosition }),
      });
      setAddSuccess(`Team member '${addName}' added as ${addPosition}.`);
      setAddName("");
      setAddPosition("");
    } catch (err) {
      setAddError("Failed to add team member. Please try again.");
    } finally {
      setAddLoading(false);
    }
  };

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
        {selectedMenu === "add" && (
          <>
            <h2>Add Team Member</h2>
            <form onSubmit={handleAddMember}>
              <label>Name</label>
              <input
                type="text"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                required
                style={{ width: "100%", padding: 8, marginBottom: 16 }}
                placeholder="Enter member name"
              />
              <label>Position</label>
              <select
                value={addPosition}
                onChange={e => setAddPosition(e.target.value)}
                required
                style={{ width: "100%", padding: 8, marginBottom: 16 }}
              >
                <option value="">-- Select Position --</option>
                {positionChoices.map(pos => (
                  <option key={pos} value={pos}>{pos.replace(/_/g, " ")}</option>
                ))}
              </select>
              {addError && <div style={{ color: "red", marginBottom: 8 }}>{addError}</div>}
              {addSuccess && <div style={{ color: "green", marginBottom: 8 }}>{addSuccess}</div>}
              <button type="submit" disabled={addLoading} style={{ width: "100%", padding: 10 }}>
                {addLoading ? "Adding..." : "Add Member"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardSportsManager; 