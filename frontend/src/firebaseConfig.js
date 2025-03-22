import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, push, remove, update } from "firebase/database"; 
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // For Firestore

const firebaseConfig = {
  apiKey: "AIzaSyAZCOgn6NwSQgpjPWRyjzlcUGMC2M4SnNk",
  authDomain: "mazire-milk-dairy.firebaseapp.com",
  databaseURL: "https://mazire-milk-dairy-default-rtdb.firebaseio.com/",
  projectId: "mazire-milk-dairy",
  storageBucket: "mazire-milk-dairy.appspot.com",
  messagingSenderId: "975779315041",
  appId: "1:975779315041:web:4b541a928162624dfb9920"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore


export { database,auth, db, ref, set, get, push, remove, update }; // 
