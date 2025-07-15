const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();

exports.deleteUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const {uid} = req.body;

    if (!uid) return res.status(400).send("Missing UID");

    try {
      await admin.auth().deleteUser(uid);
      await admin.firestore().collection("users").doc(uid).delete();
      return res.status(200).send("User deleted successfully");
    } catch (err) {
      console.error("Delete Error:", err);
      return res.status(500).send("Error deleting user");
    }
  });
});

exports.updateUserPassword = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const {uid, password} = req.body;

    if (!uid || !password) return res.status(400).send("Missing fields");

    try {
      await admin.auth().updateUser(uid, {password});
      return res.status(200).send("Password updated");
    } catch (err) {
      console.error("Password Update Error:", err);
      return res.status(500).send("Error updating password");
    }
  });
});
