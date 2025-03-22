import React, { useState, useEffect } from "react";
import { database, ref, get } from "../firebaseConfig";
import "./Invoice.css"; // Ensure you create this CSS file

function Invoice() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [billData, setBillData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [advanceBalance, setAdvanceBalance] = useState(0);
  const [error, setError] = useState(null);

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const snapshot = await get(ref(database, "branches"));
        if (snapshot.exists()) {
          const branchesData = Object.entries(snapshot.val()).map(([id, name]) => ({ id, name }));
          setBranches(branchesData);
        } else {
          setError("No branches found in the database.");
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        setError("Failed to fetch branches. Please try again.");
      }
    };
    fetchBranches();
  }, []);

  // Fetch societies when a branch is selected
  useEffect(() => {
    if (!selectedBranch) return;
    const fetchSocieties = async () => {
      try {
        const snapshot = await get(ref(database, `societies/${selectedBranch}`));
        if (snapshot.exists()) {
          const societiesData = Object.entries(snapshot.val()).map(([id, name]) => ({ id, name }));
          setSocieties(societiesData);
        } else {
          setSocieties([]);
          setError("No societies found for the selected branch.");
        }
      } catch (error) {
        console.error("Error fetching societies:", error);
        setError("Failed to fetch societies. Please try again.");
      }
    };
    fetchSocieties();
  }, [selectedBranch]);

  // Fetch customers when a society is selected
  useEffect(() => {
    if (!selectedSociety) return;
    const fetchCustomers = async () => {
      try {
        const snapshot = await get(ref(database, `customers/${selectedBranch}/${selectedSociety}`));
        if (snapshot.exists()) {
          const customersData = Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
          setCustomers(customersData);
        } else {
          setCustomers([]);
          setError("No customers found for the selected society.");
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        setError("Failed to fetch customers. Please try again.");
      }
    };
    fetchCustomers();
  }, [selectedSociety]);

  // Fetch bill data when "Fetch Bill" is clicked
  const fetchBillData = async () => {
    if (!selectedCustomer || !startDate || !endDate) {
      return alert("Please select a customer and specify a date range.");
    }

    try {
      let salesTotal = 0;
      let paymentsTotal = 0;
      let pendingBalanceTotal = 0;
      let advanceBalanceTotal = 0;
      const billDetails = [];

      // Iterate through each month in the date range
      let currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

        // Fetch sales data for the month
        const salesRef = ref(database, `sales/${selectedCustomer}/${monthKey}`);
        const salesSnapshot = await get(salesRef);
        if (salesSnapshot.exists()) {
          const salesData = salesSnapshot.val();
          Object.entries(salesData).forEach(([date, sale]) => {
            if (date >= startDate && date <= endDate) {
              salesTotal += sale.amount || 0;
              billDetails.push({
                date,
                type: "Sale",
                description: `${sale.quantity}L ${sale.milkType} Milk`,
                amount: sale.amount,
              });
            }
          });
        }

        // Fetch payment data for the month
        const paymentsRef = ref(database, `payments/${selectedCustomer}/${monthKey}`);
        const paymentsSnapshot = await get(paymentsRef);
        if (paymentsSnapshot.exists()) {
          const paymentsData = paymentsSnapshot.val();
          console.log("Payment Data:", paymentsData); // Debugging: Log payment data
          paymentsTotal += paymentsData.paidAmount || 0;
          pendingBalanceTotal += paymentsData.pendingBalance || 0;
          advanceBalanceTotal += paymentsData.advanceBalance || 0;
        }

        // Move to the next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Update state with fetched data
      setBillData(billDetails);
      setTotalSales(salesTotal);
      setTotalPayments(paymentsTotal);
      setPendingBalance(pendingBalanceTotal);
      setAdvanceBalance(advanceBalanceTotal);
      setError(null);
    } catch (error) {
      console.error("Error fetching bill data:", error);
      setError("Failed to fetch bill data. Please try again.");
    }
  };

  return (
    <div className="viewbill-container">
      <div className="viewbill-card">
        <h2 className="text-center mb-4">📜 View Bills (Admin)</h2>
        {error && <div className="alert alert-danger">{error}</div>}
  
        {/* Branch Selection */}
        <select className="form-select mb-3" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
          <option value="">Select a Branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
  
        {/* Society Selection */}
        <select className="form-select mb-3" value={selectedSociety} onChange={(e) => setSelectedSociety(e.target.value)} disabled={!selectedBranch}>
          <option value="">Select a Society</option>
          {societies.map((society) => (
            <option key={society.id} value={society.id}>{society.name}</option>
          ))}
        </select>
  
        {/* Customer Selection */}
        <select className="form-select mb-3" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} disabled={!selectedSociety}>
          <option value="">Select a Customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name} ({customer.phone})</option>
          ))}
        </select>
  
        {/* Date Range Selection */}
        <div className="row mb-3">
          <div className="col">
            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start Date" />
          </div>
          <div className="col">
            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End Date" />
          </div>
        </div>
  
        {/* Fetch Bill Button */}
        <button className="btn btn-primary w-100 mb-4" onClick={fetchBillData}>
          Fetch Bill
        </button>
  
        {/* Bill Details */}
        {billData.length > 0 && (
          <div className="mt-4">
            <h4>Bill Details</h4>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {billData.map((bill, index) => (
                  <tr key={index}>
                    <td>{bill.date}</td>
                    <td>{bill.type}</td>
                    <td>{bill.description}</td>
                    <td>{bill.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
  
            {/* Summary */}
            <div className="alert alert-info">
              <p><strong>Total Sales:</strong> ₹{totalSales.toFixed(2)}</p>
              <p><strong>Total Payments:</strong> ₹{totalPayments.toFixed(2)}</p>
              <p><strong>Pending Balance:</strong> ₹{pendingBalance.toFixed(2)}</p>
              <p><strong>Advance Balance:</strong> ₹{advanceBalance.toFixed(2)}</p>
              <p><strong>Net Balance:</strong> ₹{(totalSales - totalPayments).toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default Invoice  