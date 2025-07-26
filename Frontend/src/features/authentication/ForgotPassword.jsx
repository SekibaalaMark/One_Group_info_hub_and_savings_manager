import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEnvelope, FaKey } from "react-icons/fa";
// import "@/Styles/ForgotPassword.css"; // You'll need to create this CSS file


const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Step 1: Request password reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post("https://ihealth-vhdl.onrender.com/api/request-password-reset/", { email });
      setMessage("A confirmation code has been sent to your email. Please check your inbox.");
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to send reset code. Please check your email and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim() || !confirmationCode.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post("https://ihealth-vhdl.onrender.com/api/reset-password/", {
        email,
        confirmation_code: confirmationCode,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setMessage("Password reset successful! You can now log in with your new password.");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to reset password. Please check your details and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' }}>
      <div className="login-container" style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(21,101,192,0.10)', padding: '40px 30px', margin: '0 auto' }}>
        {step === 1 && (
          <form className="forgot-password-form" onSubmit={handleRequestReset}>
            <h1 style={{ color: '#1565c0', fontWeight: 900, marginBottom: 8 }}>Forgot Password</h1>
            <p className="instructions" style={{ color: '#333', marginBottom: 24 }}>
              Enter your email below and we'll send a confirmation code to reset your password.
            </p>
            <div className="input-wrapper" style={{ marginBottom: 20 }}>
              <label htmlFor="email" className="form-label" style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 4, display: 'block' }}>Email</label>
              <div className="input-icon-container" style={{ position: 'relative' }}>
                <input
                  type="email"
                  id="email"
                  className="form-input with-icon"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 12px',
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
                <FaEnvelope className="input-icon" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#1565c0', fontSize: 20 }} />
              </div>
            </div>
            {error && <p className="error-message" style={{ color: '#e53935', marginBottom: 12 }}>{error}</p>}
            {message && <p className="success-message" style={{ color: '#43a047', marginBottom: 12 }}>{message}</p>}
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: 12,
                background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 18,
                border: 'none',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(21,101,192,0.10)',
                cursor: 'pointer',
                marginBottom: 8,
                transition: 'background 0.2s',
              }}
            >
              {isSubmitting ? "Sending..." : "Send Confirmation Code"}
            </button>
            <div className="redirect-text" style={{ textAlign: 'center', marginTop: 16 }}>
              <p>
                Remember your password? <a href="/login" style={{ color: '#1565c0', fontWeight: 'bold' }}>Back to Login</a>
              </p>
            </div>
          </form>
        )}
        {step === 2 && (
          <form className="reset-password-form" onSubmit={handleResetPassword}>
            <h1 style={{ color: '#1565c0', fontWeight: 900, marginBottom: 8 }}>Reset Password</h1>
            <p className="instructions" style={{ color: '#333', marginBottom: 24 }}>
              Enter the confirmation code sent to your email and set a new password.
            </p>
            <div className="input-wrapper" style={{ marginBottom: 16 }}>
              <label htmlFor="email2" className="form-label" style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 4, display: 'block' }}>Email</label>
              <input
                type="email"
                id="email2"
                className="form-input"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: 12,
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
            </div>
            <div className="input-wrapper" style={{ marginBottom: 16 }}>
              <label htmlFor="confirmationCode" className="form-label" style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 4, display: 'block' }}>Confirmation Code</label>
              <input
                type="text"
                id="confirmationCode"
                className="form-input"
                placeholder="Enter confirmation code"
                required
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: 12,
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
            </div>
            <div className="input-wrapper" style={{ marginBottom: 16 }}>
              <label htmlFor="newPassword" className="form-label" style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 4, display: 'block' }}>New Password</label>
              <input
                type="password"
                id="newPassword"
                className="form-input"
                placeholder="Enter new password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: 12,
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
            </div>
            <div className="input-wrapper" style={{ marginBottom: 24 }}>
              <label htmlFor="confirmPassword" className="form-label" style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 4, display: 'block' }}>Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-input"
                placeholder="Confirm new password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: 12,
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
            </div>
            {error && <p className="error-message" style={{ color: '#e53935', marginBottom: 12 }}>{error}</p>}
            {message && <p className="success-message" style={{ color: '#43a047', marginBottom: 12 }}>{message}</p>}
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: 12,
                background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 18,
                border: 'none',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(21,101,192,0.10)',
                cursor: 'pointer',
                marginBottom: 8,
                transition: 'background 0.2s',
              }}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
            <div className="redirect-text" style={{ textAlign: 'center', marginTop: 16 }}>
              <p>
                Remember your password? <a href="/login" style={{ color: '#1565c0', fontWeight: 'bold' }}>Back to Login</a>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
