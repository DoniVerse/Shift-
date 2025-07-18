// Authentication Router - Handles session management and redirects
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2Is7jXaYL4k04tSaI-CRzmtisQ5VSmz4",
    authDomain: "shift-3140e.firebaseapp.com",
    databaseURL: "https://shift-3140e-default-rtdb.firebaseio.com",
    projectId: "shift-3140e",
    storageBucket: "shift-3140e.firebasestorage.app",
    messagingSenderId: "716245939154",
    appId: "1:716245939154:web:64d567a1ded3fa98b34e0b",
    measurementId: "G-F6WJ0T3E71"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}
const auth = getAuth(app);
const db = getFirestore(app);

class AuthRouter {
    constructor() {
        this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
        this.publicPages = [
            'landing.html',
            'studentsignup.html',
            'studentlogin.html',
            'employer-signup.html',
            'employer-signin.html',
            'index.html',
            ''
        ];
        this.studentPages = [
            'Job-listing.html',
            'job-catagory.html',
            'student-profile.html',
            'chat.html'
        ];
        this.employerPages = [
            'employer-profile.html',
            'add-job.html',
            'chat.html'
        ];
        
        this.init();
    }

    init() {
        console.log('🔄 AuthRouter: Initializing authentication check...');
        console.log('Current page:', this.currentPage);
        
        // Show loading state
        this.showLoadingState();
        
        // Listen for auth state changes
        onAuthStateChanged(auth, async (user) => {
            console.log('🔄 Auth state changed:', user ? 'Logged in' : 'Not logged in');
            
            if (user) {
                await this.handleAuthenticatedUser(user);
            } else {
                this.handleUnauthenticatedUser();
            }
            
            this.hideLoadingState();
        });
    }

    async handleAuthenticatedUser(user) {
        console.log('✅ User is authenticated:', user.email);
        
        try {
            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('📄 User data:', userData);
                
                // Update localStorage with fresh data
                this.updateLocalStorage(userData, user);
                
                // Redirect based on user type and current page
                this.redirectAuthenticatedUser(userData);
            } else {
                console.error('❌ User document not found in Firestore');
                this.redirectToSignup();
            }
        } catch (error) {
            console.error('❌ Error fetching user data:', error);
            this.redirectToLanding();
        }
    }

    handleUnauthenticatedUser() {
        console.log('❌ User is not authenticated');
        
        // Clear any stale localStorage data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userAuthenticated');
        
        // If user is on a protected page, redirect to landing
        if (!this.publicPages.includes(this.currentPage)) {
            console.log('🔄 Redirecting unauthenticated user to landing page');
            this.redirectToLanding();
        } else {
            console.log('✅ User is on public page, no redirect needed');
        }
    }

    redirectAuthenticatedUser(userData) {
        const userType = userData.userType;
        console.log('🎯 Redirecting authenticated user:', userType);
        
        // If user is on landing page or auth pages, redirect to their dashboard
        if (this.publicPages.includes(this.currentPage)) {
            if (userType === 'student') {
                console.log('🎓 Redirecting student to job listing');
                window.location.href = 'Job-listing.html';
            } else if (userType === 'employer') {
                console.log('🏢 Redirecting employer to profile');
                window.location.href = 'employer-profile.html';
            }
            return;
        }
        
        // Check if user is on wrong type of page
        if (userType === 'student' && this.employerPages.includes(this.currentPage)) {
            console.log('🔄 Student on employer page, redirecting to job listing');
            window.location.href = 'Job-listing.html';
        } else if (userType === 'employer' && this.studentPages.includes(this.currentPage)) {
            console.log('🔄 Employer on student page, redirecting to profile');
            window.location.href = 'employer-profile.html';
        } else {
            console.log('✅ User is on correct page for their type');
        }
    }

    redirectToLanding() {
        if (this.currentPage !== 'landing.html') {
            console.log('🔄 Redirecting to landing page');
            window.location.href = 'landing.html';
        }
    }

    redirectToSignup() {
        console.log('🔄 Redirecting to signup page');
        window.location.href = 'studentsignup.html';
    }

    updateLocalStorage(userData, firebaseUser) {
        const localData = {
            name: userData.name,
            email: userData.email,
            userType: userData.userType,
            university: userData.university,
            yearOfStudy: userData.yearOfStudy,
            department: userData.department,
            linkedinUrl: userData.linkedinUrl,
            firebaseUid: firebaseUser.uid,
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('currentUser', JSON.stringify(localData));
        localStorage.setItem('userAuthenticated', 'true');
        console.log('💾 Updated localStorage with user data');
    }

    showLoadingState() {
        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'auth-loading';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: Arial, sans-serif;
        `;
        loadingOverlay.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #d17e7e; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p style="margin: 0; color: #666;">Checking authentication...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingOverlay);
    }

    hideLoadingState() {
        const loadingOverlay = document.getElementById('auth-loading');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
}

// Initialize auth router when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthRouter();
});

// Export for use in other files
window.AuthRouter = AuthRouter;
