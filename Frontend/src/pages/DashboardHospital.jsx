import React, { useState, useRef } from "react";
import { Box, Typography, Button, List, ListItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from "../context/authContext";
import ChangePasswordModal from '../components/ChangePasswordModal';

const sidebarOptions = [
  { label: "Verify Child", icon: <VerifiedUserIcon />, key: "verify-child" },
  { label: "Create Medical Bill", icon: <ReceiptIcon />, key: "create-medical-bill" },
  { label: "Medical Records", icon: <AssignmentIcon />, key: "medical-records" },
];

const DashboardHospital = () => {
  const { user, logout } = useAuth();
  const username = user?.username || "Hospital";
  const [selected, setSelected] = useState("verify-child"); // Default to Verify Child
  const [verifyChildState, setVerifyChildState] = useState({
    child_number: "",
    loading: false,
    error: null,
    result: null,
  });
  const [createBillState, setCreateBillState] = useState({
    child_number: "",
    disease_description: "",
    hospital_bill: "",
    loading: false,
    error: null,
    success: null,
  });
  const [medicalRecordsState, setMedicalRecordsState] = useState({
    records: [],
    loading: false,
    error: null,
    loaded: false,
  });
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleSidebarClick = (key) => {
    setSelected(key);
  };

  const handleVerifyChildChange = (e) => {
    setVerifyChildState((prev) => ({
      ...prev,
      child_number: e.target.value,
      error: null,
      result: null,
    }));
  };

  const handleVerifyChildSubmit = async (e) => {
    e.preventDefault();
    setVerifyChildState((prev) => ({ ...prev, loading: true, error: null, result: null }));
    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch("https://ihealth-vhdl.onrender.com/api/verify-child/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ child_number: verifyChildState.child_number }),
      });
      if (!response.ok) {
        let errorMsg = "Failed to verify child";
        try {
          const errorData = await response.json();
          errorMsg = errorData?.message || JSON.stringify(errorData) || errorMsg;
        } catch (jsonErr) {
          // Do not try to read the body again
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      console.log('Verify child API response:', data);
      console.log('Photo field value:', data.photo);
      setVerifyChildState((prev) => ({
        ...prev,
        loading: false,
        error: null,
        result: data,
      }));
    } catch (err) {
      setVerifyChildState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Failed to verify child",
        result: null,
      }));
    }
  };

  const handleCreateBillChange = (e) => {
    const { name, value } = e.target;
    setCreateBillState((prev) => ({
      ...prev,
      [name]: value,
      error: null,
      success: null,
    }));
  };

  const handleCreateBillSubmit = async (e) => {
    e.preventDefault();
    setCreateBillState((prev) => ({ ...prev, loading: true, error: null, success: null }));
    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch("https://ihealth-vhdl.onrender.com/api/create-medical-bill/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          child_number: createBillState.child_number,
          disease_description: createBillState.disease_description,
          hospital_bill: createBillState.hospital_bill,
        }),
      });
      if (!response.ok) {
        let errorMsg = "Failed to create medical bill";
        try {
          const errorData = await response.json();
          errorMsg = errorData?.message || JSON.stringify(errorData) || errorMsg;
        } catch (jsonErr) {}
        throw new Error(errorMsg);
      }
      setCreateBillState({
        child_number: "",
        disease_description: "",
        hospital_bill: "",
        loading: false,
        error: null,
        success: "Medical bill created successfully!",
      });
    } catch (err) {
      setCreateBillState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Failed to create medical bill",
        success: null,
      }));
    }
  };

  const fetchMedicalRecords = async () => {
    setMedicalRecordsState((prev) => ({ ...prev, loading: true, error: null }));
    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch("https://ihealth-vhdl.onrender.com/api/hospital-medical-records/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        let errorMsg = "Failed to fetch medical records";
        try {
          const errorData = await response.json();
          errorMsg = errorData?.message || JSON.stringify(errorData) || errorMsg;
        } catch (jsonErr) {}
        throw new Error(errorMsg);
      }
      const data = await response.json();
      let records = Array.isArray(data) ? data : [];
      // Sort by date_of_visit descending (newest first)
      records = records.sort((a, b) => new Date(b.date_of_visit) - new Date(a.date_of_visit));
      setMedicalRecordsState({
        records,
        loading: false,
        error: null,
        loaded: true,
      });
    } catch (err) {
      setMedicalRecordsState({
        records: [],
        loading: false,
        error: err.message || "Failed to fetch medical records",
        loaded: true,
      });
    }
  };

  // Fetch records when Medical Records is selected
  React.useEffect(() => {
    if (selected === "medical-records" && !medicalRecordsState.loaded) {
      fetchMedicalRecords();
    }
  }, [selected]);

  // Main content for each section
  const renderContent = () => {
    switch (selected) {
      case "verify-child":
        return (
          <Box sx={{ width: 350 }}>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
              Verify Child
            </Typography>
            <form onSubmit={handleVerifyChildSubmit}>
              <Box sx={{ mb: 2 }}>
                <label style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 4, display: 'block' }}>Child Number</label>
                <input
                  type="text"
                  name="child_number"
                  value={verifyChildState.child_number}
                  onChange={handleVerifyChildChange}
                  required
                  style={{
                    width: '100%',
                    padding: 12,
                    marginTop: 4,
                    background: '#fff',
                    border: '2px solid #90caf9',
                    borderRadius: 8,
                    color: '#222',
                    fontSize: 16,
                    boxShadow: '0 1px 4px rgba(21,101,192,0.05)',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1565c0'}
                  onBlur={e => e.target.style.borderColor = '#90caf9'}
                />
              </Box>
              {verifyChildState.error && (
                <Typography color="error" sx={{ mb: 1 }}>{verifyChildState.error}</Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={verifyChildState.loading}
              >
                {verifyChildState.loading ? "Verifying..." : "Verify Child"}
              </Button>
            </form>
            {verifyChildState.result && (
              <Box sx={{ mt: 4, textAlign: 'center', p: 2, border: '1px solid #90caf9', borderRadius: 2, background: '#e3f2fd' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Name: {verifyChildState.result.name}</Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>Age: {verifyChildState.result.age}</Typography>
                {verifyChildState.result.photo && (
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {(() => {
                      const photo = verifyChildState.result.photo;
                      console.log('Photo URL from API:', photo);
                      
                      // Handle different photo URL formats
                      let fullPhotoUrl = photo;
                      
                      if (photo) {
                        // If it's already a full URL, use it as-is
                        if (photo.startsWith('http')) {
                          fullPhotoUrl = photo;
                        }
                        // If it starts with /media/, construct the full URL
                        else if (photo.startsWith('/media/')) {
                          fullPhotoUrl = `https://ihealth-vhdl.onrender.com${photo}`;
                        }
                        // If it's just a filename, construct the full URL
                        else if (photo.includes('child_photos/')) {
                          fullPhotoUrl = `https://ihealth-vhdl.onrender.com/media/${photo}`;
                        }
                        // Fallback: try to construct URL
                        else {
                          fullPhotoUrl = `https://ihealth-vhdl.onrender.com/media/child_photos/${photo}`;
                        }
                      }
                      
                      console.log('Constructed photo URL:', fullPhotoUrl);
                      
                      return (
                        <img
                          src={fullPhotoUrl}
                          alt="Child"
                          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 12, objectFit: 'contain', boxShadow: '0 2px 8px rgba(21,101,192,0.15)' }}
                          onError={(e) => {
                            console.error('Failed to load image:', fullPhotoUrl);
                            console.error('Original photo value:', photo);
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', fullPhotoUrl);
                          }}
                        />
                      );
                    })()}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
      case "create-medical-bill":
        return (
          <Box sx={{ width: '100%', maxWidth: 600, background: '#fff', borderRadius: 4, boxShadow: 3, p: { xs: 2, sm: 4 }, mx: 'auto' }}>
            <Typography variant="h4" sx={{ color: '#1565c0', fontWeight: 900, mb: 3, letterSpacing: 1, textShadow: '0 2px 8px rgba(21,101,192,0.10)' }}>
              Create Medical Bill
            </Typography>
            <form onSubmit={handleCreateBillSubmit}>
              <Box sx={{ mb: 2 }}>
                <label style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 4, display: 'block' }}>Child Number</label>
                <input
                  type="text"
                  name="child_number"
                  value={createBillState.child_number}
                  onChange={handleCreateBillChange}
                  required
                  style={{
                    width: '100%',
                    padding: 12,
                    marginTop: 4,
                    background: '#e3f2fd',
                    border: '2px solid #90caf9',
                    borderRadius: 8,
                    color: '#1565c0',
                    fontSize: 16,
                    fontWeight: 'bold',
                    boxShadow: '0 1px 4px rgba(21,101,192,0.05)',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1565c0'}
                  onBlur={e => e.target.style.borderColor = '#90caf9'}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <label style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 4, display: 'block' }}>Disease Description</label>
                <textarea
                  name="disease_description"
                  value={createBillState.disease_description}
                  onChange={handleCreateBillChange}
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 12,
                    marginTop: 4,
                    background: '#e3f2fd',
                    border: '2px solid #90caf9',
                    borderRadius: 8,
                    color: '#1565c0',
                    fontSize: 16,
                    fontWeight: 'bold',
                    boxShadow: '0 1px 4px rgba(21,101,192,0.05)',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    resize: 'vertical',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1565c0'}
                  onBlur={e => e.target.style.borderColor = '#90caf9'}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <label style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 4, display: 'block' }}>Hospital Bill (UGX)</label>
                <input
                  type="number"
                  name="hospital_bill"
                  value={createBillState.hospital_bill}
                  onChange={handleCreateBillChange}
                  required
                  min={0}
                  style={{
                    width: '100%',
                    padding: 12,
                    marginTop: 4,
                    background: '#e3f2fd',
                    border: '2px solid #90caf9',
                    borderRadius: 8,
                    color: '#1565c0',
                    fontSize: 16,
                    fontWeight: 'bold',
                    boxShadow: '0 1px 4px rgba(21,101,192,0.05)',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1565c0'}
                  onBlur={e => e.target.style.borderColor = '#90caf9'}
                />
              </Box>
              {createBillState.error && (
                <Typography color="error" sx={{ mb: 1 }}>{createBillState.error}</Typography>
              )}
              {createBillState.success && (
                <Typography color="success.main" sx={{ mb: 1 }}>{createBillState.success}</Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={createBillState.loading}
                sx={{
                  mt: 2,
                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: 18,
                  borderRadius: 8,
                  boxShadow: 2,
                  '&:hover': {
                    background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
                  },
                }}
              >
                {createBillState.loading ? "Creating..." : "Create Bill"}
              </Button>
            </form>
          </Box>
        );
      case "medical-records":
        return (
          <Box sx={{ width: '100%', maxWidth: 1100, minHeight: '60vh', mx: 'auto', p: { xs: 1, sm: 3, md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
              Medical Records
            </Typography>
            {medicalRecordsState.loading && <Typography>Loading...</Typography>}
            {medicalRecordsState.error && <Typography color="error">{medicalRecordsState.error}</Typography>}
            {!medicalRecordsState.loading && !medicalRecordsState.error && medicalRecordsState.records.length === 0 && (
              <Typography>No medical records found.</Typography>
            )}
            {!medicalRecordsState.loading && !medicalRecordsState.error && medicalRecordsState.records.length > 0 && (
              <Box sx={{ overflowX: 'auto', mt: 2 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8 }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)' }}>
                      <th style={{ padding: 8, border: '1px solid #1976d2', color: '#fff' }}>Name</th>
                      <th style={{ padding: 8, border: '1px solid #1976d2', color: '#fff' }}>Date of Visit</th>
                      <th style={{ padding: 8, border: '1px solid #1976d2', color: '#fff' }}>Disease Description</th>
                      <th style={{ padding: 8, border: '1px solid #1976d2', color: '#fff' }}>Hospital Bill (UGX)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicalRecordsState.records.map((rec, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #42a5f5', background: idx % 2 === 0 ? '#f4faff' : '#fff' }}>
                        <td style={{ padding: 8, border: '1px solid #1976d2', color: '#1565c0', fontWeight: 500 }}>{rec.name}</td>
                        <td style={{ padding: 8, border: '1px solid #1976d2', color: '#1565c0', fontWeight: 500 }}>{rec.date_of_visit}</td>
                        <td style={{ padding: 8, border: '1px solid #1976d2', color: '#1565c0', fontWeight: 500 }}>{rec.disease_description}</td>
                        <td style={{ padding: 8, border: '1px solid #1976d2', color: '#1565c0', fontWeight: 500 }}>{rec.hospital_bill}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', width: '100vw', height: '100vh', minHeight: '100vh', minWidth: '100vw', background: '#fff' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 250,
          background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          py: 3,
          boxShadow: 4,
        }}
      >
        <Box>
          <Typography variant="h6" align="center" sx={{ mb: 3, color: '#fff', fontWeight: 'bold', letterSpacing: 2, textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            HOSPITAL DASHBOARD
          </Typography>
          <List>
            {sidebarOptions.map((option) => (
              <ListItem
                button
                key={option.key}
                selected={selected === option.key}
                onClick={() => handleSidebarClick(option.key)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  background: selected === option.key ? 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)' : 'transparent',
                  color: selected === option.key ? '#fff' : '#bbdefb',
                  boxShadow: selected === option.key ? 2 : 0,
                  '&:hover': { background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)', color: '#fff' },
                  transition: 'all 0.2s',
                }}
              >
                <ListItemIcon sx={{ color: selected === option.key ? '#fff' : '#90caf9' }}>{option.icon}</ListItemIcon>
                <ListItemText primary={option.label} />
              </ListItem>
            ))}
          </List>
        </Box>
        <Box sx={{ px: 2 }}>
          <Divider sx={{ mb: 2, bgcolor: '#90caf9' }} />
          <Button
            variant="contained"
            fullWidth
            startIcon={<LogoutIcon />}
            onClick={logout}
            sx={{
              mb: 1,
              background: '#d32f2f',
              color: '#fff',
              fontWeight: 'bold',
              '&:hover': { background: '#b71c1c', color: '#fff' },
              borderColor: 'transparent',
            }}
          >
            Logout
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setChangePasswordOpen(true)}
            sx={{ mb: 1, color: '#222', background: '#ffeb3b', borderColor: '#fbc02d', fontWeight: 'bold', '&:hover': { background: '#fbc02d', color: '#222', borderColor: '#fbc02d' } }}
          >
            Change Password
          </Button>
        </Box>
      </Box>
      {/* Main Content */}
      <Box sx={{ flex: 1, p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 4, boxShadow: 2 }}>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
          {`Welcome, ${username}!`}
        </Typography>
        {renderContent()}
      </Box>
      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        token={localStorage.getItem('accessToken')}
      />
    </Box>
  );
};

export default DashboardHospital; 