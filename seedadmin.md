# Admin Seeding Instructions

This project includes a script (`scripts/seed-admin.js`) for assigning the first administrator user. This script requires a Firebase Admin SDK Service Account Key. 

**This key is highly sensitive and must not be committed to your Git repository.**

The file `scripts/serviceAccountKey.json` is intentionally excluded from version control via the `.gitignore` file.

## How to Use the Admin Seeding Script

1.  **Download Your Service Account Key**:
    *   Go to your Firebase project settings.
    *   Navigate to the "Service accounts" tab.
    *   Click "Generate new private key".
    *   A JSON file will be downloaded.

2.  **Save the Key**:
    *   Rename the downloaded file to `serviceAccountKey.json`.
    *   Place it inside the `/scripts` directory of your project.

3.  **Run the Script**:
    *   Follow the instructions in `scripts/seed-admin.js` to add your admin user's UID.
    *   Run `node scripts/seed-admin.js` from your terminal.

After running the script, your user will have admin privileges. Remember to keep your `serviceAccountKey.json` file safe and private.
