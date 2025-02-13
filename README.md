# 🚀 Quizcraft

Quizcraft is an interactive **quiz-based platform** designed for educators, students, and trivia enthusiasts. Built with **React, Node.js, and MongoDB**, it supports both casual and educational quizzes with real-time participation.

---

## 📌 Features

- 🎯 **Create & Manage Quizzes** – Admins & users can create, edit, and manage quizzes.
- 🔥 **Live Quiz Participation** – Play quizzes in real-time.
- 📊 **Analytics & Reporting** – View performance stats and quiz history.
- 🛠 **Admin Panel** – Manage users, quizzes, and performance data.
- 🔐 **Secure Authentication** – Sign-up/login with password hashing.
- 📱 **Responsive UI** – Optimized for desktop & mobile.

---

## 🚀 Getting Started

### **1️⃣ Clone the Repository**

To get a copy of Quizcraft, run:

```sh
git clone https://github.com/SaugatGhimire07/quiz-craft.git
cd quiz-craft
```

---

### **2️⃣ Install Dependencies**

#### **Backend (Node.js + Express)**

```sh
cd server
npm install
```

#### **Frontend (React + Vite)**

```sh
cd ../client
npm install
```

---

### **3️⃣ Set Up MongoDB (Using MongoDB Compass)**

#### **1️⃣ Open MongoDB Compass & Connect to Local Database**

- Open **MongoDB Compass**.
- Click **"New Connection"** and enter:
  ```
  mongodb://127.0.0.1:27017
  ```
- Click **"Connect"**.

#### **2️⃣ Create a Database Named `quizcraft`**

- In Compass, click **"Create Database"**.
- Name it **quizcraft**.
- Create a collection (e.g., `users` or `quizzes`).

#### **3️⃣ Update Environment Variables**

Inside `server/.env`, set the **MongoDB URI**:

```
MONGO_URI=mongodb://127.0.0.1:27017/quizcraft
PORT=5001
```

---

### **4️⃣ Start the Project**

#### **Start the Backend (Node.js)**

```sh
cd server
npm run dev
```

#### **Start the Frontend (React)**

```sh
cd ../client
npm run dev
```

The frontend should be accessible at **http://localhost:5173**.  
The backend API should be running at **http://localhost:5001**.

---

## 🔀 Contributing (Pull Request Workflow)

To contribute, follow these steps:

### **1️⃣ Create a Feature Branch**

```sh
git checkout -b feature/your-feature-name
```

### **2️⃣ Make Changes & Commit**

```sh
git add .
git commit -m "Added a new feature"
```

### **3️⃣ Push to GitHub**

```sh
git push origin feature/your-feature-name
```

### **4️⃣ Create a Pull Request (PR)**

- Go to GitHub **https://github.com/SaugatGhimire07/quiz-craft**.
- Click **"New Pull Request"**.
- Select your branch and submit a PR for review.
- Wait for approval before merging.

---

## ⚙️ Technologies Used

- **Frontend:** React, Vite, React Router
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB (Compass)
- **Styling:** Tailwind

🚀 **Happy Coding!** 🎉
