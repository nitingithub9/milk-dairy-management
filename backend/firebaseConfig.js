import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, get, update } from "firebase/database"; 
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZCOgn6NwSQgpjPWRyjzlcUGMC2M4SnNk",
  authDomain: "mazire-milk-dairy.firebaseapp.com",
  databaseURL: "https://mazire-milk-dairy-default-rtdb.firebaseio.com",
  projectId: "mazire-milk-dairy",
  storageBucket: "mazire-milk-dairy.firebasestorage.app",
  messagingSenderId: "975779315041",
  appId: "1:975779315041:web:4b541a928162624dfb9920"
};

// 🔥 Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
export { auth, database, ref, set, get, update };