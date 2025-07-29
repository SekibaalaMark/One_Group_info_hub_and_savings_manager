import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const SIDEBAR_OPTIONS = [
  { key: "save", label: "Save Money" },
  { key: "loan", label: "Give Loan" },
  { key: "payloan", label: "Pay Loan" },
  { key: "myrecords", label: "My Records" },
  { key: "summary", label: "Summary Totals" },
  { key: "detailed", label: "Detailed Records" },
  // Add more options here as needed
];

const DashboardTreasurer = () => {
  const [usernames, setUsernames] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [loanAmount, setLoanAmount] = useState("");
  const [loanUser, setLoanUser] = useState("");
  const [loanLoading, setLoanLoading] = useState(false);
  const [loanSuccessMsg, setLoanSuccessMsg] = useState("");
  const [loanErrorMsg, setLoanErrorMsg] = useState("");

  const [payLoanAmount, setPayLoanAmount] = useState("");
  const [payLoanUser, setPayLoanUser] = useState("");
  const [payLoanLoading, setPayLoanLoading] = useState(false);
  const [payLoanSuccessMsg, setPayLoanSuccessMsg] = useState("");
  const [payLoanErrorMsg, setPayLoanErrorMsg] = useState("");

  const [selectedMenu, setSelectedMenu] = useState("save");
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [detailedRecords, setDetailedRecords] = useState([]);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [detailedError, setDetailedError] = useState("");

  const [filterUsername, setFilterUsername] = useState("");
  const [myRecords, setMyRecords] = useState(null);
  const [myRecordsLoading, setMyRecordsLoading] = useState(false);
  const [myRecordsError, setMyRecordsError] = useState("");

  // Fetch all usernames on mount
  useEffect(() => {
    const fetchUsernames = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await axios.get(
          "https://savings-with-records.onrender.com/api/usernames/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setUsernames(res.data);
      } catch (err) {
        setErrorMsg("Failed to load users.");
      }
    };
    fetchUsernames();
  }, []);

  // Fetch summary totals when 'summary' menu is selected
  useEffect(() => {
    if (selectedMenu === "summary") {
      const fetchSummary = async () => {
        setSummaryLoading(true);
        setSummaryError("");
        try {
          const accessToken = localStorage.getItem("accessToken");
          const res = await axios.get(
            "https://savings-with-records.onrender.com/api/totals/",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          setSummary(res.data);
        } catch (err) {
          setSummaryError("Failed to load summary totals.");
        } finally {
          setSummaryLoading(false);
        }
      };
      fetchSummary();
    }
  }, [selectedMenu]);

  // Fetch detailed records when 'detailed' menu is selected
  useEffect(() => {
    if (selectedMenu === "detailed") {
      const fetchDetailed = async () => {
        setDetailedLoading(true);
        setDetailedError("");
        try {
          const accessToken = localStorage.getItem("accessToken");
          const res = await axios.get(
            "https://savings-with-records.onrender.com/api/detailed-totals/",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          setDetailedRecords(res.data.user_summaries || []);
        } catch (err) {
          setDetailedError("Failed to load detailed records.");
        } finally {
          setDetailedLoading(false);
        }
      };
      fetchDetailed();
    }
  }, [selectedMenu]);

  // Fetch my records when 'myrecords' menu is selected
  useEffect(() => {
    if (selectedMenu === "myrecords") {
      const fetchMyRecords = async () => {
        setMyRecordsLoading(true);
        setMyRecordsError("");
        try {
          const accessToken = localStorage.getItem("accessToken");
          const res = await axios.get(
            "https://savings-with-records.onrender.com/api/financial-summary/",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          setMyRecords(res.data);
        } catch (err) {
          setMyRecordsError("Failed to load your financial summary.");
        } finally {
          setMyRecordsLoading(false);
        }
      };
      fetchMyRecords();
    }
  }, [selectedMenu]);

  // Save Money handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    if (!selectedUsername || !amount) {
      setErrorMsg("Please select a user and enter an amount.");
      return;
    }
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.post(
        "https://savings-with-records.onrender.com/api/save/",
        {
          username: selectedUsername,
          amount_saved: amount,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setSuccessMsg(`Successfully saved UGX ${amount} for ${selectedUsername}.`);
      setAmount("");
      setSelectedUsername("");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Failed to save money. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Loan handler
  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    setLoanSuccessMsg("");
    setLoanErrorMsg("");
    if (!loanUser || !loanAmount) {
      setLoanErrorMsg("Please select a user and enter an amount.");
      return;
    }
    setLoanLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.post(
        "https://savings-with-records.onrender.com/api/loan/",
        {
          username: loanUser,
          amount_loaned: loanAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setLoanSuccessMsg(`Successfully loaned UGX ${loanAmount} to ${loanUser}.`);
      setLoanAmount("");
      setLoanUser("");
    } catch (err) {
      setLoanErrorMsg(
        err.response?.data?.message || "Failed to give loan. Please try again."
      );
    } finally {
      setLoanLoading(false);
    }
  };

  // Pay Loan handler
  const handlePayLoanSubmit = async (e) => {
    e.preventDefault();
    setPayLoanSuccessMsg("");
    setPayLoanErrorMsg("");
    if (!payLoanUser || !payLoanAmount) {
      setPayLoanErrorMsg("Please select a user and enter an amount.");
      return;
    }
    setPayLoanLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.post(
        "https://savings-with-records.onrender.com/api/loan-payment/",
        {
          username: payLoanUser,
          amount_paid: payLoanAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setPayLoanSuccessMsg(`Successfully paid UGX ${payLoanAmount} for ${payLoanUser}.`);
      setPayLoanAmount("");
      setPayLoanUser("");
    } catch (err) {
      setPayLoanErrorMsg(
        err.response?.data?.message || "Failed to pay loan. Please try again."
      );
    } finally {
      setPayLoanLoading(false);
    }
  };

  // Filtered records for table and export
  const filteredDetailedRecords = detailedRecords.filter(user =>
    user.username.toLowerCase().includes(filterUsername.toLowerCase())
  );

  // Export to PDF (with autoTable function)
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Detailed Records", 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [["Username", "Total Savings", "Total Loans", "Net Savings"]],
      body: filteredDetailedRecords.map((user) => [
        user.username,
        user.total_savings,
        user.total_loans,
        user.net_savings,
      ]),
    });
    doc.save("detailed_records.pdf");
  };

  // Export to Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredDetailedRecords.map((user) => ({
        Username: user.username,
        "Total Savings": user.total_savings,
        "Total Loans": user.total_loans,
        "Net Savings": user.net_savings,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detailed Records");
    XLSX.writeFile(wb, "detailed_records.xlsx");
  };

  // Sidebar styles
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

  // Responsive: use window width to adjust layout
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Adjust layout for small screens
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

  return (
    <div style={responsiveContainerStyle}>
      {/* Sidebar */}
      <div style={responsiveSidebarStyle}>
        <h3 style={{ marginTop: 0 }}>Treasurer</h3>
        {SIDEBAR_OPTIONS.map(opt => (
          <div
            key={opt.key}
            style={menuItemStyle(selectedMenu === opt.key)}
            onClick={() => {
              setSelectedMenu(opt.key);
              setSuccessMsg("");
              setErrorMsg("");
              setLoanSuccessMsg("");
              setLoanErrorMsg("");
              setPayLoanSuccessMsg("");
              setPayLoanErrorMsg("");
              setSummary(null); // Clear summary when changing menu
              setSummaryError("");
              setDetailedRecords([]); // Clear detailed records when changing menu
              setDetailedError("");
              setFilterUsername(""); // Clear filter when changing menu
              setMyRecords(null); // Clear my records when changing menu
              setMyRecordsError("");
            }}
          >
            {opt.label}
          </div>
        ))}
      </div>
      {/* Main Content */}
      <div style={responsiveMainStyle}>
        {selectedMenu === "save" && (
          <>
            <h2>Save Money</h2>
            <form onSubmit={handleSubmit}>
              <label style={{ display: "block", marginBottom: 8 }}>Select User:</label>
              <select
                value={selectedUsername}
                onChange={e => setSelectedUsername(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 16 }}
                required
              >
                <option value="">-- Select Username --</option>
                {usernames.map(u => (
                  <option key={u.username} value={u.username}>{u.username}</option>
                ))}
              </select>

              <label style={{ display: "block", marginBottom: 8 }}>Amount to Save (UGX):</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 16 }}
                required
              />

              <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
                {loading ? "Saving..." : "Save Money"}
              </button>
            </form>
            {successMsg && <div style={{ color: "green", marginTop: 16 }}>{successMsg}</div>}
            {errorMsg && <div style={{ color: "red", marginTop: 16 }}>{errorMsg}</div>}
          </>
        )}
        {selectedMenu === "loan" && (
          <>
            <h2>Give Loan</h2>
            <form onSubmit={handleLoanSubmit}>
              <label style={{ display: "block", marginBottom: 8 }}>Select User:</label>
              <select
                value={loanUser}
                onChange={e => setLoanUser(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 16 }}
                required
              >
                <option value="">-- Select Username --</option>
                {usernames.map(u => (
                  <option key={u.username} value={u.username}>{u.username}</option>
                ))}
              </select>

              <label style={{ display: "block", marginBottom: 8 }}>Amount to Loan (UGX):</label>
              <input
                type="number"
                min="1"
                value={loanAmount}
                onChange={e => setLoanAmount(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 16 }}
                required
              />

              <button type="submit" disabled={loanLoading} style={{ width: "100%", padding: 10 }}>
                {loanLoading ? "Processing..." : "Give Loan"}
              </button>
            </form>
            {loanSuccessMsg && <div style={{ color: "green", marginTop: 16 }}>{loanSuccessMsg}</div>}
            {loanErrorMsg && <div style={{ color: "red", marginTop: 16 }}>{loanErrorMsg}</div>}
          </>
        )}
        {selectedMenu === "payloan" && (
          <>
            <h2>Pay Loan</h2>
            <form onSubmit={handlePayLoanSubmit}>
              <label style={{ display: "block", marginBottom: 8 }}>Select User:</label>
              <select
                value={payLoanUser}
                onChange={e => setPayLoanUser(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 16 }}
                required
              >
                <option value="">-- Select Username --</option>
                {usernames.map(u => (
                  <option key={u.username} value={u.username}>{u.username}</option>
                ))}
              </select>

              <label style={{ display: "block", marginBottom: 8 }}>Amount to Pay (UGX):</label>
              <input
                type="number"
                min="1"
                value={payLoanAmount}
                onChange={e => setPayLoanAmount(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 16 }}
                required
              />

              <button type="submit" disabled={payLoanLoading} style={{ width: "100%", padding: 10 }}>
                {payLoanLoading ? "Processing..." : "Pay Loan"}
              </button>
            </form>
            {payLoanSuccessMsg && <div style={{ color: "green", marginTop: 16 }}>{payLoanSuccessMsg}</div>}
            {payLoanErrorMsg && <div style={{ color: "red", marginTop: 16 }}>{payLoanErrorMsg}</div>}
          </>
        )}
        {selectedMenu === "myrecords" && (
          <>
            <h2>My Records</h2>
            {myRecordsLoading && <div>Loading your records...</div>}
            {myRecordsError && <div style={{ color: "red" }}>{myRecordsError}</div>}
            {myRecords && !myRecordsLoading && !myRecordsError && (
              <div style={{
                background: "#f8f9fa",
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                padding: 20,
                marginTop: 16,
                fontSize: 18,
                lineHeight: 2,
              }}>
                <div><strong>Username:</strong> {myRecords.username}</div>
                <div><strong>Role:</strong> {myRecords.role}</div>
                <div><strong>Total Savings:</strong> {myRecords.personal_totals.total_savings} {myRecords.currency}</div>
                <div><strong>Total Loans:</strong> {myRecords.personal_totals.total_loans} {myRecords.currency}</div>
                <div><strong>Net Savings:</strong> {myRecords.personal_totals.net_savings} {myRecords.currency}</div>
              </div>
            )}
          </>
        )}
        {selectedMenu === "summary" && (
          <>
            <h2>Summary Totals</h2>
            {summaryLoading && <div>Loading summary...</div>}
            {summaryError && <div style={{ color: "red" }}>{summaryError}</div>}
            {summary && !summaryLoading && !summaryError && (
              <div style={{
                background: "#f8f9fa",
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                padding: 20,
                marginTop: 16,
                fontSize: 18,
                lineHeight: 2,
              }}>
                <div><strong>Overall Savings:</strong> {summary.overall_savings} {summary.currency}</div>
                <div><strong>Overall Loans:</strong> {summary.overall_loans} {summary.currency}</div>
                <div><strong>Net Savings:</strong> {summary.overall_net_savings} {summary.currency}</div>
                <div><strong>Users with Savings:</strong> {summary.users_with_savings}</div>
                <div><strong>Users with Loans:</strong> {summary.users_with_loans}</div>
              </div>
            )}
          </>
        )}
        {selectedMenu === "detailed" && (
          <>
            <h2>Detailed Records</h2>
            {detailedLoading && <div>Loading records...</div>}
            {detailedError && <div style={{ color: "red" }}>{detailedError}</div>}
            {!detailedLoading && !detailedError && detailedRecords.length > 0 && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="Filter by username..."
                    value={filterUsername}
                    onChange={e => setFilterUsername(e.target.value)}
                    style={{ padding: 8, marginRight: 12, width: 220, maxWidth: "90%" }}
                  />
                  <button onClick={handleExportPDF} style={{ marginRight: 8 }}>
                    Export to PDF
                  </button>
                  <button onClick={handleExportExcel}>
                    Export to Excel
                  </button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
                  <thead>
                    <tr style={{ background: "#f0f0f0" }}>
                      <th style={{ padding: 8, border: "1px solid #ddd" }}>Username</th>
                      <th style={{ padding: 8, border: "1px solid #ddd" }}>Total Savings</th>
                      <th style={{ padding: 8, border: "1px solid #ddd" }}>Total Loans</th>
                      <th style={{ padding: 8, border: "1px solid #ddd" }}>Net Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDetailedRecords.map((user) => (
                      <tr key={user.username}>
                        <td style={{ padding: 8, border: "1px solid #ddd" }}>{user.username}</td>
                        <td style={{ padding: 8, border: "1px solid #ddd" }}>{user.total_savings}</td>
                        <td style={{ padding: 8, border: "1px solid #ddd" }}>{user.total_loans}</td>
                        <td style={{ padding: 8, border: "1px solid #ddd" }}>{user.net_savings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {!detailedLoading && !detailedError && filteredDetailedRecords.length === 0 && (
              <div>No records found.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardTreasurer; 