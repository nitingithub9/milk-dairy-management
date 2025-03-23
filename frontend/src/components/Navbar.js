import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, database, ref, get } from "../firebaseConfig";
import "./Navbar.css";

function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef(null); // Ref for the mobile menu

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

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    auth.signOut();
    navigate("/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link className="navbar-brand" to="/">
          Mazire Milk Dairy
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        <div className={`nav-links ${menuOpen ? "open" : ""}`} ref={menuRef}>
          <Link to="/milk-rates">Milk Rates</Link>
          <Link to="/branches">Branches</Link>
          <Link to="/societies">Societies</Link>
          <Link to="/payments">Payments</Link>
          <Link to="/customers">Customers</Link>
          <Link to="/milk-sales">Milk Sales</Link>
          <Link to="/invoice">View Bills</Link>
          <Link to="/generate-invoice">Generate Invoice</Link>


          {isAdmin && <Link to="/grant-access" className="grant-access">Grant Access</Link>}
          {isAdmin && <Link to="/admin-users" className="admin-users">Admin Users</Link>}

          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;