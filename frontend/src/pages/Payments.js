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
  const [totalAmountToBePaid, setTotalAmountToBePaid] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentInput, setPaymentInput] = useState("");

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
    if (!selectedBranch) {
      setSocieties([]);
      setSelectedSociety("");
      return;
    }

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
    if (!selectedSociety) {
      setCustomers([]);
      setSelectedCustomer("");
      return;
    }

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

  // Reset payment details when customer or month changes
  useEffect(() => {
    if (!selectedCustomer || !selectedMonth) {
      setTotalAmount(0);
      setTotalAmountToBePaid(0);
      setPendingAmount(0);
      setAdvanceAmount(0);
      setPaidAmount(0);
      return;
    }
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
    calculateTotalToBePaid(total);
  };

  // Calculate total amount to be paid
  const calculateTotalToBePaid = (currentMonthTotal) => {
    if (!selectedCustomer || !selectedMonth) return;

    const fetchBalances = async () => {
      // Get previous month's balances
      const prevMonth = new Date(new Date(selectedMonth).setMonth(new Date(selectedMonth).getMonth() - 1));
      const prevMonthFormatted = new Date(prevMonth).toISOString().slice(0, 7);
      
      const prevPaymentSnapshot = await get(ref(database, `payments/${selectedCustomer}/${prevMonthFormatted}`));
      
      let prevPending = 0;
      let prevAdvance = 0;
      
      if (prevPaymentSnapshot.exists()) {
        prevPending = prevPaymentSnapshot.val().pendingBalance || 0;
        prevAdvance = prevPaymentSnapshot.val().advanceBalance || 0;
      }
      
      // Get current month's payment if exists
      const currentPaymentSnapshot = await get(ref(database, `payments/${selectedCustomer}/${selectedMonth}`));
      let currentPaid = 0;
      
      if (currentPaymentSnapshot.exists()) {
        currentPaid = currentPaymentSnapshot.val().paidAmount || 0;
      }
      
      // Calculate total to be paid (current month sales + previous pending - previous advance)
      const totalToBePaid = currentMonthTotal + prevPending - prevAdvance;
      
      // Update state
      setPendingAmount(prevPending);
      setAdvanceAmount(prevAdvance);
      setPaidAmount(currentPaid);
      setTotalAmountToBePaid(totalToBePaid);
    };
    
    fetchBalances();
  };

  // Record Payment Functionality
  const recordPayment = async () => {
    const paymentToAdd = parseFloat(paymentInput);
    if (isNaN(paymentToAdd) || paymentToAdd <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    // Check if payment already exists for this month
    const paymentSnapshot = await get(ref(database, `payments/${selectedCustomer}/${selectedMonth}`));
    if (paymentSnapshot.exists() && paymentSnapshot.val().paidAmount > 0) {
      alert("Only one payment can be recorded per month");
      return;
    }

    const newPaidAmount = paidAmount + paymentToAdd;
    const remainingAmount = totalAmountToBePaid - newPaidAmount;

    let newAdvanceBalance = 0;
    let newPendingBalance = 0;
    let status = "Pending";

    if (remainingAmount < 0) {
      // Paid more than required (advance)
      newAdvanceBalance = Math.abs(remainingAmount);
      status = "Paid";
    } else if (remainingAmount > 0) {
      // Paid less than required (pending)
      newPendingBalance = remainingAmount;
    } else {
      // Paid exactly the required amount
      status = "Paid";
    }

    // Update state
    setPendingAmount(newPendingBalance);
    setAdvanceAmount(newAdvanceBalance);
    setPaidAmount(newPaidAmount);

    // Save to database
    await set(ref(database, `payments/${selectedCustomer}/${selectedMonth}`), {
      pendingBalance: newPendingBalance,
      advanceBalance: newAdvanceBalance,
      paidAmount: newPaidAmount,
      status,
      timestamp: new Date().toISOString()
    });

    alert("Payment recorded successfully!");
    setPaymentInput("");
  };

  return (
    <div className="payments-container">
      <div className="payments-card">
        <h2 className="title">💰 Manage Payments</h2>

        {/* Branch Dropdown */}
        <select 
          className="dropdown" 
          onChange={(e) => setSelectedBranch(e.target.value)} 
          value={selectedBranch}
        >
          <option value="">Select a Branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>

        {/* Society Dropdown */}
        <select 
          className="dropdown" 
          onChange={(e) => setSelectedSociety(e.target.value)} 
          value={selectedSociety}
          disabled={!selectedBranch}
        >
          <option value="">Select a Society</option>
          {societies.map((society) => (
            <option key={society.id} value={society.id}>{society.name}</option>
          ))}
        </select>

        {/* Customer Dropdown */}
        <select 
          className="dropdown" 
          onChange={(e) => setSelectedCustomer(e.target.value)} 
          value={selectedCustomer}
          disabled={!selectedSociety}
        >
          <option value="">Select a Customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>

        {/* Month Selector */}
        <input 
          type="month" 
          className="dropdown" 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)} 
        />

        {/* Calculate Total Button */}
        <button 
          className="btn btn-primary" 
          onClick={calculateTotalAmount}
          disabled={!selectedCustomer}
        >
          Calculate Total
        </button>

        {/* Payment Summary */}
        <div className="summary">
          <div className="summary-item">Total Sales Amount: ₹{totalAmount.toFixed(2)}</div>
          <div className="summary-item">Total Amount to Be Paid: ₹{totalAmountToBePaid.toFixed(2)}</div>
          <div className="summary-item">Pending Balance: ₹{pendingAmount.toFixed(2)}</div>
          <div className="summary-item">Advance Balance: ₹{advanceAmount.toFixed(2)}</div>
          <div className="summary-item">Total Paid: ₹{paidAmount.toFixed(2)}</div>
        </div>

        {/* Payment Input */}
        <input 
          type="number" 
          className="form-input" 
          placeholder="Enter Paid Amount" 
          value={paymentInput} 
          onChange={(e) => setPaymentInput(e.target.value)}
          disabled={!selectedCustomer || totalAmountToBePaid <= 0}
        />

        {/* Record Payment Button */}
        <button 
          className="btn btn-success" 
          onClick={recordPayment}
          disabled={!paymentInput || !selectedCustomer || totalAmountToBePaid <= 0}
        >
          Record Payment
        </button>
      </div>
    </div>
  );
}

export default Payments;