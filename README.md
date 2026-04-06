# SHIFT

SHIFT is a student-employer job platform built to make part-time hiring easier.
Students can discover opportunities and apply, while employers can post jobs, review applications, and manage the hiring flow in one place.

## Why This Project

Many students struggle to find flexible work experience, and many employers need reliable short-term talent.
SHIFT was built to connect both sides with a simple, practical workflow.

## What It Does

- Student and employer sign-up/sign-in
- Role-based pages (student, employer, admin)
- Employer job posting and job management
- Student job browsing and application flow
- Employer application review with status updates (accept, start, finished)
- Basic in-app notifications and chat integration

## My Role

I worked as a **Full-Stack Developer (Frontend + Firebase backend integration)**.

I contributed across both layers:

- Built and improved core UI pages and interactions using HTML, CSS, and JavaScript
- Connected UI workflows to Firebase Authentication and Firestore
- Implemented application status transitions and data syncing
- Added defensive handling for loading states, errors, and fallback behaviors

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (modular scripts)
- **Backend services:** Firebase Authentication, Cloud Firestore
- **Build/Dev tooling:** Vite

## A Key Challenge

One of the hardest parts was keeping the application workflow consistent across states (`accepted -> started -> finished`) while keeping the UI and database aligned.
we handled this by treating Firestore as the source of truth: update status first, then refresh/re-render the UI so users always see current data.

## Project Structure (high level)

- `index.html`, `landing.html` - entry and landing pages
- `student-*.html`, `student-*.js` - student flows
- `employer-*.html`, `employer-*.js` - employer flows
- `admin-*.html` - admin tools
- `firebase-auth.js`, `firebase-jobs.js`, `firebase-config.js` - auth and data integration
# Firebase Setup Guide for Chat Feature

This guide will help you set up Firebase for your Telegram-like chat feature.

## 🚀 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "shift-chat-platform")
4. Choose whether to enable Google Analytics (recommended)
5. Click "Create project"

## 🔧 Step 2: Configure Firebase Services

### Enable Authentication
1. In Firebase Console, go to "Authentication" > "Get started"
2. Go to "Sign-in method" tab
3. Enable the following providers:
   - **Email/Password** (for existing users)
   - **Google** (for Google OAuth integration)
4. For Google provider, use your existing Google OAuth credentials

### Set up Firestore Database
1. Go to "Firestore Database" > "Create database"
2. Choose "Start in test mode" (we'll secure it later)
3. Select a location close to your users
4. Click "Done"

### Enable Storage (for file sharing)
1. Go to "Storage" > "Get started"
2. Start in test mode
3. Choose the same location as Firestore

## 📱 Step 3: Add Web App to Firebase Project

1. In Firebase Console, click the web icon (</>) to add a web app
2. Enter app nickname (e.g., "Shift Chat Web")
3. Check "Also set up Firebase Hosting" if you want to deploy
4. Click "Register app"
5. **Copy the Firebase configuration object** - you'll need this!

## 🔑 Step 4: Update Configuration

1. Open `firebase-config.js` in your project
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

## 📦 Step 5: Install Firebase SDK

Add Firebase to your HTML files by including these scripts before your other JavaScript files:

```html
<!-- Firebase v9 SDK -->
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
  import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
  import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
  import { getStorage } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';
</script>
```

Or if using npm/package manager:
```bash
npm install firebase
```

## 🗄️ Step 6: Database Structure

Your Firestore will have these collections:

### Users Collection (`users`)
```
users/{userId}
├── uid: string
├── email: string
├── name: string
├── userType: "student" | "employer"
├── profilePicture: string
├── isOnline: boolean
├── lastSeen: timestamp
├── createdAt: timestamp
└── (other user data)
```

### Conversations Collection (`conversations`)
```
conversations/{conversationId}
├── id: string
├── participants: array of userIds
├── createdAt: timestamp
├── lastMessage: string
├── lastMessageTime: timestamp
├── unreadCount: object {userId: number}
└── messages (subcollection)
    └── messages/{messageId}
        ├── senderId: string
        ├── text: string
        ├── type: "text" | "image" | "file"
        ├── timestamp: timestamp
        ├── status: "sent" | "delivered" | "read"
        └── (other message data)
```

## 🔒 Step 7: Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read other users' basic info
    match /users/{userId} {
      allow read: if request.auth != null;
    }
    
    // Conversation access rules
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      // Messages within conversations
      match /messages/{messageId} {
        allow read, write: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
      }
    }
  }
}
```

## 🧪 Step 8: Test Your Setup

1. Open your browser's developer console
2. Try importing the Firebase config:
```javascript
import { chatService } from './firebase-config.js';
console.log('Firebase initialized:', chatService);
```

## 🚀 Step 9: Integration with Existing Auth

Since you already have user authentication, you'll need to:

1. **Sync existing users** with Firebase Auth
2. **Migrate localStorage data** to Firebase
3. **Update sign-in/sign-up flows** to use Firebase Auth

## 📋 Next Steps

After completing this setup:

1. ✅ Firebase project created and configured
2. ✅ Firestore database ready
3. ✅ Authentication enabled
4. ✅ Security rules applied
5. 🔄 Ready to implement chat UI and functionality

## 🆘 Troubleshooting

### Common Issues:
- **CORS errors**: Make sure you're serving files from a web server, not file://
- **Permission denied**: Check your Firestore security rules
- **Module import errors**: Ensure you're using the correct Firebase v9 syntax

### Testing Locally:
```bash
# Simple HTTP server
python -m http.server 8000
# or
npx serve .
```

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)

Once you complete this setup, we can move on to implementing the chat UI and real-time messaging functionality!



