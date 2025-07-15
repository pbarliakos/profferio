import React, { useEffect, useState } from "react";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import { signOut } from "firebase/auth";


function App() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            console.error("No user data found");
          }
        } catch (err) {
          console.error("Error loading user data", err);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!userData) return <Login onLogin={setUserData} />;

  return (
    <div>
      <h1>Welcome {userData.username}!</h1>
      <p>Role: {userData.role} Projects: {Array.isArray(userData.projects) ? userData.projects.join(", ") : "N/A"}</p>

      <button style={{ position: "absolute", top: 10, right: 10 }} onClick={() => signOut(auth)}>
      Logout 
      </button>
      {userData.role?.toLowerCase() === "admin" && <AdminPanel />}
    </div>
  );
  
}

export default App;