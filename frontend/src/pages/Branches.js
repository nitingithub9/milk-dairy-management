import React, { useState, useEffect } from "react";
import { database, ref, set, get, push, remove } from "../firebaseConfig";
import "./Branches.css"; // Import styles

function Branches() {
  const [branchName, setBranchName] = useState("");
  const [branches, setBranches] = useState([]);
  const [editingBranch, setEditingBranch] = useState(null);
  const [editedBranchName, setEditedBranchName] = useState("");

  // Fetch branches from Firebase on load
  useEffect(() => {
    const fetchBranches = async () => {
      const branchesRef = ref(database, "branches");
      const snapshot = await get(branchesRef);
      if (snapshot.exists()) {
        setBranches(Object.entries(snapshot.val() || {}).map(([id, name]) => ({ id, name })));
      }
    };
    fetchBranches();
  }, []);

  // Handle adding a new branch
  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!branchName.trim()) return alert("❌ Branch name cannot be empty!");

    const branchesRef = ref(database, "branches");
    const newBranchRef = push(branchesRef);
    await set(newBranchRef, branchName);

    setBranches([...branches, { id: newBranchRef.key, name: branchName }]);
    setBranchName("");
    alert("✅ Branch added successfully!");
  };

  // Handle deleting a branch with confirmation
  const handleDeleteBranch = async (id, name) => {
    const confirmDelete = window.confirm(`⚠️ Are you sure you want to delete branch: ${name}?`);
    if (!confirmDelete) return;

    const branchRef = ref(database, `branches/${id}`);
    await remove(branchRef);

    setBranches(branches.filter((branch) => branch.id !== id));
    alert("❌ Branch deleted successfully!");
  };

  // Enable edit mode for a branch
  const handleEditBranch = (branch) => {
    setEditingBranch(branch.id);
    setEditedBranchName(branch.name);
  };

  // Save updated branch name to Firebase
  const handleSaveEdit = async (id) => {
    if (!editedBranchName.trim()) {
      alert("❌ Branch name cannot be empty!");
      return;
    }

    const branchRef = ref(database, `branches/${id}`);
    await set(branchRef, editedBranchName);

    setBranches(
      branches.map((branch) =>
        branch.id === id ? { ...branch, name: editedBranchName } : branch
      )
    );
    setEditingBranch(null);
    alert("✏️ Branch updated successfully!");
  };

  return (
    <div className="manage-branches-container">
      {/* Title */}
      <h2 className="manage-branches-title">
        <img src="/icons/map-icon.png" alt="Manage Branches" width="40" />
        Manage Branches
      </h2>

      {/* Add Branch Form */}
      <div className="branches-card">
        <form onSubmit={handleAddBranch} className="branch-form">
          <input
            type="text"
            className="branch-input"
            placeholder="Enter branch name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
          />
          <button type="submit" className="add-branch-btn">Add Branch</button>
        </form>

        {/* Branch List */}
        <div className="branch-list-box">
          <ul className="list-group">
            {branches.map((branch) => (
              <li key={branch.id} className="list-group-item">
                {editingBranch === branch.id ? (
                  <>
                    <input
                      type="text"
                      className="form-control"
                      value={editedBranchName}
                      onChange={(e) => setEditedBranchName(e.target.value)}
                    />
                    <button className="btn btn-success" onClick={() => handleSaveEdit(branch.id)}>Save</button>
                  </>
                ) : (
                  <>
                    {branch.name}
                    <div className="branch-actions">
                      <button className="btn btn-warning" onClick={() => handleEditBranch(branch)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDeleteBranch(branch.id, branch.name)}>Delete</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Branches;
