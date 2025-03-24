import React, { useState, useEffect } from "react";
import { database, ref, set, get, remove } from "../firebaseConfig";
import "./MilkSales.css"; // Import CSS file for styling

function MilkSales() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [milkType] = useState("Cow");
  const [quantity, setQuantity] = useState("");
  const [ratePerLiter] = useState(50);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sales, setSales] = useState({});
  const [editingSale, setEditingSale] = useState(null);
  const [editedQuantity, setEditedQuantity] = useState("");
  const [expandedMonth, setExpandedMonth] = useState(null);

  useEffect(() => {
    const fetchBranches = async () => {
      const snapshot = await get(ref(database, "branches"));
      if (snapshot.exists()) {
        setBranches(Object.entries(snapshot.val()).map(([id, name]) => ({ id, name })));
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;
    const fetchSocieties = async () => {
      const snapshot = await get(ref(database, `societies/${selectedBranch}`));
      if (snapshot.exists()) {
        setSocieties(Object.entries(snapshot.val()).map(([id, name]) => ({ id, name })));
      } else {
        setSocieties([]);
      }
    };
    fetchSocieties();
  }, [selectedBranch]);

  useEffect(() => {
    if (!selectedSociety) return;
    const fetchCustomers = async () => {
      const snapshot = await get(ref(database, `customers/${selectedBranch}/${selectedSociety}`));
      if (snapshot.exists()) {
        setCustomers(Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })));
      } else {
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, [selectedBranch, selectedSociety]);

  useEffect(() => {
    if (!selectedCustomer) {
      setSales({});
      return;
    }
    const fetchSales = async () => {
      const snapshot = await get(ref(database, `sales/${selectedCustomer}`));
      if (snapshot.exists()) {
        setSales(snapshot.val());
      } else {
        setSales({});
      }
    };
    fetchSales();
  }, [selectedCustomer]);

  const handleAddSale = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return alert("❌ Please select a customer first!");

    const month = date.slice(0, 7);
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return alert("❌ Quantity must be greater than 0!");
    const saleAmount = qty * ratePerLiter;

    const saleRef = ref(database, `sales/${selectedCustomer}/${month}/${date}`);
    await set(saleRef, { milkType, quantity: qty, amount: saleAmount });

    setSales((prevSales) => ({
      ...prevSales,
      [month]: {
        ...(prevSales[month] || {}),
        [date]: { milkType, quantity: qty, amount: saleAmount },
      },
    }));

    setQuantity("");
    alert("✅ Sale entry added successfully!");
  };

  const handleEditSale = (month, saleDate, sale) => {
    setEditingSale({ month, saleDate });
    setEditedQuantity(sale.quantity);
  };

  const handleSaveEdit = async () => {
    const { month, saleDate } = editingSale;
    const qty = parseFloat(editedQuantity);
    if (isNaN(qty) || qty <= 0) return alert("❌ Quantity must be greater than 0!");
    const saleAmount = qty * ratePerLiter;

    const saleRef = ref(database, `sales/${selectedCustomer}/${month}/${saleDate}`);
    await set(saleRef, { milkType, quantity: qty, amount: saleAmount });

    setSales((prevSales) => ({
      ...prevSales,
      [month]: {
        ...(prevSales[month] || {}),
        [saleDate]: { milkType, quantity: qty, amount: saleAmount },
      },
    }));

    setEditingSale(null);
    alert("✏️ Sale entry updated successfully!");
  };

  const handleDeleteSale = async (month, saleDate) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this sale?")) return;
    const saleRef = ref(database, `sales/${selectedCustomer}/${month}/${saleDate}`);
    await remove(saleRef);

    setSales((prevSales) => {
      const updatedSales = { ...prevSales };
      delete updatedSales[month][saleDate];
      if (Object.keys(updatedSales[month] || {}).length === 0) {
        delete updatedSales[month];
      }
      return updatedSales;
    });

    alert("❌ Sale entry deleted successfully!");
  };

  return (
    <div className="sales-container">
      <div className="sales-card">
        <h2 className="title">
          <img src="/icons/milkmansellingmilk.jpg" alt="Milk Sales" className="icon" />
          Manage Milk Sales
        </h2>

        <select className="dropdown" onChange={(e) => setSelectedBranch(e.target.value)} value={selectedBranch}>
          <option value="">Select a Branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>

        <select className="dropdown" onChange={(e) => setSelectedSociety(e.target.value)} value={selectedSociety}>
          <option value="">Select a Society</option>
          {societies.map((society) => (
            <option key={society.id} value={society.id}>{society.name}</option>
          ))}
        </select>

        <select className="dropdown" onChange={(e) => setSelectedCustomer(e.target.value)} value={selectedCustomer}>
          <option value="">Select a Customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name} ({customer.phone})</option>
          ))}
        </select>

        <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="number" className="input-field" placeholder="Enter Milk Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />

        <button className="add-btn" onClick={handleAddSale}>Add Sale</button>

        {Object.keys(sales).map((month) => (
          <div key={month} className="month-container">
            <h4 className="month-header" onClick={() => setExpandedMonth(expandedMonth === month ? null : month)}>
              {month}
            </h4>
            {expandedMonth === month && (
              <ul className="list-group">
                {Object.entries(sales[month] || {}).map(([saleDate, sale]) => (
                  <li key={saleDate} className="sale-entry">
                    {editingSale?.saleDate === saleDate ? (
                      <>
                        <input type="number" value={editedQuantity} onChange={(e) => setEditedQuantity(e.target.value)} />
                        <button className="save-btn" onClick={handleSaveEdit}>Save</button>
                      </>
                    ) : (
                      <>
                        {saleDate} – {sale.milkType} – {sale.quantity}L – ₹{sale.amount}
                        <button className="edit-btn" onClick={() => handleEditSale(month, saleDate, sale)}>Edit</button>
                        <button className="delete-btn" onClick={() => handleDeleteSale(month, saleDate)}>Delete</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MilkSales;
