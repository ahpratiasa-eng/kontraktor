// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- GANTI INI DENGAN CONFIG ANDA SENDIRI ---
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxx...",
  authDomain: "kontraktor-app.firebaseapp.com",
  projectId: "kontraktor-app",
  storageBucket: "kontraktor-app.appspot.com",
  messagingSenderId: "123456...",
  appId: "1:123456..."
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export layanan agar bisa dipakai di file lain
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
