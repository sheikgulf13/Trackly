# 📝 Task Manager

**Live Website:** [https://taskmanager.yourdomain.com](https://trackly-iota.vercel.app/)

A simple full-stack Task Manager application built with **Next.js**, **Node.js**, **Express**, **MongoDB**, and **Mongoose**. It supports user authentication, task CRUD operations, real-time updates using WebSockets, and email fallback notifications for reliability.

---

## 🚀 Setup Instructions

### Prerequisites

Ensure the following are installed:

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm (v6 or higher)

### Installation

1. **Clone the repository**:

bash
git clone https://github.com/your-username/task-manager.git
cd task-manager
npm install
nodemon

🧠 Approach Explanation
This full-stack app is designed with scalability and responsiveness in mind.

Frontend (Next.js + React):
 - pages for login, register, dashboard and tasks
 - Animations powered by Framer Motion

Backend (Express + MongoDB):
 - API routes for auth, user, admin and task management
 - Secure user authentication with JWT
 - Passwords are hashed using bcrypt
 - Real-time task assigned notification using Socket.IO
 - Email notifications sent via NodeMailer as a fallback in case WebSocket delivery fails

⚙️ Technologies Used
Frontend:
 -Next.js
 -React.js
 -Framer Motion
 -Axios
 -Socket.IO-client

Backend:
 -Node.js
 -Express.js
 -MongoDB + Mongoose
 -Socket.IO
 -bcrypt
 -JWT (jsonwebtoken)
 -NodeMailer (for email notifications)

📌 Assumptions & Trade-offs
Assumptions:
 -Users will not exceed the bcrypt password length limit (see below).
 -MongoDB connection is assumed to be reliable (Atlas or local).
 -Users are expected to use modern browsers that support WebSockets.

Trade-offs:
 -✅ Using bcrypt (⚠️ Important Limitation)
  Currently, bcrypt is used for hashing passwords. While it's widely supported and secure in most cases, it has a critical limitation:
bcrypt only evaluates the first 72 bytes of a password. Any characters beyond that are silently ignored.
This means a password like 123456789012345678901234567890123456789012345678901234567890123456ABC is treated the same as the same string without ABC — a serious security risk for users with long passwords.

🔐 Better Alternative: PBKDF2
A more robust and secure hashing method is PBKDF2 (Password-Based Key Derivation Function 2), which:
Does not ignore extra characters
Is more resilient to brute-force and dictionary attacks
Should be preferred in production systems for long-term password safety

✅ In future versions, password hashing will migrate to PBKDF2 for improved security.

✉️ Email Notification Fallback
Real-time task updates use WebSockets (Socket.IO).
However, WebSocket connections may fail due to:
Network instability
Browser restrictions
Firewalls or mobile limitations
To ensure critical updates are still delivered:
Email notifications are sent for important events like new task assignments or overdue reminders.
This improves reliability and ensures users don't miss updates even without a live socket connection.

💡 Future Enhancements:
🔐 Switch from bcrypt to PBKDF2 or Argon2 for password hashing
🌐 i18n for multi-language support
📲 Mobile app using React Native

🧑‍💻 Author
Made with ❤️ by Sheik Gulfaan
