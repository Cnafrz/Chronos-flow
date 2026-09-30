import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAQGGwJkfMIcNyKRjPrRbQVFu8xdUVeHJM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chronosflow-8259c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chronosflow-8259c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chronosflow-8259c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "237575433402",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:237575433402:web:37079be7313d2ce5172683",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7KTDWR5H42"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export { serverTimestamp };

// Enable offline persistence (safer for Electron/Capacitor than multi-tab)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
  } else if (err.code === 'unimplemented') {
    console.warn("The current browser doesn't support all of the features required to enable persistence.");
  }
});
