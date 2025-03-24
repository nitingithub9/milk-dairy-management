import React, { useState, useEffect } from "react";
import { database, ref, set, get, remove } from "../firebaseConfig";
import "./Customers.css"; // Importing CSS file for styling

function Customers() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [milkType, setMilkType] = useState("Cow");
  const [editCustomerId, setEditCustomerId] = useState(null);
  const [editedCustomerName, setEditedCustomerName] = useState("");
  const [editedCustomerPhone, setEditedCustomerPhone] = useState("");
  const [editedMilkType, setEditedMilkType] = useState("");

  // Fetch branches
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

  // Fetch societies when branch is selected
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

  // Fetch customers when society is selected
  useEffect(() => {
    if (!selectedSociety) return;
    const fetchCustomers = async () => {
      const customersRef = ref(database, `customers/${selectedBranch}/${selectedSociety}`);
      const snapshot = await get(customersRef);
      if (snapshot.exists()) {
        setCustomers(Object.entries(snapshot.val() || {}).map(([id, data]) => ({ id, ...data })));
      } else {
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, [selectedBranch, selectedSociety]);

  // Handle adding a customer
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!selectedBranch || !selectedSociety) return alert("❌ Please select a branch and society first!");
    if (!customerName.trim() || customerPhone.length !== 10) return alert("❌ Invalid Name or Phone Number!");

    const formattedName = customerName.trim().replace(/\s+/g, "_");
    const customersRef = ref(database, `customers/${selectedBranch}/${selectedSociety}/${formattedName}`);
    await set(customersRef, { name: customerName, phone: customerPhone, milkType });

    setCustomers([...customers, { id: formattedName, name: customerName, phone: customerPhone, milkType }]);
    setCustomerName("");
    setCustomerPhone("");
    setMilkType("Cow");
    alert("✅ Customer added successfully!");
  };

  // Enable Edit Mode
  const handleEditCustomer = (customer) => {
    setEditCustomerId(customer.id);
    setEditedCustomerName(customer.name);
    setEditedCustomerPhone(customer.phone);
    setEditedMilkType(customer.milkType);
  };

  // Save Edited Customer
  const handleSaveEdit = async () => {
    if (!editedCustomerName.trim() || editedCustomerPhone.length !== 10) return alert("❌ Invalid Name or Phone Number!");

    const customerRef = ref(database, `customers/${selectedBranch}/${selectedSociety}/${editCustomerId}`);
    await set(customerRef, { name: editedCustomerName, phone: editedCustomerPhone, milkType: editedMilkType });

    setCustomers(
      customers.map((customer) =>
        customer.id === editCustomerId
          ? { ...customer, name: editedCustomerName, phone: editedCustomerPhone, milkType: editedMilkType }
          : customer
      )
    );
    setEditCustomerId(null);
    alert("✅ Customer details updated successfully!");
  };

  // Delete Customer
  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`⚠️ Delete customer: ${name}?`)) return;

    const customerRef = ref(database, `customers/${selectedBranch}/${selectedSociety}/${id}`);
    await remove(customerRef);
    setCustomers(customers.filter((customer) => customer.id !== id));
    alert("❌ Customer deleted successfully!");
  };

  return (
    <div className="customers-container">
      <div className="customers-card">
        <h2 className="title">🧑‍🤝‍🧑 Manage Customers</h2>

        <select className="dropdown" onChange={(e) => setSelectedBranch(e.target.value)} value={selectedBranch}>
          <option value="">Select a Branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>

        {selectedBranch && (
          <select className="dropdown" onChange={(e) => setSelectedSociety(e.target.value)} value={selectedSociety}>
            <option value="">Select a Society</option>
            {societies.map((society) => (
              <option key={society.id} value={society.id}>{society.name}</option>
            ))}
          </select>
        )}

        <form onSubmit={handleAddCustomer} className="customer-form">
          <input type="text" className="form-input" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          <input type="text" className="form-input" placeholder="Phone Number (10 digits)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
          <select className="dropdown" value={milkType} onChange={(e) => setMilkType(e.target.value)}>
            <option value="Cow">Cow Milk</option>
            <option value="Buffalo">Buffalo Milk</option>
          </select>
          <button type="submit" className="submit-btn">Add Customer</button>
        </form>

        <ul className="list-group">
          {customers.map((customer) => (
            <li key={customer.id} className="list-group-item">
              {editCustomerId === customer.id ? (
                <>
                  <input type="text" className="form-input" value={editedCustomerName} onChange={(e) => setEditedCustomerName(e.target.value)} />
                  <input type="text" className="form-input" value={editedCustomerPhone} onChange={(e) => setEditedCustomerPhone(e.target.value)} />
                  <select className="dropdown" value={editedMilkType} onChange={(e) => setEditedMilkType(e.target.value)}>
                    <option value="Cow">Cow Milk</option>
                    <option value="Buffalo">Buffalo Milk</option>
                  </select>
                  {/* <button className="btn-save" onClick={handleSaveEdit}>Save</button> */}
                  <div className="save-button-container">
                    <button className="btn-save" onClick={handleSaveEdit}>Save</button>
                  </div>

                </>
              ) : (
                <>
                  {customer.name} ({customer.phone}) - {customer.milkType}
                  <div className="customer-actions">
                    <button className="btn-edit" onClick={() => handleEditCustomer(customer)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDeleteCustomer(customer.id, customer.name)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Customers;
