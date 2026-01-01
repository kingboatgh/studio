/*
This is a script to seed the first admin user in your Firestore database.
You need to run this script from your local machine's terminal.

**Prerequisites:**
1. You must have Node.js installed on your machine.
2. You must have the Firebase CLI installed (`npm install -g firebase-tools`).
3. You must be logged into the Firebase CLI (`firebase login`).
4. You need to create a user account in your Firebase project's Authentication tab.

**Instructions:**
1. Go to the Firebase Console -> Your Project -> Authentication -> Users.
2. Click "Add user" and create a user with an email and password.
3. Copy the UID of the newly created user.
4. Replace 'YOUR_PROJECT_ID' and 'ADMIN_USER_UID' placeholders in this script with your actual Firebase Project ID and the user's UID.
5. Save the file.
6. Open your terminal, navigate to the `scripts` directory of this project.
7. Run the script with the command: `node seed-admin.js`

This will create a document in the `admins` collection, granting admin privileges to the specified user.
*/

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// --- Replace these with your actual project details ---
const firebaseConfig = {
  // Find this in your Firebase project settings
  projectId: "studio-9539653970-7a846",
  appId: "1:900613601200:web:d93582e53c510673514875",
  apiKey: "AIzaSyCOZei8gqVa-qYqN3XshR0h3uukSMTWPkg",
  authDomain: "studio-9539653970-7a846.firebaseapp.com",
};

// The UID of the user you want to make an admin
const ADMIN_USER_UID = 'REPLACE_WITH_YOUR_ADMIN_USER_UID'; 
// ----------------------------------------------------


async function seedAdmin() {
  if (ADMIN_USER_UID === 'REPLACE_WITH_YOUR_ADMIN_USER_UID') {
    console.error('\x1b[31m%s\x1b[0m', 'Error: Please replace the ADMIN_USER_UID placeholder with an actual user UID.');
    return;
  }
  
  console.log(`Initializing Firebase for project: ${firebaseConfig.projectId}...`);
  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp);
  console.log('Firebase initialized.');

  const adminRef = doc(db, 'admins', ADMIN_USER_UID);

  try {
    console.log(`Setting user ${ADMIN_USER_UID} as an admin...`);
    await setDoc(adminRef, { isAdmin: true });
    console.log('\x1b[32m%s\x1b[0m', `✅ Successfully seeded admin user: ${ADMIN_USER_UID}`);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error seeding admin user:', error.message);
  } finally {
    // In Node.js, the process needs to be explicitly terminated
    // if there are active network connections like with Firestore.
    process.exit(0);
  }
}

seedAdmin();
