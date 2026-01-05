const admin = require("firebase-admin");
const path = require("path");

// Load service account
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🔴 Replace with real UID
const ADMIN_USER_UID = "6DO1xtwoLMWbf7CVW1mAqXEvJwI3";

async function seedAdmin() {
  if (!ADMIN_USER_UID || ADMIN_USER_UID === "ADMIN_USER_UID") {
    throw new Error("Please replace the ADMIN_USER_UID placeholder with an actual user UID.");
  }

  try {
    console.log(`Setting user ${ADMIN_USER_UID} as admin...`);

    await db.collection("admins").doc(ADMIN_USER_UID).set({
      role: "ADMIN",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Admin user seeded successfully");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
