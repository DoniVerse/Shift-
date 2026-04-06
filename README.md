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



