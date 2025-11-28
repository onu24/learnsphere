# LearnSphere

A premium platform for purchasing professional PDF course materials with a modern shopping experience. Built with React, TypeScript, Tailwind CSS, and Firebase.

## 🚀 Features

- **Course Listings**: Browse 8 distinct professional courses with video trailers.
- **Shopping Cart**: Real-time cart management with local storage persistence.
- **User Authentication**: Secure Login and Registration using Firebase Auth.
- **Payment Simulation**: Mock UPI payment verification (simulating bank API).
- **Automated Delivery**:
  - Instant transaction verification.
  - Automatic email receipts via EmailJS.
  - Receipt download fallback.
- **Admin Dashboard**:
  - View and confirm transactions.
  - Add/Edit/Delete courses.
  - Bulk Import courses via CSV.
  - Reset database tools.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS (Glassmorphism design)
- **Backend (Serverless)**: Firebase Firestore & Authentication
- **Services**: EmailJS (Transactional Emails)

## 📦 How to Push to GitHub

To push this existing code to your repository `https://github.com/onu24/learn-sphere`, open your terminal in the project folder and run:

```bash
# 1. Initialize Git
git init

# 2. Add all files
git add .

# 3. Commit the changes
git commit -m "Initial commit: LearnSphere V1"

# 4. Rename branch to main
git branch -M main

# 5. Link to your repository
git remote add origin https://github.com/onu24/learn-sphere

# 6. Push code
git push -u origin main
```

## 🔧 Setup & Installation

1. Clone the repo
   ```bash
   git clone https://github.com/onu24/learn-sphere
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Run the development server
   ```bash
   npm start
   ```

## 🔑 Configuration

This project uses Firebase. Ensure you update `services/firebase.ts` with your own Firebase Config keys if cloning a fresh copy.

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
