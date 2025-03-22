import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { auth, database, ref, get } from "./firebaseConfig";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Payments from "./pages/Payments";
import MilkRates from "./pages/MilkRates";
import Branches from "./pages/Branches";
import Societies from "./pages/Societies";
import Invoice from "./pages/Invoice";
import Customers from "./pages/Customers";
import MilkSales from "./pages/MilkSales";
import GenerateInvoice from "./pages/GenerateInvoice";
import GrantAccess from "./pages/GrantAccess";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import AdminUsers from "./pages/AdminUsers";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserAccess = async (user) => {
      if (user) {
        const encodedEmail = btoa(user.email);
        const userRef = ref(database, `approved_users/${encodedEmail}`);
        const snapshot = await get(userRef);
    
        if (snapshot.exists()) {
          setIsAuthenticated(true);
          setIsAdmin(snapshot.val().isAdmin || false);
        } else {
          console.warn("⚠️ User not found in approved_users.");
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    
    

    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth State Changed:", user);
      setIsLoading(true);
      checkUserAccess(user);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) return <div className="loading-screen">Loading...</div>;

  return (
    <Router>
      {isAuthenticated && <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />}
      <div className="container mt-4">
        <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/signup" element={<SignUp setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/payments" element={isAuthenticated ? <Payments /> : <Navigate to="/login" />} />
          <Route path="/milk-rates" element={isAuthenticated ? <MilkRates /> : <Navigate to="/login" />} />
          <Route path="/branches" element={isAuthenticated ? <Branches /> : <Navigate to="/login" />} />
          <Route path="/societies" element={isAuthenticated ? <Societies /> : <Navigate to="/login" />} />
          <Route path="/invoice" element={isAuthenticated ? <Invoice /> : <Navigate to="/login" />} />
          <Route path="/customers" element={isAuthenticated ? <Customers /> : <Navigate to="/login" />} />
          <Route path="/milk-sales" element={isAuthenticated ? <MilkSales /> : <Navigate to="/login" />} />
          <Route path="/generate-invoice" element={isAuthenticated ? <GenerateInvoice /> : <Navigate to="/login" />} />

          {/* Admin Route (Only Admins Can Access) */}
          <Route path="/grant-access" element={isAuthenticated && isAdmin ? <GrantAccess /> : <Navigate to="/" />} />

          <Route path="/admin-users" element={isAuthenticated && isAdmin ? <AdminUsers /> : <Navigate to="/" />} />

          {/* Catch-All Route */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
