import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection, setDoc, doc, getDocs, deleteDoc, updateDoc
} from "firebase/firestore";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "user", projects: [] });
  const [editMode, setEditMode] = useState(null); // user id
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    const usersCol = collection(db, "users");
    const snapshot = await getDocs(usersCol);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsers(list);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "projects") {
      const options = Array.from(e.target.selectedOptions).map((opt) => opt.value);
      setForm((prev) => ({ ...prev, projects: options }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = cred.user.uid;
      await setDoc(doc(db, "users", uid), {
        username: form.username,
        email: form.email,
        role: form.role,
        projects: form.projects,
      });
      setForm({ username: "", email: "", password: "", role: "user", projects: [] });
      fetchUsers();
      setMessage("✅ User created");
    } catch (err) {
      console.error(err);
      setMessage("❌ " + err.message);
    }
  };

  const handleDelete = async (uid) => {
    await deleteDoc(doc(db, "users", uid));
    setUsers(users.filter(u => u.id !== uid));
    // ⚠️ Χρήστης δεν διαγράφεται από Firebase Auth, μόνο από Firestore
  };

  const startEdit = (user) => {
    setEditMode(user.id);
    setForm({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      projects: user.projects || []
    });
  };

  const saveEdit = async () => {
    await updateDoc(doc(db, "users", editMode), {
      username: form.username,
      email: form.email,
      role: form.role,
      projects: form.projects
    });
    setEditMode(null);
    setForm({ username: "", email: "", password: "", role: "user", projects: [] });
    fetchUsers();
  };

  return (
    <div>
      <h2>Create New User</h2>
      <form onSubmit={handleCreate}>
        <input name="username" value={form.username} onChange={handleChange} placeholder="Username" required /><br />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required /><br />
        <input name="password" value={form.password} onChange={handleChange} placeholder="Password" required /><br />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select><br />
        <select name="projects" multiple onChange={handleChange} value={form.projects}>
          <option value="alterlife">Alterlife</option>
          <option value="other">Other</option>
        </select><br />
        <button type="submit">Create User</button>
        {message && <p>{message}</p>}
      </form>

      <h2>All Users</h2>
      {users.map((user) =>
        editMode === user.id ? (
          <div key={user.id}>
            <input name="username" value={form.username} onChange={handleChange} />
            <input name="email" value={form.email} onChange={handleChange} />
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>
            <select name="projects" multiple onChange={handleChange} value={form.projects}>
              <option value="alterlife">Alterlife</option>
              <option value="other">Other</option>
            </select>
            <button onClick={saveEdit}>Save</button>
            <button onClick={() => setEditMode(null)}>Cancel</button>
          </div>
        ) : (
          <div key={user.id}>
            {user.username} | {user.email} | {user.role} | [{(user.projects || []).join(", ")}]
            <button onClick={() => startEdit(user)}>Edit</button>
            <button onClick={() => handleDelete(user.id)}>Delete</button>
          </div>
        )
      )}
    </div>
  );
}

export default AdminPanel;