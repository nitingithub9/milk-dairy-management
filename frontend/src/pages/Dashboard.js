import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, database, ref, get } from "../firebaseConfig";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const checkAccess = async () => {
      const encodedEmail = btoa(user.email);
      const userRef = ref(database, `approved_users/${encodedEmail}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        setIsAuthorized(true);
        setIsAdmin(snapshot.val().isAdmin || false); // Set isAdmin based on Firestore data
      } else {
        auth.signOut();
        navigate("/login");
      }
    };
    checkAccess();
  }, [user, navigate]);

  if (!isAuthorized) return null;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">
        <img src="/icons/dashboard.png" alt="Dashboard" className="dashboard-icon" />
        Dashboard
      </h2>

      <div className="dashboard-grid navigation-bar">
        {/* Show "Grant Access" card only for Admins */}
        {/* {isAdmin && (
          <Link to="/grant-access" className="dashboard-card">
            <div className="icon-container">
              <img src="/icons/admin-icon.jpg" alt="Admin Access" />
            </div>
            <h5>Grant Access</h5>
          </Link>
        )} */}

        {/* Render other dashboard items */}
        {dashboardItems.map((item, index) => (
          <Link key={index} to={item.path} className="dashboard-card">
            <div className="icon-container">
              <img src={item.icon} alt={item.title} />
            </div>
            <h5>{item.title}</h5>
          </Link>
        ))}
      </div>
    </div>
  );
};

// Define Dashboard Items
const dashboardItems = [
  { path: "/milk-rates", icon: "/icons/rupee-icon.png", title: "Set Milk Rates" },
  { path: "/customers", icon: "/icons/customers-icon.png", title: "Customers" },
  { path: "/milk-sales", icon: "/icons/milkmansellingmilk.jpg", title: "Add Milk Sales" },
  { path: "/branches", icon: "/icons/map-icon.png", title: "Branches" },
  { path: "/societies", icon: "/icons/building-icon.png", title: "Societies" },
  { path: "/payments", icon: "/icons/money-bag-icon.png", title: "Payments" },
  { path: "/generate-invoice", icon: "/icons/invoice-icon.jpg", title: "Generate Invoice" },
  { path: "/invoice", icon: "/icons/bill-icon.jpg", title: "View Bills" },
  { path: "/grant-access", icon: "/icons/admin-icon.jpg", title: "Grant Access " },
  { path: "/admin-users", icon: "/icons/admin-users.png", title: "Admin Users" },
];

export default Dashboard;