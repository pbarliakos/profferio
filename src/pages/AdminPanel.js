import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  updatePassword,
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

    // Σημείωση: αλλαγή password γίνεται μόνο αν έχει συμπληρωθεί
    if (form.password) {
      try {
        const userRecord = await auth.getUserByEmail(form.email); // <-- Αυτό δεν δουλεύει στο client!
        await updatePassword(userRecord, form.password);
      } catch (err) {
        console.warn("Cannot change password here. Needs Cloud Function.");
      }
    }

    setEditUserId(null);
    setForm({ username: "", email: "", password: "", role: "user", projects: [] });
    fetchUsers();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "users", id));
    // ⚠️ Προσθήκη: Cloud Function για Auth delete
    fetchUsers();
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2>Create User</h2>
      <form onSubmit={handleCreate}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required /><br />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required /><br />
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={handleChange} required /><br />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select><br />
        <select name="projects" multiple value={form.projects} onChange={handleChange}>
          <option value="alterlife">Alterlife</option>
          <option value="other">Other</option>
        </select><br />
        <button type="submit">Create User</button>
        {message && <p>{message}</p>}
      </form>

      <hr />
      <h2>All Users</h2>
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      /><br /><br />

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Projects</th>
            <th>Actions</th>
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
                  <input name="password" type="password" placeholder="New password (optional)" value={form.password} onChange={handleChange} /><br />
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
                  <button onClick={() => handleDelete(user.id)}>Delete</button>
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