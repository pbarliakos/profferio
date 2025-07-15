import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, setDoc, doc } from "firebase/firestore";

function AdminPanel() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "agent",
    projects: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // Δημιουργία χρήστη στο Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const uid = userCredential.user.uid;

      // Δημιουργία user entry στο Firestore
      await setDoc(doc(db, "users", uid), {
        username: form.username,
        email: form.email,
        role: form.role,
        projects: form.projects.split(",").map(p => p.trim())
      });

      setMessage("✅ User created successfully!");
      setForm({ username: "", email: "", password: "", role: "agent", projects: "" });
    } catch (err) {
      console.error("Error creating user:", err);
      setMessage("❌ Error: " + err.message);
    }
  };

  return (
    <div>
      <h2>Create New User</h2>
      <form onSubmit={handleCreateUser}>
        <input type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} required /><br />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required /><br />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required /><br />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select><br />
        <input type="text" name="projects" placeholder="Projects (comma-separated)" value={form.projects} onChange={handleChange} required /><br />
        <button type="submit">Create User</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default AdminPanel;
