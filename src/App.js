// src/App.js
import React, { useState } from "react";
import Login from "./pages/Login";

function App() {
  const [userData, setUserData] = useState(null);

  if (!userData) {
    return <Login onLogin={setUserData} />;
  }

  return (
    <div>
      <h1>Welcome {userData.username}!</h1>
      <p>Role: {userData.role}</p>
      <p>Projects: {userData.projects.join(", ")}</p>
    </div>
  );
}

export default App;
