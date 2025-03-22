import React, { useEffect, useState } from "react";
import { database, ref, get, remove } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import "./AdminUsers.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [deleteMessage, setDeleteMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = ref(database, "approved_users");
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const usersArray = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setUsers(usersArray);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id, email) => {
    // Confirm deletion
    const confirmDelete = window.confirm(`Are you sure you want to delete ${email}?`);
    if (!confirmDelete) return;

    try {
      await remove(ref(database, `approved_users/${id}`));
      setUsers(users.filter((user) => user.id !== id));
      setDeleteMessage(`✅ ${email} has been successfully deleted.`);
      setTimeout(() => setDeleteMessage(""), 3000); // Clear message after 3 seconds
    } catch (error) {
      console.error("Error deleting user:", error);
      setDeleteMessage("❌ Failed to delete user. Please try again.");
    }
  };

  return (
    <div className="admin-users-container">
      <div className="users-box">
        <h2>Admin Users</h2>
        {deleteMessage && <p className="delete-message">{deleteMessage}</p>}
        <div className="user-header">
          <span>Email</span>
          <span>Role</span>
          <span>Action</span>
        </div>
        {users.map((user) => (
          <div key={user.id} className="user-row">
            <span>{user.email}</span>
            <span>{user.isAdmin ? "Admin" : "User"}</span>
            <button onClick={() => handleDelete(user.id, user.email)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;  