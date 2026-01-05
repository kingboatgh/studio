
# AI Developer Prompt: Build a National Service Personnel (NSP) Management System

## **Objective**

Develop a comprehensive web application to manage National Service Personnel (NSP) records and track their monthly submissions. The system should provide a clean, modern user interface for administrators and desk officers to perform their duties efficiently.

## **Core Technology Stack**

*   **Framework:** Next.js (latest version, using the App Router)
*   **Language:** TypeScript
*   **UI Components:** ShadCN UI library
*   **Styling:** Tailwind CSS
*   **Backend & Database:** Firebase (Authentication and Firestore)
*   **CSV Parsing:** `papaparse` library

## **Data Model & Firestore Structure**

Define the following data entities and structure them in Firestore.

1.  **Entities:**
    *   `NationalServicePersonnel`: Represents an NSP with fields for `id`, `serviceNumber`, `fullName`, `institution`, `posting`, `isDisabled` (boolean for soft-delete), `createdDate`, `lastUpdatedDate`, `districtId`, and `serviceYear`.
    *   `Submission`: A record for a monthly submission with `id`, `nspId`, `month`, `year`, `timestamp`, and `deskOfficerName`.
    *   `User`: A system user with `id` (matching auth UID), `username`, and `isAdmin` (boolean).
    *   `District`: A district office with `id` and `name`.

2.  **Firestore Collection Paths:**
    *   `/admins/{userId}`: A collection to store admin user IDs. A document's existence signifies admin rights.
    *   `/districts/{districtId}`: Top-level collection for each district.
    *   `/districts/{districtId}/personnel/{personnelId}`: NSP records scoped to a district.
    *   `/districts/{districtId}/personnel/{personnelId}/submissions/{submissionId}`: Submissions for a specific NSP.

## **Key Features & User Stories**

### **1. Authentication & Authorization**
*   **Login Page:** Implement an email and password login page at `/login`.
*   **Auth Guard:** Protect all routes except `/login`. Redirect unauthenticated users to the login page.
*   **Admin Roles:** Use a top-level `/admins` collection in Firestore to manage admin roles. A user is an admin if a document with their UID exists in this collection.
*   **Security Rules:**
    *   Only authenticated users can read data.
    *   Only admins can write/update/delete NSP records (`personnel`) and district information (`districts`).
    *   Any authenticated user can create a `submission` record.
*   **Seeding Script:** Provide a Node.js script (`scripts/seed-admin.js`) to manually assign the first admin user by adding their UID to the `/admins` collection.

### **2. Main Dashboard (Homepage: `/`)**
*   Display three primary statistics in UI cards:
    1.  Total number of active NSPs.
    2.  Number of NSPs who have submitted for the current month.
    3.  Number of NSPs with pending submissions for the current month.
*   Implement a "Monthly Reports" feature to export submission data as a CSV file. This should include month and year selectors and an "Export Report" button.

### **3. NSP Registry (`/nsp`)**
*   Display all NSP records in a responsive table.
*   Table columns: NSP ID, Service Number, Full Name, Institution, and a "Status" column.
*   The "Status" column should display a "Submitted" badge if the NSP has a submission record for the current month; otherwise, it should be empty.
*   **Search Functionality:** Include a search bar to filter the table by Name, NSP ID, or Service Number.
*   **Actions:**
    *   An "Add New NSP" button that navigates to the creation form.
    *   An "Edit" button on each row to navigate to the edit form for that NSP.
    *   A "Submit" button on each row to open a dialog for marking that month's submission.

### **4. Add/Edit NSP Form (`/nsp/new`, `/nsp/[id]/edit`)**
*   Create a form for creating and updating NSP records.
*   Fields: Full Name, Service Number, Institution, Posting.
*   When editing, also include a dropdown to set the status (Active/Inactive).
*   **Validation:**
    *   All fields are required.
    *   The `serviceNumber` must be unique across all NSP records. Implement a check against Firestore.

### **5. Bulk Upload (`/nsp/upload`)**
*   Create a page for bulk-uploading NSP records from a CSV file.
*   The page should include:
    *   A file input that only accepts `.csv` files.
    *   An "Upload File" button.
    *   A progress bar to show upload progress.
    *   Error handling and display for invalid file types or missing columns.
    *   A section explaining the required CSV format (`serviceNumber`, `fullName`, `institution`, `posting`).
    *   A button to download a CSV template file.
*   Use `papaparse` to parse the uploaded CSV on the client-side and create new NSP records in Firestore.

### **6. Layout & UI**
*   **Main Layout:** Create a two-column layout with a persistent sidebar on the left and a main content area.
*   **Sidebar:** The sidebar should contain navigation links to "Dashboard," "NSP Registry," and "Bulk Upload." It should also have a "Log Out" button at the bottom.
*   **Header:** The header should display the current page's title and a user profile dropdown menu with a "Logout" option.
*   **Responsiveness:** The layout must be fully responsive. On smaller screens, the sidebar should be hidden and accessible via a hamburger menu in the header.
*   **Styling:** Use a professional and clean design with the provided color scheme (`primary`, `accent`, `background`, etc.).
