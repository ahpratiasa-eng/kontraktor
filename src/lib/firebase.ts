import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBSy6poKIVLX1BazVWxh2u7q0LlLR9V2cE",
  authDomain: "kontraktor-app.firebaseapp.com",
  projectId: "kontraktor-app",
  storageBucket: "kontraktor-app.firebasestorage.app",
  messagingSenderId: "116953182014",
  appId: "1:116953182014:web:56fe2108845033e037066f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google provider to always show account selection
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'  // Always show account chooser
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const appId = 'kontraktor-pro-live';
export { signInAnonymously };
