import React, { useState } from "react";
import { auth } from "../firebaseConfig"; // Updated import for auth
import { createUserWithEmailAndPassword } from "firebase/auth";
import "./SignUp.css";


const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setSuccess("Account created successfully!");
            setEmail("");
            setPassword("");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <h2 className="signup-title">Create Your Account</h2>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
                <form onSubmit={handleSignUp}>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button type="submit" className="signup-button">Sign Up</button>
                </form>
                <p className="redirect-text">
                    Already have an account? <a href="/" className="login-link">Login</a>
                </p>
            </div>
        </div>
    );
    
};

export default SignUp;
