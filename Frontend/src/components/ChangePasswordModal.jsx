import React, { useState } from "react";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import axios from "axios";

const ChangePasswordModal = ({ open, onClose, token }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        "https://ihealth-vhdl.onrender.com/api/change-password/",
        {
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to change password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    setSuccess("");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="Old Password"
            type="password"
            fullWidth
            margin="normal"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            required
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
          {error && <div style={{ color: '#d32f2f', marginTop: 8 }}>{error}</div>}
          {success && <div style={{ color: '#388e3c', marginTop: 8 }}>{success}</div>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary" disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? "Changing..." : "Change Password"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChangePasswordModal; 