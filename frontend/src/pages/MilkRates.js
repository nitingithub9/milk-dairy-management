import React, { useState, useEffect } from "react";
import { database, ref, set, get } from "../firebaseConfig";
import "./MilkRates.css"; // Importing CSS file for styling

function MilkRates() {
  const [rates, setRates] = useState({
    cowHalfLtr: "",
    cowOneLtr: "",
    buffaloHalfLtr: "",
    buffaloOneLtr: "",
  });

  // Fetch saved milk rates from Firebase when the component loads
  useEffect(() => {
    const fetchRates = async () => {
      const ratesRef = ref(database, "milkRates");
      const snapshot = await get(ratesRef);
      if (snapshot.exists()) {
        setRates(snapshot.val());
      }
    };
    fetchRates();
  }, []);

  // Handle input changes & Prevent negative values
  const handleChange = (e) => {
    let { name, value } = e.target;
    if (value < 0) {
      alert("❌ Milk rate cannot be negative!");
      value = 0;
    }
    setRates({ ...rates, [name]: value });
  };

  // Save Milk Rates to Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const ratesRef = ref(database, "milkRates");
      await set(ratesRef, rates);
      alert("✅ Milk rates updated successfully!");
    } catch (error) {
      console.error("❌ Firebase Error:", error);
    }
  };

  return (
    <div className="milk-rates-container">
      <h2 className="title">
        🐄 Set Milk Rates
      </h2>
      <form onSubmit={handleSubmit} className="milk-form">
        
        <div className="row">
          {/* Cow Milk - Half Liter */}
          <div className="col">
            <label className="form-label">
              <img src="/icons/cow-icon.png" alt="Cow" className="milk-icon" />
              Cow Milk (Half Ltr)
            </label>
            <input
              type="number"
              className="form-input"
              name="cowHalfLtr"
              value={rates.cowHalfLtr}
              onChange={handleChange}
              placeholder="Enter rate"
              required
            />
          </div>

          {/* Cow Milk - One Liter */}
          <div className="col">
            <label className="form-label">
              <img src="/icons/cow-icon.png" alt="Cow" className="milk-icon" />
              Cow Milk (One Ltr)
            </label>
            <input
              type="number"
              className="form-input"
              name="cowOneLtr"
              value={rates.cowOneLtr}
              onChange={handleChange}
              placeholder="Enter rate"
              required
            />
          </div>
        </div>

        <div className="row">
          {/* Buffalo Milk - Half Liter */}
          <div className="col">
            <label className="form-label">
              <img src="/icons/buffalo-icon.png" alt="Buffalo" className="milk-icon" />
              Buffalo Milk (Half Ltr)
            </label>
            <input
              type="number"
              className="form-input"
              name="buffaloHalfLtr"
              value={rates.buffaloHalfLtr}
              onChange={handleChange}
              placeholder="Enter rate"
              required
            />
          </div>

          {/* Buffalo Milk - One Liter */}
          <div className="col">
            <label className="form-label">
              <img src="/icons/buffalo-icon.png" alt="Buffalo" className="milk-icon" />
              Buffalo Milk (One Ltr)
            </label>
            <input
              type="number"
              className="form-input"
              name="buffaloOneLtr"
              value={rates.buffaloOneLtr}
              onChange={handleChange}
              placeholder="Enter rate"
              required
            />
          </div>
        </div>

        <button type="submit" className="submit-btn">💾 Save Rates</button>
      </form>
    </div>
  );
}

export default MilkRates;
