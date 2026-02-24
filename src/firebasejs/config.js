// src/firebasejs/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCSpzeyhwzuq_DrSRqcKNdZBxDTXPnSS3o",
  authDomain: "prime-sms-hub-661cc.firebaseapp.com",
  projectId: "prime-sms-hub-661cc",
  storageBucket: "prime-sms-hub-661cc.firebasestorage.app",
  messagingSenderId: "1049442796038",
  appId: "1:1049442796038:web:c3de3a11fd5d0243523987",
  measurementId: "G-LWGBT09TLD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db, analytics };
export default app;