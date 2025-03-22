import React, { useState } from "react";
import { auth } from "../firebaseConfig"; // ✅ Fix this import
import { sendPasswordResetEmail } from "firebase/auth"; 
import { useNavigate } from "react-router-dom"; 
import "./ForgotPassword.css"; 

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError("❌ Please enter an email address.");
      return;
    }

    try {
      console.log("Attempting to send reset email to:", email);
      await sendPasswordResetEmail(auth, email);
      setMessage("📩 Check your inbox for a password reset link.");
    } catch (err) {
      console.error("Error sending reset email:", err);
      if (err.code === "auth/user-not-found") {
        setError("❌ Email not found in Firebase Authentication.");
      } else {
        setError("❌ Error: Unable to send reset email.");
      }
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2 className="forgot-password-title">🔑 Reset Your Password</h2>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        
        <form className="forgot-password-form" onSubmit={handleReset}>
          <input
            type="email"
            className="input-field"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="reset-button" type="submit">Send Reset Link</button>
        </form>

        <p className="back-to-login">
          Remembered your password? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
