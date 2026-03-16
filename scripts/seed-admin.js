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

// 🔴 Step 1: Replace with the UID of the user you want to make an admin.
// You can find this in your Firebase project's Authentication section.
const ADMIN_USER_UID = "ADMIN_USER_UID_PLACEHOLDER";

// 🔵 Step 2: Confirm the admin's email and name.
const ADMIN_EMAIL = "geniusboateng@gmail.com";
const ADMIN_FULL_NAME = "Genius Boateng";


async function seedAdmin() {
  if (!ADMIN_USER_UID || ADMIN_USER_UID === "ADMIN_USER_UID_PLACEHOLDER") {
    console.error("🔴 Please replace the ADMIN_USER_UID_PLACEHOLDER in scripts/seed-admin.js with an actual user UID from Firebase Authentication.");
    process.exit(1);
  }

  try {
    console.log(`Setting user ${ADMIN_USER_UID} (${ADMIN_EMAIL}) as admin...`);
    
    const adminRef = db.collection("users").doc(ADMIN_USER_UID);
    const adminDoc = await adminRef.get();

    if (adminDoc.exists && adminDoc.data().role === 'Admin') {
        console.log(`✅ User ${ADMIN_USER_UID} is already an admin.`);
        return;
    }

    await adminRef.set({
      uid: ADMIN_USER_UID,
      email: ADMIN_EMAIL,
      fullName: ADMIN_FULL_NAME,
      role: "Admin",
      status: "Active",
      districtId: null, // Admins are not tied to a specific district
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log("✅ Admin user seeded successfully in 'users' collection.");
    console.log("ℹ️  Note: The previous 'admins' collection is no longer used.");

  } catch (error) {
    console.error("❌ Error seeding admin user:", error.message);
  } finally {
    // Explicitly exit the process to ensure the script terminates.
    process.exit(0);
  }
}

seedAdmin();
