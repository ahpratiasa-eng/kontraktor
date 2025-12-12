// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- GANTI INI DENGAN CONFIG ANDA SENDIRI ---
const firebaseConfig = {
  apiKey: "AIzaSyBSy6poKIVLX1BazVWxh2u7q0LlLR9V2cE",
  authDomain: "kontraktor-app.firebaseapp.com",
  projectId: "kontraktor-app",
  storageBucket: "kontraktor-app.firebasestorage.app",
  messagingSenderId: "116953182014",
  appId: "1:116953182014:web:56fe2108845033e037066f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export layanan agar bisa dipakai di file lain
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
