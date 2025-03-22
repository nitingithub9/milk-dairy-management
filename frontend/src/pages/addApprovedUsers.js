import { database, ref, update } from "./firebaseConfig"; 

const addApprovedUsers = async () => {
  const approvedUsers = {
    [btoa("nitinbiradar76@gmail.com")]: { email: "nitinbiradar76@gmail.com", isAdmin: true },
    [btoa("ajinkya@gmail.com")]: { email: "ajinkya@gmail.com", isAdmin: true },
    // [btoa("ashishbiradar150@gmail.com")]: { email: "ashishbiradar150@gmail.com", isAdmin: true },
    
  };

  try {
    await update(ref(database, "approved_users"), approvedUsers); // Use update to prevent overwrite
    console.log("✅ Approved users added successfully!");
  } catch (error) {
    console.error("❌ Error adding approved users:", error);
  }
};

addApprovedUsers();
