import React, { useState } from "react";
import { auth, database, ref, get } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Convert email to match database storage format
      const encodedEmail = btoa(email);
      const userRef = ref(database, `approved_users/${encodedEmail}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        setError("🚫 Access Denied! Contact Admin.");
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      
      // Set state and delay navigation for auth update
      setIsAuthenticated(true);
      setTimeout(() => navigate("/"), 500); // Delaying redirect to ensure auth is updated
    } catch (err) {
      setError("⚠️ Invalid email or password.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2 className="auth-title">Mazire Milk Dairy 👋</h2>
        {error && <p className="error-message">{error}</p>}

        <form className="auth-form" onSubmit={handleLogin}>
          <input
            type="email"
            className="input-field"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="input-field"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="auth-button" type="submit">Login</button>
        </form>

        <p className="forgot-password">
          <a href="/forgot-password">Forgot Password?</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
