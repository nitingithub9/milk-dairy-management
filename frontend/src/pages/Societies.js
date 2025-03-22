import React, { useState, useEffect } from "react";
import { database, ref, set, get, push, remove } from "../firebaseConfig";
import "./Societies.css"; // Ensure to style properly

function Societies() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [societyName, setSocietyName] = useState("");
  const [societies, setSocieties] = useState([]);
  const [editingSociety, setEditingSociety] = useState(null);
  const [editedSocietyName, setEditedSocietyName] = useState("");

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

  useEffect(() => {
    if (!selectedBranch) return;
    const fetchSocieties = async () => {
      const societiesRef = ref(database, `societies/${selectedBranch}`);
      const snapshot = await get(societiesRef);
      if (snapshot.exists()) {
        setSocieties(Object.entries(snapshot.val() || {}).map(([id, name]) => ({ id, name })));
      } else {
        setSocieties([]);
      }
    };
    fetchSocieties();
  }, [selectedBranch]);

  const handleAddSociety = async (e) => {
    e.preventDefault();
    if (!selectedBranch) return alert("⚠️ Please select a branch first!");
    if (!societyName.trim()) return alert("❌ Society name cannot be empty!");

    const societiesRef = ref(database, `societies/${selectedBranch}`);
    const newSocietyRef = push(societiesRef);
    await set(newSocietyRef, societyName);

    setSocieties([...societies, { id: newSocietyRef.key, name: societyName }]);
    setSocietyName("");
    alert("✅ Society added successfully!");
  };

  const handleDeleteSociety = async (id, name) => {
    const confirmDelete = window.confirm(`⚠️ Are you sure you want to delete society: ${name}?`);
    if (!confirmDelete) return;

    const societyRef = ref(database, `societies/${selectedBranch}/${id}`);
    await remove(societyRef);

    setSocieties(societies.filter((society) => society.id !== id));
    alert("❌ Society deleted successfully!");
  };

  const handleEditSociety = (society) => {
    setEditingSociety(society.id);
    setEditedSocietyName(society.name);
  };

  const handleSaveEdit = async (id) => {
    if (!editedSocietyName.trim()) {
      alert("❌ Society name cannot be empty!");
      return;
    }

    const societyRef = ref(database, `societies/${selectedBranch}/${id}`);
    await set(societyRef, editedSocietyName);

    setSocieties(
      societies.map((society) =>
        society.id === id ? { ...society, name: editedSocietyName } : society
      )
    );
    setEditingSociety(null);
    alert("✏️ Society updated successfully!");
  };

  return (
    <div className="societies-container">
      <div className="societies-card">
        <h2 className="title">
          <img src="/icons/building-icon.png" alt="Manage Societies" className="icon" />
          Manage Societies
        </h2>

        {/* Branch Selection */}
        <select className="dropdown" onChange={(e) => setSelectedBranch(e.target.value)} value={selectedBranch}>
          <option value="">Select a Branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>

        {/* Add Society Form */}
        {selectedBranch && (
          <form onSubmit={handleAddSociety} className="form-container">
            <input
              type="text"
              className="form-input"
              placeholder="Enter society name"
              value={societyName}
              onChange={(e) => setSocietyName(e.target.value)}
              required
            />
            <button type="submit" className="submit-btn">Add Society</button>
          </form>
        )}

        {/* List Societies */}
        <div className="list-container">
          {societies.map((society) => (
            <div key={society.id} className="list-item">
              {editingSociety === society.id ? (
                <>
                  <input
                    type="text"
                    className="form-input edit-input"
                    value={editedSocietyName}
                    onChange={(e) => setEditedSocietyName(e.target.value)}
                  />
                  <button className="save-btn" onClick={() => handleSaveEdit(society.id)}>Save</button>
                </>
              ) : (
                <>
                  <span>{society.name}</span>
                  <div className="btn-group">
                    <button className="edit-btn" onClick={() => handleEditSociety(society)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDeleteSociety(society.id, society.name)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Societies;
