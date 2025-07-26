import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RegisterForm.css";

const ConfirmEmail = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://ihealth-vhdl.onrender.com/api/verify-email/",
        {
          email: email,
          code: code,
        }
      );
      alert("Email verified successfully! You can now login.");
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
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
      await axios.post(
        "https://ihealth-vhdl.onrender.com/api/resend-confirmation-code/",
        {
          email: email,
        }
      );
      alert("Verification code has been resent to your email.");
    } catch (err) {
      setError(
        err.response?.data?.Error ||
        err.response?.data?.message ||
        "Failed to resend verification code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-header">Verify Your Email</div>
      <form className="register-form" onSubmit={handleVerifyEmail}>
        <p>Please enter your email and the verification code sent to your inbox.</p>
        <label>Email*</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="example@gmail.com"
        />
        <label>Verification Code*</label>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
        />
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Verify Email"}
        </button>
        <div className="register-footer">
          Didn't receive the code?
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading}
            className="resend-button"
          >
            Resend Code
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfirmEmail; 