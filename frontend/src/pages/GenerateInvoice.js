import React, { useState, useEffect } from "react";
import { database, ref, get } from "../firebaseConfig";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage"; // Firebase Storage (for potential invoice uploads)

function GenerateInvoice() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");

  // Month selection (YYYY-MM)
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));

  // Payment data (pending balance, advance balance, paid amount, status) for the selected month
  const [paymentData, setPaymentData] = useState(null);
  const [customerDetails, setCustomerDetails] = useState({});
  const [salesData, setSalesData] = useState({});
  const [monthlySalesSum, setMonthlySalesSum] = useState(0);
  const [totalAmountDue, setTotalAmountDue] = useState(0);

  const storage = getStorage();
  const scannerImagePath = "/icons/scanner.png";

  useEffect(() => {
    if (paymentData) {
      const { pendingBalance = 0, advanceBalance = 0, paidAmount = 0 } = paymentData;
      
      // Correct calculation: Add pending balance, subtract advance, and consider paid amount
      const totalDue = Math.max((monthlySalesSum + pendingBalance - advanceBalance - paidAmount), 0);
      
      setTotalAmountDue(totalDue);
    }
  }, [paymentData, monthlySalesSum]);
  

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      const snapshot = await get(ref(database, "branches"));
      if (snapshot.exists()) {
        const data = snapshot.val() || {};
        setBranches(Object.entries(data).map(([id, name]) => ({ id, name })));
      }
    };
    fetchBranches();
  }, []);

  // Fetch societies when a branch is selected
  useEffect(() => {
    if (!selectedBranch) {
      setSocieties([]);
      return;
    }
    const fetchSocieties = async () => {
      const snapshot = await get(ref(database, `societies/${selectedBranch}`));
      if (snapshot.exists()) {
        const data = snapshot.val() || {};
        setSocieties(Object.entries(data).map(([id, name]) => ({ id, name })));
      } else {
        setSocieties([]);
      }
    };
    fetchSocieties();
  }, [selectedBranch]);

  // Fetch customers when a society is selected
  useEffect(() => {
    if (!selectedSociety) {
      setCustomers([]);
      return;
    }
    const fetchCustomers = async () => {
      const snapshot = await get(ref(database, `customers/${selectedBranch}/${selectedSociety}`));
      if (snapshot.exists()) {
        const data = snapshot.val() || {};
        setCustomers(Object.entries(data).map(([id, cust]) => ({ id, ...cust })));
      } else {
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, [selectedSociety, selectedBranch]);

  // Helper to get previous month in YYYY-MM format
  const getPreviousMonth = (monthStr) => {
    let [year, mon] = monthStr.split("-");
    let prev = new Date(parseInt(year), parseInt(mon) - 1 - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  };

  // Fetch the bill: payment record, customer details, and sales data for the selected customer & month
  const fetchBill = async () => {
    if (!selectedCustomer || !yearMonth) {
      return alert("Please select all fields!");
    }
    try {
      // 1) Fetch payment data for this customer and month
      const paymentRef = ref(database, `payments/${selectedCustomer}/${yearMonth}`);
      const paymentSnap = await get(paymentRef);
      if (paymentSnap.exists()) {
        setPaymentData(paymentSnap.val());
      } else {
        // If no current payment record, check previous month for carry-over balances
        const prevMonth = getPreviousMonth(yearMonth);
        const prevSnap = await get(ref(database, `payments/${selectedCustomer}/${prevMonth}`));
        const oldPending = prevSnap.exists() ? (prevSnap.val().pendingBalance || 0) : 0;
        const oldAdvance = prevSnap.exists() ? (prevSnap.val().advanceBalance || 0) : 0;
        setPaymentData({
          pendingBalance: oldPending,
          advanceBalance: oldAdvance,
          paidAmount: 0,
          status: oldPending > 0 ? "Pending" : "Paid",
        });
      }

      // 2) Fetch customer details (name, phone)
      const customerRef = ref(database, `customers/${selectedBranch}/${selectedSociety}/${selectedCustomer}`);
      const customerSnapshot = await get(customerRef);
      setCustomerDetails(
        customerSnapshot.exists()
          ? customerSnapshot.val()
          : { name: "N/A", phone: "N/A" }
      );

      // 3) Fetch sales for this month
      const salesRef = ref(database, `sales/${selectedCustomer}/${yearMonth}`);
      const salesSnapshot = await get(salesRef);
      if (salesSnapshot.exists()) {
        const sData = salesSnapshot.val();
        setSalesData(sData);
        // Compute the sum of all sale.amount values
        const sum = Object.values(sData).reduce((acc, sale) => acc + (sale.amount || 0), 0);
        setMonthlySalesSum(sum);
      } else {
        setSalesData({});
        setMonthlySalesSum(0);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data. Please try again.");
    }
  };

  // Generate PDF invoice for the selected bill
  const generateInvoicePDF = async () => {
    if (!paymentData) {
      return alert("No data available for the selected month.");
    }
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Mazire Milk Dairy", 70, 15);

    doc.setFontSize(12);
    doc.text(`Customer Name: ${customerDetails.name || "N/A"}`, 15, 25);
    doc.text(`Mobile Number: ${customerDetails.phone || "N/A"}`, 15, 33);
    doc.text(`Bill of the Month: ${yearMonth}`, 15, 41);

    // Prepare table rows from salesData
    let salesTable = Object.keys(salesData).map((date) => [
      date,
      `${salesData[date].quantity} L`,
      `₹${(salesData[date].amount || 0).toFixed(2)}`,
    ]);
    if (salesTable.length === 0) {
      salesTable = [["No data available for the month"]];
    }

    // Draw table
    autoTable(doc, {
      startY: 50,
      head: [["Date", "Milk (L)", "Amount"]],
      body: salesTable,
    });

    // Summary section below table
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total Monthly Sales: ₹${monthlySalesSum.toFixed(2)}`, 15, finalY);
    finalY += 8;
    doc.text(`Paid This Month: ₹${paymentData.paidAmount}`, 15, finalY);
    finalY += 8;
    doc.text(`Pending Balance: ₹${paymentData.pendingBalance}`, 15, finalY);
    finalY += 8;
    doc.text(`Advance Balance: ₹${paymentData.advanceBalance}`, 15, finalY);
    finalY += 8;
    doc.text(`Status: ${paymentData.status}`, 15, finalY);

    // Add scanner QR image (for UPI payment) to the PDF
    const imgWidth = 50, imgHeight = 50;
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = (pageWidth - imgWidth) / 2;
    doc.addImage(scannerImagePath, "PNG", centerX, finalY + 10, imgWidth, imgHeight);

    // Payment instruction text
    doc.text("Pay the bill via UPI to: 9876543210", 15, finalY + 70);
    doc.text("Scan the QR code above to make payment.", 15, finalY + 78);

    return doc;
  };

  // Optionally upload the PDF invoice to Firebase Storage and get a URL (not currently used in UI)
  const uploadInvoiceToFirebase = async (doc) => {
    const pdfBlob = doc.output("blob");
    const invoiceRef = storageRef(storage, `invoices/Invoice_${customerDetails.name}_${yearMonth}.pdf`);
    await uploadBytes(invoiceRef, pdfBlob);
    return await getDownloadURL(invoiceRef);
  };

  // Generate and download the invoice PDF locally
  const generateInvoice = async () => {
    if (!paymentData) {
      return alert("No data available for the selected month.");
    }
    const doc = await generateInvoicePDF();
    doc.save(`Invoice_${customerDetails.name}_${yearMonth}.pdf`);
    alert("Invoice generated successfully!");
  };

  // Share invoice via WhatsApp (text summary)
  const shareInvoice = async () => {
    if (!paymentData) {
      return alert("No data available for the selected month.");
    }
    let message = `📜 *Mazire Milk Dairy Invoice*\n\n`;
    message += `👤 *Customer Name:* ${customerDetails.name || "N/A"}\n`;
    message += `📞 *Mobile Number:* ${customerDetails.phone || "N/A"}\n`;
    message += `📅 *Bill for the Month:* ${yearMonth}\n\n`;

    // Header for sales data
    message += `📊 *Milk Sales Data:*\n`;
    message += `────────────────────\n`;
    message += `*Date*    *Liters*    *Amount*\n`;
    message += `────────────────────\n`;
    let sum = 0;
    for (let date in salesData) {
      const sale = salesData[date];
      message += `${date}    ${sale.quantity} L    ₹${(sale.amount || 0).toFixed(2)}\n`;
      sum += sale.amount || 0;
    }
    message += `────────────────────\n`;
    message += `🧾 *Total Sales:* ₹${sum.toFixed(2)}\n\n`;

    // Payment summary
    message += `💵 *Paid This Month:* ₹${paymentData.paidAmount}\n`;
    message += `💳 *Pending Balance:* ₹${paymentData.pendingBalance}\n`;
    message += `💳 *Advance Balance:* ₹${paymentData.advanceBalance}\n`;
    message += `🔖 *Status:* ${paymentData.status}\n\n`;

    // Payment instructions
    message += `✅ *Pay via UPI:* 9876543210\n`;
    // (We could include a note about the QR code if sending an image separately)

    // Open WhatsApp with the pre-filled message
    const phoneNumber = (customerDetails.phone || "").replace(/\s+/g, "");
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-center">
        <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
          <div className="card-body">
            
            {/* Header */}
            <h2 className="text-center mb-4">🧾 Generate & Share Invoice</h2>
  
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
              {societies.map((soc) => (
                <option key={soc.id} value={soc.id}>{soc.name}</option>
              ))}
            </select>
  
            {/* Customer Selection */}
            <select className="form-select mb-3" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} disabled={!selectedSociety}>
              <option value="">Select a Customer</option>
              {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name} ({cust.phone})
                </option>
              ))}
            </select>
  
            {/* Month Selection */}
            <input type="month" className="form-control mb-3" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
  
            {/* Fetch Bill Button */}
            <button className="btn btn-primary w-100" onClick={fetchBill}>Fetch Bill</button>
  
            {/* Bill Details Display */}
            {paymentData && (
              <div className="mt-4 alert alert-info">
                <p><strong>Monthly Sales:</strong> ₹{monthlySalesSum.toFixed(2)}</p>
                <p><strong>Paid This Month:</strong> ₹{paymentData.paidAmount}</p>
                <p><strong>Pending Balance:</strong> ₹{paymentData.pendingBalance}</p>
                <p><strong>Advance Balance:</strong> ₹{paymentData.advanceBalance}</p>
                <p><strong>Status:</strong> {paymentData.status}</p>
  
                {/* Total Amount to be Paid */}
                <div className={`alert ${totalAmountDue > 0 ? "alert-danger" : "alert-success"}`}>
                  <strong>{totalAmountDue > 0 ? "Total Amount to be Paid:" : "No Due, Fully Paid:"}</strong>
                  ₹{totalAmountDue.toFixed(2)}
                </div>
  
                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <button className="btn btn-warning flex-fill" onClick={generateInvoice}>Generate Invoice</button>
                  <button className="btn btn-success flex-fill" onClick={shareInvoice}>📤 Share Invoice</button>
                </div>
              </div>
            )}
  
          </div> 
        </div> 
      </div> 
    </div> 
  );
}
  export default GenerateInvoice
