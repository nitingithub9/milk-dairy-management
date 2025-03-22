import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, database, ref, get } from "../firebaseConfig";
import "./Navbar.css"; // Ensure you have a separate CSS file for styling

function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false); // Mobile menu state
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (auth.currentUser) {
        const userRef = ref(database, `approved_users/${btoa(auth.currentUser.email)}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          setIsAdmin(snapshot.val().isAdmin || false);
        } else {
          setIsAdmin(false);
        }
      }
    };
    
    fetchUserRole();
  }, [auth.currentUser]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    auth.signOut();
    navigate("/login");
  };

  // If the user is not authenticated, return null (no Navbar)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo / Brand Name */}
        <Link className="navbar-brand" to="/">
          Mazire Milk Dairy
        </Link>

        {/* Mobile Menu Button */}
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        {/* Navigation Links */}
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link to="/milk-rates">Milk Rates</Link>
          <Link to="/branches">Branches</Link>
          <Link to="/societies">Societies</Link>
          <Link to="/payments">Payments</Link>
          <Link to="/customers">Customers</Link>
          <Link to="/milk-sales">Milk Sales</Link>
          <Link to="/invoice">View Bills</Link>

          {/* Show "Grant Access" button only for Admins */}
          {isAdmin && <Link to="/grant-access" className="grant-access">Grant Access 🔑</Link>}
          {isAdmin && <Link to="/admin-users" className="admin-users">Admin Users</Link>}

          {/* Logout Button */}
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
