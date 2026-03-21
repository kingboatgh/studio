# NSP Manager (National Service Personnel Manager)

NSP Manager is a comprehensive, modern web application designed for the administration, registration, and management of National Service Personnel (NSP). Built with a state-of-the-art Glassmorphism UI, a robust Firebase backend, and seamless Role-Based Access Control (RBAC), the platform ensures a secure and stunning administrative experience.

## ✨ Features

- **Premium Glassmorphism Aesthetic:** A beautiful, responsive UI featuring dynamic background photography sliders, frosted-glass translucent overlay cards, and seamless Light/Dark neon themes.
- **Secure Authentication & RBAC:** Complete integration with Firebase Auth. New users are automatically placed in a `Pending` state, securing the system until an existing Administrator approves or rejects their account.
- **Personnel Dashboard & Registry:** Admins can monitor system-wide statistics through interactive charts, register new National Service Personnel manually, or view the complete searchable roster.
- **Data Export & Bulk Uploads:** Quickly import hundreds of NSP records instantly via CSV or export the entire current personnel registry directly to your local device.
- **Universal Audit Logs:** A completely automated, unalterable system log that tracks every critical administrative action (such as deleting records or approving new users), explicitly detailing timestamps, IDs, Emails, and Roles.
- **Monthly Submissions Management:** Personnel officers can submit monthly evaluation reports that are seamlessly tracked and mapped out over time on the dashboard algorithms.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A valid Firebase Project

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/kingboatgh/studio.git
   cd studio
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env.local` variables from the current Firebase configuration strings (API keys, Auth Domains, etc.).

4. Start the development server:
   ```bash
   npm run dev
   ```
   *Your application will be live at `http://localhost:9002`.*

## 🛡️ Admin Initialization & Security

If you are setting up the application for the very first time, your newly registered account will automatically be set to **Pending**. Because there are no existing admins to approve you, you must use the backend seeding script to bypass this and grant yourself the first "Admin" role. 

For strict guidelines on how to seed your first admin securely using the Firebase Admin SDK, please refer to the dedicated instructions in [seedadmin.md](./seedadmin.md).

## 🛠️ Technology Stack
- **Frontend Framework:** Next.js 14, React 18
- **Styling:** TailwindCSS, Vanilla CSS, `next-themes`
- **UI Architecture:** Radix UI primitives with customized visual aesthetics
- **Backend & Database:** Firebase Authentication, Cloud Firestore
- **Icons:** Lucide React
