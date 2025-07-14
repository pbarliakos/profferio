// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCAtxYq946KYkeKZn7d61PUc11fQp4MqMI",
  authDomain: "profferio.firebaseapp.com",
  projectId: "profferio",
  storageBucket: "profferio.firebasestorage.app",
  messagingSenderId: "96507325745",
  appId: "1:96507325745:web:25fd29d547432d74ab5410",
  measurementId: "G-5CVM99RYB4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
