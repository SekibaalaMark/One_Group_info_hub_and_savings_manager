import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserCircle, FaLock } from "react-icons/fa";
import "./Login.css";
import { AuthContext } from "../context/authContext";
import LoadingAnimation from "@/components/LoadingAnimation";

const Login = () => {
  const { user, loading, login, error: authError } = useContext(AuthContext);
  const navigate = useNavigate();

  // Prevent rendering Login if user is authenticated
  if (!loading && user) {
    return null; // AuthProvider handles navigation
  }

  const [username, setUsername] = useState(
    localStorage.getItem("rememberedUsername") || ""
  );
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    !!localStorage.getItem("rememberedUsername")
  );
  const [showAnimation, setShowAnimation] = useState(true);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Add animation timeout effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Function to get user-friendly error message
  const getUserFriendlyError = (error) => {
    if (!error) return null;

    // Network or server errors
    if (!error.response) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    // Handle specific status codes
    switch (error.response.status) {
      case 400:
        return "Please check your username and password and try again.";
      case 401:
        return "Invalid username or password. Please try again.";
      case 403:
        return "Access denied. Please contact support if you think this is a mistake.";
      case 404:
        return "Login service is temporarily unavailable. Please try again later.";
      case 500:
        return "We're experiencing technical difficulties. Please try again later.";
      default:
        return "Unable to log in at the moment. Please try again later.";
    }
  };

  // Forgot Password Handlers
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);
    try {
      await axios.post("https://savings-with-records.onrender.com/api/request-password-reset/", { email: forgotEmail });
      setForgotSuccess("Confirmation code sent to your email. Check your inbox.");
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to request password reset.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);
    try {
      await axios.post("https://savings-with-records.onrender.com/api/reset-password/", {
        confirmation_code: forgotCode,
        new_password: forgotNewPassword,
        confirm_password: forgotConfirmPassword,
        email: forgotEmail,
      });
      setForgotSuccess("Password reset successful! You can now log in.");
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail("");
        setForgotCode("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setForgotError("");
        setForgotSuccess("");
      }, 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both username and password.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "https://savings-with-records.onrender.com/api/login/",
        { username, password }
      );

      const data = response.data || response;
      const token = data.access;
      const refresh = data.refresh;
      const userObj = data.user;
      const userRole = userObj?.role;

      if (!token) {
        setErrorMessage("Unable to complete login. Please try again.");
        return;
      }

      // Update auth context
      await login(
        {
          token,
          refresh,
          username: userObj?.username || username,
          user_role: userRole,
          user: userObj,
        },
        userRole
      );

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", username);
      } else {
        localStorage.removeItem("rememberedUsername");
      }

    } catch (err) {
      const friendlyError = getUserFriendlyError(err);
      setErrorMessage(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showAnimation && <LoadingAnimation />}
      <div className="login-page">
        <div className="login-container">
          <form className="login-form" onSubmit={handleSubmit}>
            <h1>Welcome Back!</h1>
            <p className="login-subtitle">Please enter your credentials to continue</p>

            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-wrapper">
                <FaUserCircle className="input-icon" />
                <input
                  type="text"
                  className="custom-input username-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMessage("");
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  className="custom-input password-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <span className="checkmark"></span>
                <span className="checkbox-label">Remember me</span>
              </label>
              <span
                className="forgot-link"
                style={{ cursor: "pointer", color: "#1976d2", textDecoration: "underline" }}
                onClick={() => setShowForgotModal(true)}
              >
                Forgot Password?
              </span>
            </div>

            {errorMessage && (
              <div className="error-message">{errorMessage}</div>
            )}

            <button 
              type="submit" 
              className="sign-in-button"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            <p className="register-prompt">
              New to the platform? {" "}
              <Link to="/register" className="register-link">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-content" style={{ background: "#fff", padding: 32, borderRadius: 8, minWidth: 320, maxWidth: 400, boxShadow: "0 2px 16px rgba(0,0,0,0.15)" }}>
            <button
              style={{ position: "absolute", top: 16, right: 24, background: "none", border: "none", fontSize: 22, cursor: "pointer" }}
              onClick={() => {
                setShowForgotModal(false);
                setForgotStep(1);
                setForgotEmail("");
                setForgotCode("");
                setForgotNewPassword("");
                setForgotConfirmPassword("");
                setForgotError("");
                setForgotSuccess("");
              }}
              title="Close"
            >
              ×
            </button>
            <h2 style={{ marginTop: 0 }}>Forgot Password</h2>
            {forgotStep === 1 && (
              <form onSubmit={handleForgotRequest}>
                <label>Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                  style={{ width: "100%", padding: 8, marginBottom: 16 }}
                  placeholder="Enter your email"
                />
                {forgotError && <div style={{ color: "red", marginBottom: 8 }}>{forgotError}</div>}
                {forgotSuccess && <div style={{ color: "green", marginBottom: 8 }}>{forgotSuccess}</div>}
                <button type="submit" disabled={forgotLoading} style={{ width: "100%", padding: 10 }}>
                  {forgotLoading ? "Requesting..." : "Request Reset"}
                </button>
              </form>
            )}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotReset}>
                <label>Confirmation Code</label>
                <input
                  type="text"
                  value={forgotCode}
                  onChange={e => setForgotCode(e.target.value)}
                  required
                  style={{ width: "100%", padding: 8, marginBottom: 12 }}
                  placeholder="Enter confirmation code"
                />
                <label>New Password</label>
                <input
                  type="password"
                  value={forgotNewPassword}
                  onChange={e => setForgotNewPassword(e.target.value)}
                  required
                  style={{ width: "100%", padding: 8, marginBottom: 12 }}
                  placeholder="Enter new password"
                />
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={forgotConfirmPassword}
                  onChange={e => setForgotConfirmPassword(e.target.value)}
                  required
                  style={{ width: "100%", padding: 8, marginBottom: 12 }}
                  placeholder="Confirm new password"
                />
                {forgotError && <div style={{ color: "red", marginBottom: 8 }}>{forgotError}</div>}
                {forgotSuccess && <div style={{ color: "green", marginBottom: 8 }}>{forgotSuccess}</div>}
                <button type="submit" disabled={forgotLoading} style={{ width: "100%", padding: 10 }}>
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
