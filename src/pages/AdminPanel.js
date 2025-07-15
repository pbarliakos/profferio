import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, setDoc, doc } from "firebase/firestore";

function AdminPanel() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    projects: [],
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Projects: checkboxes
    if (name === "projects") {
      const options = Array.from(e.target.selectedOptions).map((opt) => opt.value);
      setForm((prev) => ({ ...prev, projects: options }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        username: form.username,
        email: form.email,
        role: form.role,
        projects: form.projects,
      });

      setMessage("✅ User created successfully!");
      setForm({ username: "", email: "", password: "", role: "user", projects: [] });
    } catch (err) {
      console.error("Error creating user:", err);
      setMessage("❌ Error: " + err.message);
    }
  };

  return (
    <div>
      <h2>Create New User</h2>
      <form onSubmit={handleCreateUser}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required /><br />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required /><br />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required /><br />

        <label>Role:</label><br />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select><br />

        <label>Projects:</label><br />
        <select name="projects" multiple onChange={handleChange} value={form.projects}>
          <option value="alterlife">Alterlife</option>
          <option value="other">Other</option>
        </select><br />

        <button type="submit">Create User</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default AdminPanel;