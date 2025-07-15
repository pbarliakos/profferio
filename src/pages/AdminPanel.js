import React, { useEffect, useState } from "react";
import {
  AppBar, Toolbar, Typography, Container, TextField, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogActions, DialogContent, DialogTitle,
  Snackbar, MenuItem
} from "@mui/material";
import { Logout, Delete, Edit } from "@mui/icons-material";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import {
  collection, getDocs, doc, deleteDoc, updateDoc, setDoc
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

function AdminPanel({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const emptyForm = {
    username: "",
    email: "",
    password: "",
    role: "user",
    projects: [],
  };
  const [form, setForm] = useState(emptyForm);

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsers(list);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditUserId(null);
    setForm(emptyForm);
    setOpenDialog(true);
  };

  const handleEdit = (user) => {
    setEditUserId(user.id);
    setForm({ ...user, password: "" });
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "projects") {
      setForm({ ...form, projects: value.split(",") });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async () => {
    try {
      if (editUserId) {
        await updateDoc(doc(db, "users", editUserId), {
          username: form.username,
          email: form.email,
          role: form.role,
          projects: form.projects,
        });

        if (form.password) {
          await fetch("https://us-central1-profferio.cloudfunctions.net/updateUserPassword", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email, newPassword: form.password }),
          });
        }

        setSnackbar({ open: true, message: "✅ User updated" });
      } else {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, "users", cred.user.uid), {
          username: form.username,
          email: form.email,
          role: form.role,
          projects: form.projects,
        });
        setSnackbar({ open: true, message: "✅ User created" });
      }

      handleClose();
      fetchUsers();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "❌ " + err.message });
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.email}?`)) return;
    try {
      await deleteDoc(doc(db, "users", user.id));
      await fetch("https://us-central1-profferio.cloudfunctions.net/deleteUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      fetchUsers();
      setSnackbar({ open: true, message: "✅ User deleted" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "❌ " + err.message });
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <Button color="inherit" startIcon={<Logout />} onClick={() => {
            signOut(auth);
            onLogout();
          }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Button variant="contained" onClick={handleOpenCreate}>
          + Create User
        </Button>
        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ml: 2 }}
        />

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Projects</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{(user.projects || []).join(", ")}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(user)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(user)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <Dialog open={openDialog} onClose={handleClose}>
        <DialogTitle>{editUserId ? "Edit User" : "Create User"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Username" name="username" value={form.username} onChange={handleChange} />
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} />
          <TextField
            label={editUserId ? "New Password (optional)" : "Password"}
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
          />
          <TextField
            select
            label="Role"
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </TextField>
          <TextField
            label="Projects (comma-separated)"
            name="projects"
            value={form.projects.join(",")}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editUserId ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        message={snackbar.message}
      />
    </>
  );
}

export default AdminPanel;