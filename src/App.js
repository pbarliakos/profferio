import React, { useState } from "react";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";

function App() {
  const [userData, setUserData] = useState(null);

  if (!userData) {
    return <Login onLogin={setUserData} />;
  }

  return (
    <div>
      <h1>Welcome {userData.username}!</h1>
      <p>Role: {userData.role}</p>
      <p>Projects: {Array.isArray(userData.projects) ? userData.projects.join(", ") : "N/A"}</p>

      {userData.role?.toLowerCase() === "admin" && <AdminPanel />}
    </div>
  );
}

export default App;
