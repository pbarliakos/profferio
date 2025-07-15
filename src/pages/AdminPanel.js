import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  collection, getDocs, setDoc, doc, deleteDoc, updateDoc
} from "firebase/firestore";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    projects: [],
  });
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [editUserId, setEditUserId] = useState(null);

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsers(list);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "projects") {
      const selected = Array.from(e.target.selectedOptions).map(o => o.value);
      setForm(prev => ({ ...prev, projects: selected }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        username: form.username,
        email: form.email,
        role: form.role,
        projects: form.projects,
      });
      setForm({ username: "", email: "", password: "", role: "user", projects: [] });
      setMessage("✅ User created");
      fetchUsers();
    } catch (err) {
      console.error(err);
      setMessage("❌ " + err.message);
    }
  };

  const handleEdit = (user) => {
    setEditUserId(user.id);
    setForm({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      projects: user.projects || [],
    });
  };

  const handleUpdate = async () => {
    await updateDoc(doc(db, "users", editUserId), {
      username: form.username,
      email: form.email,
      role: form.role,
      projects: form.projects,
    });

    if (form.password) {
      try {
        await fetch("https://us-central1-profferio.cloudfunctions.net/updateUserPassword", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            newPassword: form.password
          }),
        });
      } catch (err) {
        console.warn("❌ Password update failed", err);
      }
    }

    setEditUserId(null);
    setForm({ username: "", email: "", password: "", role: "user", projects: [] });
    fetchUsers();
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Delete user ${user.email}?`);
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "users", user.id));
      await fetch("https://us-central1-profferio.cloudfunctions.net/deleteUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      fetchUsers();
      setMessage("✅ User deleted.");
    } catch (err) {
      console.error("Delete failed", err);
      setMessage("❌ Delete failed: " + err.message);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "1000px", margin: "auto" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Create User</h2>
      <form onSubmit={handleCreate} style={{ display: "grid", gap: "0.5rem", marginBottom: "2rem" }}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select>
        <select name="projects" multiple value={form.projects} onChange={handleChange}>
          <option value="alterlife">Alterlife</option>
          <option value="other">Other</option>
        </select>
        <button type="submit">Create</button>
        {message && <p>{message}</p>}
      </form>

      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Users</h2>
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
      />

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th style={{ padding: "8px", border: "1px solid #ccc" }}>Username</th>
            <th style={{ padding: "8px", border: "1px solid #ccc" }}>Email</th>
            <th style={{ padding: "8px", border: "1px solid #ccc" }}>Role</th>
            <th style={{ padding: "8px", border: "1px solid #ccc" }}>Projects</th>
            <th style={{ padding: "8px", border: "1px solid #ccc" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) =>
            editUserId === user.id ? (
              <tr key={user.id}>
                <td><input name="username" value={form.username} onChange={handleChange} /></td>
                <td><input name="email" value={form.email} onChange={handleChange} /></td>
                <td>
                  <select name="role" value={form.role} onChange={handleChange}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                  </select>
                </td>
                <td>
                  <select name="projects" multiple value={form.projects} onChange={handleChange}>
                    <option value="alterlife">Alterlife</option>
                    <option value="other">Other</option>
                  </select>
                </td>
                <td>
                  <input name="password" type="password" placeholder="New password" value={form.password} onChange={handleChange} />
                  <button onClick={handleUpdate}>Save</button>
                  <button onClick={() => setEditUserId(null)}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{(user.projects || []).join(", ")}</td>
                <td>
                  <button onClick={() => handleEdit(user)}>Edit</button>
                  <button onClick={() => handleDelete(user)}>Delete</button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPanel;