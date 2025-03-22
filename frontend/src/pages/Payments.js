import React, { useState, useEffect } from "react";
import { database, ref, set, get } from "../firebaseConfig";
import "./Payments.css";

function Payments() {
  // State for dropdown selections
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // State for payment details
  const [totalAmount, setTotalAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("N/A");
  const [paymentInput, setPaymentInput] = useState("");

  useEffect(() => {
    document.body.style.overflow = "auto"; // Allow scrolling on this page only
    return () => {
      document.body.style.overflow = "hidden"; // Reset when leaving
    };
  }, []);

  // Fetch Branches
  useEffect(() => {
    const fetchBranches = async () => {
      const snapshot = await get(ref(database, "branches"));
      if (snapshot.exists()) {
        setBranches(Object.entries(snapshot.val()).map(([id, name]) => ({ id, name })));
      }
    };
    fetchBranches();
  }, []);

  // Fetch Societies based on selected branch
  useEffect(() => {
    if (!selectedBranch) return setSocieties([]);
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

  // Fetch Customers based on selected society
  useEffect(() => {
    if (!selectedSociety) return setCustomers([]);
    const fetchCustomers = async () => {
      const snapshot = await get(ref(database, `customers/${selectedBranch}/${selectedSociety}`));
      if (snapshot.exists()) {
        setCustomers(Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })));
      } else {
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, [selectedSociety, selectedBranch]);

  // Fetch Payment Details
  useEffect(() => {
    if (!selectedCustomer || !selectedMonth) return;

    const fetchPaymentDetails = async () => {
      const snapshot = await get(ref(database, `payments/${selectedCustomer}/${selectedMonth}`));

      if (snapshot.exists()) {
        const { pendingBalance = 0, advanceBalance = 0, paidAmount = 0, status = "N/A" } = snapshot.val();
        setPendingAmount(pendingBalance);
        setAdvanceAmount(advanceBalance);
        setPaidAmount(paidAmount);
        setPaymentStatus(status);
      } else {
        setPendingAmount(0);
        setAdvanceAmount(0);
        setPaidAmount(0);
        setPaymentStatus("N/A");
      }
    };

    fetchPaymentDetails();
  }, [selectedCustomer, selectedMonth]);

  // Calculate Total Sales Amount
  const calculateTotalAmount = async () => {
    if (!selectedCustomer || !selectedMonth) return;

    const snapshot = await get(ref(database, `sales/${selectedCustomer}/${selectedMonth}`));
    let total = 0;
    if (snapshot.exists()) {
      Object.values(snapshot.val()).forEach((sale) => {
        total += sale.amount || 0;
      });
    }
    setTotalAmount(total);
  };

  // Record Payment Functionality
  const recordPayment = async () => {
    const paymentToAdd = parseFloat(paymentInput);
    if (isNaN(paymentToAdd) || paymentToAdd <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    const newPaidAmount = paidAmount + paymentToAdd;
    let newPendingBalance = totalAmount + pendingAmount - advanceAmount - newPaidAmount;
    let newAdvanceBalance = newPendingBalance < 0 ? Math.abs(newPendingBalance) : 0;
    newPendingBalance = newPendingBalance > 0 ? newPendingBalance : 0;
    const status = newPendingBalance === 0 ? "Paid" : "Pending";

    setPendingAmount(newPendingBalance);
    setAdvanceAmount(newAdvanceBalance);
    setPaidAmount(newPaidAmount);
    setPaymentStatus(status);

    await set(ref(database, `payments/${selectedCustomer}/${selectedMonth}`), {
      pendingBalance: newPendingBalance,
      advanceBalance: newAdvanceBalance,
      paidAmount: newPaidAmount,
      status
    });

    alert("Payment recorded successfully!");
    setPaymentInput("");
  };

  return (
    <div className="payments-container">
      <div className="payments-card">
        
        {/* Move title inside the card */}
        <h2 className="title">💰 Manage Payments</h2>
  
        <select className="dropdown" onChange={(e) => setSelectedBranch(e.target.value)} value={selectedBranch}>
          <option value="">Select a Branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
  
        <input type="month" className="dropdown" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
  
        <button className="btn btn-primary" onClick={calculateTotalAmount}>Calculate Total</button>
  
        <div className="summary">
          <div className="summary-item">Total Amount: ₹{totalAmount}</div>
          <div className="summary-item">Pending Balance: ₹{pendingAmount}</div>
          <div className="summary-item">Advance Balance: ₹{advanceAmount}</div>
          <div className="summary-item">Total Paid: ₹{paidAmount}</div>
          <div className="summary-item"><strong>Status:</strong> {paymentStatus}</div>
        </div>
  
        <input type="number" className="form-input" placeholder="Enter Payment Amount" value={paymentInput} onChange={(e) => setPaymentInput(e.target.value)} />
  
        <button className="btn btn-success" onClick={recordPayment}>Record Payment</button>
  
      </div> 
    </div> 
  );  
}

export default Payments;
