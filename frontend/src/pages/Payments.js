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
  const [totalAmount, setTotalAmount] = useState(0); // Total sales amount
  const [totalAmountToBePaid, setTotalAmountToBePaid] = useState(0); // Total amount to be paid (after adjustments)
  const [pendingAmount, setPendingAmount] = useState(0); // Pending balance from previous month
  const [advanceAmount, setAdvanceAmount] = useState(0); // Advance balance from previous month
  const [paidAmount, setPaidAmount] = useState(0); // Paid amount in the current month
  // const [paymentStatus, setPaymentStatus] = useState("N/A"); // Payment status
  const [paymentInput, setPaymentInput] = useState(""); // Input for paid amount

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
      setSocieties([]); // Reset societies if no branch is selected
      return;
    }

    const fetchSocieties = async () => {
      const snapshot = await get(ref(database, `societies/${selectedBranch}`));
      if (snapshot.exists()) {
        setSocieties(Object.entries(snapshot.val()).map(([id, name]) => ({ id, name })));
      } else {
        setSocieties([]); // Reset societies if no data is found
      }
    };

    fetchSocieties();
  }, [selectedBranch]);

  // Fetch Customers based on selected society
  useEffect(() => {
    if (!selectedSociety) {
      setCustomers([]); // Reset customers if no society is selected
      return;
    }

    const fetchCustomers = async () => {
      const snapshot = await get(ref(database, `customers/${selectedBranch}/${selectedSociety}`));
      if (snapshot.exists()) {
        setCustomers(Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })));
      } else {
        setCustomers([]); // Reset customers if no data is found
      }
    };

    fetchCustomers();
  }, [selectedBranch, selectedSociety]);

  // Fetch Payment Details and Previous Month's Balances
  useEffect(() => {
    if (!selectedCustomer || !selectedMonth) return;

    const fetchPaymentDetails = async () => {
      // Fetch current month's payment details
      const snapshot = await get(ref(database, `payments/${selectedCustomer}/${selectedMonth}`));

      if (snapshot.exists()) {
        const { pendingBalance = 0, advanceBalance = 0, paidAmount = 0, status = "N/A" } = snapshot.val();
        setPendingAmount(pendingBalance);
        setAdvanceAmount(advanceBalance);
        setPaidAmount(paidAmount);
        // setPaymentStatus(status);
      } else {
        // If no payment details exist for the current month, fetch the previous month's balances
        const previousMonth = new Date(new Date(selectedMonth).setMonth(new Date(selectedMonth).getMonth() - 1))
          .toISOString()
          .slice(0, 7);

        const previousMonthSnapshot = await get(ref(database, `payments/${selectedCustomer}/${previousMonth}`));

        if (previousMonthSnapshot.exists()) {
          const { pendingBalance = 0, advanceBalance = 0 } = previousMonthSnapshot.val();
          setPendingAmount(pendingBalance);
          setAdvanceAmount(advanceBalance);
        } else {
          setPendingAmount(0);
          setAdvanceAmount(0);
        }

        setPaidAmount(0);
        // setPaymentStatus("N/A");
      }

      // Calculate Total Amount to Be Paid
      const totalToBePaid = totalAmount + pendingAmount - advanceAmount;
      setTotalAmountToBePaid(totalToBePaid);
    };

    fetchPaymentDetails();
  }, [selectedCustomer, selectedMonth, totalAmount, pendingAmount, advanceAmount]);

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

    // Calculate the remaining amount after payment
    const remainingAmount = totalAmountToBePaid - newPaidAmount;

    let newAdvanceBalance = 0;
    let newPendingBalance = 0;
    let status = "Pending";

    if (remainingAmount < 0) {
      // If paid amount is more than the total amount to be paid, it's an advance
      newAdvanceBalance = Math.abs(remainingAmount);
      status = "Paid";
    } else if (remainingAmount > 0) {
      // If paid amount is less than the total amount to be paid, it's a pending balance
      newPendingBalance = remainingAmount;
    } else {
      // If paid amount is exactly the total amount to be paid
      status = "Paid";
    }

    // Update state
    setPendingAmount(newPendingBalance);
    setAdvanceAmount(newAdvanceBalance);
    setPaidAmount(newPaidAmount);
    // setPaymentStatus(status);

    // Save to database
    await set(ref(database, `payments/${selectedCustomer}/${selectedMonth}`), {
      pendingBalance: newPendingBalance,
      advanceBalance: newAdvanceBalance,
      paidAmount: newPaidAmount,
      status,
    });

    alert("Payment recorded successfully!");
    setPaymentInput("");
  };

  return (
    <div className="payments-container">
      <div className="payments-card">
        <h2 className="title">💰 Manage Payments</h2>

        {/* Branch Dropdown */}
        <select className="dropdown" onChange={(e) => setSelectedBranch(e.target.value)} value={selectedBranch}>
          <option value="">Select a Branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>

        {/* Society Dropdown */}
        <select className="dropdown" onChange={(e) => setSelectedSociety(e.target.value)} value={selectedSociety}>
          <option value="">Select a Society</option>
          {societies.map((society) => (
            <option key={society.id} value={society.id}>{society.name}</option>
          ))}
        </select>

        {/* Customer Dropdown */}
        <select className="dropdown" onChange={(e) => setSelectedCustomer(e.target.value)} value={selectedCustomer}>
          <option value="">Select a Customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>

        {/* Month Selector */}
        <input type="month" className="dropdown" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />

        {/* Calculate Total Button */}
        <button className="btn btn-primary" onClick={calculateTotalAmount}>Calculate Total</button>

        {/* Payment Summary */}
        <div className="summary">
          <div className="summary-item">Total Amount: ₹{totalAmount}</div>
          <div className="summary-item">Total Amount to Be Paid: ₹{totalAmountToBePaid}</div>
          <div className="summary-item">Pending Balance: ₹{pendingAmount}</div>
          <div className="summary-item">Advance Balance: ₹{advanceAmount}</div>
          <div className="summary-item">Total Paid: ₹{paidAmount}</div>
          {/* <div className="summary-item"><strong>Status:</strong> {paymentStatus}</div> */}
        </div>

        {/* Payment Input */}
        <input type="number" className="form-input" placeholder="Enter Paid Amount" value={paymentInput} onChange={(e) => setPaymentInput(e.target.value)} />

        {/* Record Payment Button */}
        <button className="btn btn-success" onClick={recordPayment}>Record Payment</button>
      </div>
    </div>
  );
}

export default Payments;