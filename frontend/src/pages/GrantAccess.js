import React, { useState } from "react";
import { database, ref, get, update } from "../firebaseConfig";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./GrantAccess.css";

const GrantAccess = () => {
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const currentAdmin = auth.currentUser; // Store admin session before switching

  const adminEmails = [
    "nitinbiradar76@gmail.com",
    "owner@maziremilk.com",
    "ashishbiradar150@gmail.com"
  ];

  // Debugging: Log the current admin's email
  console.log("Current Admin Email:", currentAdmin?.email);

  // 🚨 Prevent Non-Admins from Accessing This Page
  if (!adminEmails.includes(currentAdmin?.email)) {
    console.log("Access Denied: Admin email not found in the list.");
    return (
      <div className="restricted">
        <h2>🚫 Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  const handleGrantAccess = async () => {
    if (!email) {
      setError("❌ Please enter an email!");
      return;
    }

    try {
      const encodedEmail = btoa(email);
      const userRef = ref(database, `approved_users/${encodedEmail}`);

      // ✅ Step 1: Check if user already exists in Firestore
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setError("⚠️ User already has access.");
        return;
      }

      // ✅ Step 2: Check if user is already registered in Firebase Auth
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        // 🔹 User exists in Firebase Auth but not in Firestore — Just add them to Firestore
        await update(ref(database, "approved_users"), {
          [encodedEmail]: { email, isAdmin },
        });

        setMessage("✅ Access granted successfully! User must reset password.");
        setEmail("");
        setIsAdmin(false);
        return;
      }

      // ✅ Step 3: Create the User in Firebase Authentication if NOT found
      try {
        await createUserWithEmailAndPassword(auth, email, "temporaryPassword123");
        console.log("✅ New user created:", email);

        // ✅ Step 4: Add the User to Firestore Database
        await update(ref(database, "approved_users"), {
          [encodedEmail]: { email, isAdmin },
        });

        setMessage("✅ Access granted successfully! User must reset password.");
        setEmail("");
        setIsAdmin(false);
      } catch (authError) {
        console.error("Firebase Auth Error:", authError);
        setError("❌ Unexpected error in Firebase Auth.");
        return;
      }
    } catch (error) {
      console.error("❌ Error granting access:", error);
      setError("❌ Error granting access. Try again.");
    }
  };

  return (
    <div className="grant-access-wrapper">
      <div className="grant-access-container">
        <div className="grant-access-header">
          <h2>Grant User Access</h2>
        </div>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <div className="grant-access-form">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter email to grant access"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={() => setIsAdmin(!isAdmin)}
            />
            Grant Admin Access
          </label>

          <button className="grant-btn" onClick={handleGrantAccess}>
            Grant Access 🔑
          </button>
          <button className="back-btn" onClick={() => navigate("/")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrantAccess;