// Firebase Authentication Integration
// Integrates Firebase Auth with existing signup/login forms

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2Is7jXaYL4k04tSaI-CRzmtisQ5VSmz4",
    authDomain: "shift-3140e.firebaseapp.com",
    databaseURL: "https://shift-3140e-default-rtdb.firebaseio.com",
    projectId: "shift-3140e",
    storageBucket: "shift-3140e.appspot.com",
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

// Firebase Auth Manager
class FirebaseAuthManager {
    constructor() {
        this.currentUser = null;
        this.authCallbacks = [];
        this.init();
    }

    init() {
        // Listen for auth state changes
        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            if (user) {
                await this.syncUserData(user);
            } else {
                // User signed out, clear localStorage
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userAuthenticated');
                localStorage.removeItem('employerInfo');
            }
            this.notifyAuthCallbacks(user);
        });

        // Initialize forms if they exist
        this.initializeSignupForms();
        this.initializeLoginForms();
    }

    // Initialize student signup form
    initializeSignupForms() {
        // Student signup form
        const studentForm = document.getElementById('student-signup-form');
        if (studentForm) {
            studentForm.addEventListener('submit', (e) => this.handleStudentSignup(e));
        }

        // Employer signup form
        const employerForm = document.getElementById('employer-signup-form');
        if (employerForm) {
            employerForm.addEventListener('submit', (e) => this.handleEmployerSignup(e));
        }
    }

    // Initialize login forms
    initializeLoginForms() {
        // Student login form
        const studentLoginForm = document.getElementById('student-login-form');
        if (studentLoginForm) {
            studentLoginForm.addEventListener('submit', (e) => this.handleStudentLogin(e));
        }

        // Employer login form
        const employerLoginForm = document.getElementById('employer-signin-form');
        if (employerLoginForm) {
            employerLoginForm.addEventListener('submit', (e) => this.handleEmployerLogin(e));
        }
    }

    // Handle student signup
    async handleStudentSignup(e) {
        e.preventDefault();

        // Check terms agreement
        const termsCheckbox = document.getElementById('terms-agreement');
        if (!termsCheckbox || !termsCheckbox.checked) {
            return;
        }

        const formData = new FormData(e.target);
        const userData = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            password: formData.get('password'),
            universityName: formData.get('universityName'),
            yearOfStudy: parseInt(formData.get('yearOfStudy')),
            department: formData.get('department'),
            linkedinUrl: formData.get('linkedinUrl'),
            userType: 'student',
            ID: formData.get('studentId'),
            termsAccepted: true,
            termsAcceptedAt: new Date().toISOString()
        };

        try {
            await this.registerUser(userData);
        } catch (error) {
            console.error('Student signup error:', error);
        }
    }

    // Handle employer signup
    async handleEmployerSignup(e) {
        e.preventDefault();

        // Check terms agreement
        const termsCheckbox = document.getElementById('terms-agreement');
        if (!termsCheckbox || !termsCheckbox.checked) {
            return;
        }

        const logoDataUrl = window.logoDataUrl || '';

        if (!logoDataUrl) {
            return;
        }

        const userData = {
            name: document.getElementById('employer-name')?.value,
            email: document.getElementById('employer-email')?.value,
            password: document.getElementById('employer-password')?.value,
            phone: document.getElementById('employer-phone')?.value,
            companyType: document.getElementById('employer-type')?.value,
            registrationNumber: document.getElementById('employer-reg')?.value,
            desiredDepartment: document.getElementById('employer-department')?.value,
            logo: logoDataUrl,
            userType: 'employer',
            termsAccepted: true,
            termsAcceptedAt: new Date().toISOString()
        };



        try {
            await this.registerUser(userData);
        } catch (error) {
            console.error('Employer signup error:', error);
        }
    }

    // Handle student login
    async handleStudentLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('student-email')?.value || 
                     document.querySelector('input[type="email"]')?.value;
        const password = document.getElementById('student-password')?.value || 
                        document.querySelector('input[type="password"]')?.value;

        try {
            await this.loginUser(email, password, 'student');
        } catch (error) {
            console.error('Student login error:', error);
        }
    }

    // Handle employer login
    async handleEmployerLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('employer-email')?.value;
        const password = document.getElementById('employer-password')?.value;

        try {
            await this.loginUser(email, password, 'employer');
        } catch (error) {
            console.error('Employer login error:', error);
        }
    }

    // Register new user
    async registerUser(userData) {
        try {
            // Show loading
            this.showLoading('Creating account...');

            // Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                userData.email, 
                userData.password
            );

            // Update profile
            await updateProfile(userCredential.user, {
                displayName: userData.fullName || userData.name
            });

            // Create user document in Firestore
            await this.createUserDocument(userCredential.user, userData);

            // Store in localStorage for compatibility
            this.updateLocalStorage(userData);

            this.hideLoading();
            alert('Account created successfully! Welcome to Shift.');

            // Redirect based on user type
            if (userData.userType === 'student') {
                window.location.href = 'studentlogin.html';
            } else {
                window.location.href = 'employer-signin.html';
            }

        } catch (error) {
            this.hideLoading();
            if (error?.code === 'auth/email-already-in-use') {
                alert('This email is already in use. Try logging in instead.');
                return;
            }
            if (error?.code === 'storage/unauthorized' || error?.code === 'storage/cors') {
                alert('Upload blocked by browser/CORS. Please retry or use a different browser.');
                return;
            }
            throw error;
        }
    }

    // Login user
    async loginUser(email, password, userTypeHint) {
        try {
            this.showLoading('Signing in...');

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Get user data from Firestore
            const userRef = doc(db, 'users', userCredential.user.uid);
            let userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                this.updateLocalStorage(userData);
                
                this.hideLoading();

                // Redirect based on user type
                if (userData.userType === 'student') {
                    window.location.href = 'Job-listing.html';
                } else {
                    window.location.href = 'job-catagory.html';
                }
            } else {
                // Create a minimal profile if missing
                const minimalData = {
                    email: userCredential.user.email,
                    userType: userTypeHint || 'student',
                    name: userCredential.user.displayName || (userCredential.user.email ? userCredential.user.email.split('@')[0] : 'User')
                };
                const created = await this.createUserDocument(userCredential.user, minimalData);
                this.updateLocalStorage(created);
                this.hideLoading();
                if (created.userType === 'student') {
                    window.location.href = 'Job-listing.html';
                } else {
                    window.location.href = 'job-catagory.html';
                }
            }

        } catch (error) {
            this.hideLoading();
            throw error;
        }
    }

    // Create user document in Firestore
    async createUserDocument(firebaseUser, userData) {
        // Helper function to check if value is safe for Firestore
        const isSafeValue = (value) => {
            return value !== undefined &&
                   value !== null &&
                   typeof value !== 'object' ||
                   value instanceof Date ||
                   Array.isArray(value);
        };

        const userProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userData.fullName || userData.name,
            userType: userData.userType,

            // Chat fields
            isOnline: true,
            lastSeen: new Date(),
            profilePicture: this.generateAvatarUrl(userData.fullName || userData.name),

            // Metadata
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Add student-specific fields only if they exist and are safe
        if (userData.userType === 'student') {
            if (userData.universityName && isSafeValue(userData.universityName)) {
                userProfile.university = userData.universityName;
            }
            if (userData.yearOfStudy && isSafeValue(userData.yearOfStudy)) {
                userProfile.yearOfStudy = userData.yearOfStudy;
            }
            if (userData.department && isSafeValue(userData.department)) {
                userProfile.department = userData.department;
            }
            if (userData.linkedinUrl && isSafeValue(userData.linkedinUrl)) {
                userProfile.linkedinUrl = userData.linkedinUrl;
            }
            // Note: File fields like studentId are intentionally excluded
        }

        // Add employer-specific fields only if they exist and are safe
        if (userData.userType === 'employer') {
            if (userData.name && isSafeValue(userData.name)) {
                userProfile.companyName = userData.name;
            }
            if (userData.companyType && isSafeValue(userData.companyType)) {
                userProfile.companyType = userData.companyType;
            }
            if (userData.phone && isSafeValue(userData.phone)) {
                userProfile.phone = userData.phone;
            }
            if (userData.registrationNumber && isSafeValue(userData.registrationNumber)) {
                userProfile.registrationNumber = userData.registrationNumber;
            }
            if (userData.logo && isSafeValue(userData.logo)) {
                userProfile.logo = userData.logo;
            }
            if (userData.desiredDepartment && isSafeValue(userData.desiredDepartment)) {
                userProfile.desiredDepartment = userData.desiredDepartment;
            }
        }


        await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
        return userProfile;
    }

    // Generate avatar using canvas
    generateAvatarUrl(name, size = 100) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        // Background color based on name
        const colors = ['#d17e7e', '#5a3e5d', '#8c6c8e', '#4a3249', '#7e9dd1', '#7ed17e'];
        const colorIndex = name ? name.length % colors.length : 0;

        // Draw background
        ctx.fillStyle = colors[colorIndex];
        ctx.fillRect(0, 0, size, size);

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${size * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initial = name ? name.charAt(0).toUpperCase() : 'U';
        ctx.fillText(initial, size / 2, size / 2);

        return canvas.toDataURL();
    }

    // Update localStorage for compatibility
    updateLocalStorage(userData) {
        // Ensure yearOfStudy is properly converted to number
        const yearOfStudy = parseInt(userData.yearOfStudy) || parseInt(userData.year) || 2;

        // Base fields for all users
        const localData = {
            name: userData.fullName || userData.name,
            email: userData.email,
            userType: userData.userType,
            firebaseUid: this.currentUser?.uid,
            lastUpdated: new Date().toISOString()
        };

        // Student-specific fields
        if (userData.userType === 'student') {
            localData.university = userData.universityName || userData.university;
            localData.yearOfStudy = yearOfStudy;
            localData.department = userData.department;
            localData.linkedinUrl = userData.linkedinUrl;
        }

        // Employer-specific fields
        if (userData.userType === 'employer') {
            localData.companyName = userData.name;
            localData.companyType = userData.companyType;
            localData.phone = userData.phone;
            localData.registrationNumber = userData.registrationNumber;
            localData.logo = userData.logo;
            localData.desiredDepartment = userData.desiredDepartment;
        }

        localStorage.setItem('currentUser', JSON.stringify(localData));
        localStorage.setItem('employerInfo', JSON.stringify(localData)); // Also update employerInfo for profile page
        localStorage.setItem('userAuthenticated', 'true');

    }

    // Sync user data
    async syncUserData(user) {
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                this.updateLocalStorage(userData);
            }
        } catch (error) {
            console.error('Error syncing user data:', error);
        }
    }

    // Get all users for chat
    async getAllUsers() {
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            
            const users = [];
            snapshot.forEach((doc) => {
                const userData = doc.data();
                if (doc.id !== this.currentUser?.uid) {
                    users.push({
                        id: doc.id,
                        ...userData
                    });
                }
            });
            
            return users;
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

    // Sign out
    async signOutUser() {
        try {
            if (this.currentUser) {
                // Update offline status
                const userRef = doc(db, 'users', this.currentUser.uid);
                await updateDoc(userRef, {
                    isOnline: false,
                    lastSeen: new Date()
                });
            }

            await signOut(auth);
            this.currentUser = null;

            // Clear localStorage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userAuthenticated');

    
            window.location.href = 'landing.html';
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    // Auth state callbacks
    onAuthStateChange(callback) {
        this.authCallbacks.push(callback);
        if (this.currentUser) {
            callback(this.currentUser);
        }
    }

    notifyAuthCallbacks(user) {
        this.authCallbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth callback error:', error);
            }
        });
    }

    // UI helpers
    showLoading(message = 'Loading...') {
        let loader = document.getElementById('auth-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'auth-loader';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            loader.innerHTML = `
                <div style="width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #d17e7e; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px;"></div>
                <div style="color: #333; font-size: 16px;">${message}</div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    }

    hideLoading() {
        const loader = document.getElementById('auth-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Create global instance
const firebaseAuth = new FirebaseAuthManager();

// Export for use in other modules
export default firebaseAuth;
window.firebaseAuth = firebaseAuth;
