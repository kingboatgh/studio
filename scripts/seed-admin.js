const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

// Check if the service account key file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ ERROR: Firebase service account key file not found.");
  console.error(`Please download your service account key from the Firebase console and save it as 'serviceAccountKey.json' in the 'scripts' directory.`);
  console.error("For more details, see the 'Important Security Note' section in README.md");
  console.error("This file is ignored by git and should NOT be committed to your repository.");
  process.exit(1);
}

// Load service account
const serviceAccount = require(serviceAccountPath);

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🔴 Replace with the UID of the user you want to make an admin.
const ADMIN_USER_UID = "ADMIN_USER_UID_PLACEHOLDER";

async function seedAdmin() {
  if (!ADMIN_USER_UID || ADMIN_USER_UID === "ADMIN_USER_UID_PLACEHOLDER") {
    console.error("🔴 Please replace the ADMIN_USER_UID_PLACEHOLDER in scripts/seed-admin.js with an actual user UID from Firebase Authentication.");
    process.exit(1);
  }

  try {
    console.log(`Setting user ${ADMIN_USER_UID} as admin...`);
    
    const adminRef = db.collection("admins").doc(ADMIN_USER_UID);
    const adminDoc = await adminRef.get();

    if (adminDoc.exists) {
        console.log(`✅ User ${ADMIN_USER_UID} is already an admin.`);
        return;
    }

    await adminRef.set({
      role: "ADMIN",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Admin user seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding admin user:", error.message);
  } finally {
    // Explicitly exit the process to ensure the script terminates.
    process.exit(0);
  }
}

seedAdmin();
