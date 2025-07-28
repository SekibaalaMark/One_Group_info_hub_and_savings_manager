import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RegisterForm.css";
const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    password2: "",
    role: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.password2) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    // Validate email is gmail
    if (!formData.email.endsWith('@gmail.com')) {
      setError("Only Gmail accounts are allowed");
      setIsLoading(false);
      return;
    }

    // Validate role
    if (!['sports_manager', 'general_user', 'Treasurer'].includes(formData.role)) {
      setError("Role must be sports_manager, general_user, or Treasurer");
      setIsLoading(false);
      return;
    }

    try {
      // Create payload for backend
      const payload = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        password2: formData.password2,
        role: formData.role,
      };

      console.log("Sending registration data:", payload);

      const response = await axios.post(
        "https://savings-with-records.onrender.com/api/register/",
        payload
      );

      console.log("Registration API response:", response);

      if (response.status >= 200 && response.status < 300) {
        alert("Registration successful! Please verify your email with the code sent to your inbox.");
        navigate("/confirm-email");
      } else {
        setError("Registration was not successful. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      
      // Handle different types of error responses
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else if (err.response.data.message) {
          setError(err.response.data.message);
        } else {
          // Handle nested error objects
          const errorMessages = [];
          Object.entries(err.response.data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              errorMessages.push(`${key}: ${value.join(', ')}`);
            } else if (typeof value === 'string') {
              errorMessages.push(`${key}: ${value}`);
            }
          });
          setError(errorMessages.join('; '));
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://ihealth-vhdl.onrender.com/api/verify-email/",
        {
          email: verificationEmail,
          code: verificationCode,
        }
      );

      console.log("Verification response:", response.data);
      alert("Email verified successfully! You can now login.");
      navigate("/login");
    } catch (err) {
      console.error("Verification error:", err);
      setError(
        err.response?.data?.error || 
        "Verification failed. Please check your code and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://ihealth-vhdl.onrender.com/api/resend-confirmation-code/",
        {
          email: verificationEmail,
        }
      );

      console.log("Resend code response:", response.data);
      alert("Verification code has been resent to your email.");
    } catch (err) {
      console.error("Resend code error:", err);
      setError(
        err.response?.data?.Error || 
        "Failed to resend verification code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">Register</div>
        <form className="register-form" onSubmit={handleSubmit}>
          <label>Email* (Gmail only)</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="example@gmail.com"
          />
          <small className="help-text">Only Gmail accounts are allowed</small>

          <label>Username*</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <label>Password* (min 8 characters)</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="8"
          />

          <label>Confirm Password*</label>
          <input
            type="password"
            name="password2"
            value={formData.password2}
            onChange={handleChange}
            required
            minLength="8"
          />

          <label>User Role*</label>
          <select 
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            <option value="sports_manager">Sports Manager</option>
            <option value="general_user">General User</option>
            <option value="Treasurer">Treasurer</option>
          </select>

          {/* Remove Center Number field */}

          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </button>
          
          <div className="register-footer">
            Already have an account? <a href="/login">Login here</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
