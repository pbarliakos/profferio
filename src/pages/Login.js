// src/pages/Login.js
import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  signInWithEmailAndPassword
} from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  
const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  try {
    // Logging για debugging
    console.log("🔍 Checking username:", username);

    // Βρες το email που αντιστοιχεί στο username
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setError("Username not found.");
      console.log("❌ Username not found in Firestore");
      return;
    }

    const userData = querySnapshot.docs[0].data();
    const email = userData.email;

    console.log("✅ Found email:", email);

    // Κάνε login με email και password
    await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Firebase login successful");

    onLogin(userData);
  } catch (err) {
    setError("Invalid credentials.");
    console.error("❌ Firebase login error:", err.code, err.message);
  }
};


  return (
    <div>
      <h2>Profferio Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        /><br/>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br/>
        <button type="submit">Login</button>
        {error && <p style={{color: "red"}}>{error}</p>}
      </form>
    </div>
  );
}

export default Login;



