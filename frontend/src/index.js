import "bootstrap/dist/css/bootstrap.min.css";
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { database, ref, update, get } from "./firebaseConfig";

const addApprovedUsers = async () => {
  const approvedUsers = {
    [btoa("nitinbiradar76@gmail.com")]: { email: "nitinbiradar76@gmail.com", isAdmin: true },
    [btoa("ajinkya@gmail.com")]: { email: "ajinkya@gmail.com", isAdmin: true },
    
  };

  try {
    const approvedUsersRef = ref(database, "approved_users");

    // Get existing users
    const snapshot = await get(approvedUsersRef);
    const existingUsers = snapshot.exists() ? snapshot.val() : {};

    // Merge existing users with new ones to prevent deletion
    await update(approvedUsersRef, { ...existingUsers, ...approvedUsers });

    console.log("✅ Approved users updated successfully!");
  } catch (error) {
    console.error("❌ Error adding approved users:", error);
  }
};

// Run this once when the app starts (but don't delete existing users)
addApprovedUsers();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
