// Authentication Integration for Chat System
// Bridges existing localStorage auth with Firebase Auth

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Authentication Integration Class
class AuthIntegration {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.authCallbacks = [];
        
        this.initializeAuth();
    }

    // Initialize authentication system
    async initializeAuth() {
        try {
            // Listen for auth state changes
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    this.currentUser = user;
                    await this.syncUserData(user);
                } else {
                    // Try to sign in with existing user data
                    await this.signInWithExistingData();
                }
                
                this.isInitialized = true;
                this.notifyAuthCallbacks(this.currentUser);
            });
            
        } catch (error) {
            console.error('Error initializing auth:', error);
            this.isInitialized = true;
            this.notifyAuthCallbacks(null);
        }
    }

    // Sign in using existing localStorage data
    async signInWithExistingData() {
        try {
            const userData = this.getExistingUserData();
            
            if (userData && userData.email) {
                // Try to create a consistent user ID based on email
                const userId = this.generateConsistentUserId(userData.email);
                
                // Sign in anonymously and then sync data
                const userCredential = await signInAnonymously(auth);
                
                // Create/update user profile in Firestore
                await this.createUserProfile(userCredential.user, userData);
                
                console.log('Successfully signed in with existing data');
                return userCredential.user;
            } else {
                // Create demo user for testing
                return await this.createDemoUser();
            }
            
        } catch (error) {
            console.error('Error signing in with existing data:', error);
            return await this.createDemoUser();
        }
    }

    // Get existing user data from localStorage
    getExistingUserData() {
        try {
            // Check multiple possible localStorage keys
            const possibleKeys = ['currentUser', 'userData', 'user', 'authUser'];
            
            for (const key of possibleKeys) {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed && (parsed.email || parsed.name)) {
                        return parsed;
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error getting existing user data:', error);
            return null;
        }
    }

    // Generate consistent user ID from email
    generateConsistentUserId(email) {
        // Simple hash function to generate consistent ID
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            const char = email.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return 'user_' + Math.abs(hash).toString(36);
    }

    // Create user profile in Firestore
    async createUserProfile(firebaseUser, userData) {
        try {
            const userProfile = {
                uid: firebaseUser.uid,
                email: userData.email || 'demo@example.com',
                name: userData.name || userData.fullName || 'User',
                userType: this.determineUserType(userData),
                
                // Student-specific fields
                university: userData.university || userData.universityName,
                yearOfStudy: userData.yearOfStudy,
                department: userData.department,
                studentId: userData.studentId,
                linkedinUrl: userData.linkedinUrl,
                
                // Employer-specific fields
                companyName: userData.companyName || userData.name,
                companyType: userData.companyType || userData.employerType,
                registrationNumber: userData.registrationNumber,
                
                // Chat-specific fields
                isOnline: true,
                lastSeen: serverTimestamp(),
                profilePicture: userData.profilePicture || this.generateAvatarUrl(userData.name || 'User'),
                
                // Metadata
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                
                // Original data for reference
                originalData: userData
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), userProfile, { merge: true });
            
            console.log('User profile created/updated:', userProfile);
            return userProfile;
            
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    }

    // Determine user type from existing data
    determineUserType(userData) {
        // Check for student indicators
        if (userData.yearOfStudy || userData.studentId || userData.university || userData.universityName) {
            return 'student';
        }
        
        // Check for employer indicators
        if (userData.companyName || userData.employerType || userData.registrationNumber) {
            return 'employer';
        }
        
        // Check URL or page context
        const currentPage = window.location.pathname;
        if (currentPage.includes('student')) {
            return 'student';
        } else if (currentPage.includes('employer')) {
            return 'employer';
        }
        
        // Default to student
        return 'student';
    }

    // Generate avatar URL
    generateAvatarUrl(name) {
        const initial = name.charAt(0).toUpperCase();
        const colors = ['d17e7e', '5a3e5d', '8c6c8e', '4a3249'];
        const colorIndex = name.length % colors.length;
        const color = colors[colorIndex];
        
        return `https://via.placeholder.com/100x100/${color}/ffffff?text=${initial}`;
    }

    // Create demo user for testing
    async createDemoUser() {
        try {
            const userCredential = await signInAnonymously(auth);
            
            const demoData = {
                email: 'demo@example.com',
                name: 'Demo User',
                userType: 'student',
                university: 'Demo University',
                yearOfStudy: 3,
                department: 'Computer Science'
            };

            await this.createUserProfile(userCredential.user, demoData);
            
            console.log('Demo user created');
            return userCredential.user;
            
        } catch (error) {
            console.error('Error creating demo user:', error);
            throw error;
        }
    }

    // Sync user data between systems
    async syncUserData(firebaseUser) {
        try {
            // Get user profile from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Update online status
                await updateDoc(doc(db, 'users', firebaseUser.uid), {
                    isOnline: true,
                    lastSeen: serverTimestamp()
                });
                
                // Update localStorage with Firebase data (optional)
                this.updateLocalStorage(userData);
                
                console.log('User data synced:', userData);
                return userData;
            }
            
        } catch (error) {
            console.error('Error syncing user data:', error);
        }
    }

    // Update localStorage with Firebase data
    updateLocalStorage(userData) {
        try {
            const localStorageData = {
                name: userData.name,
                email: userData.email,
                userType: userData.userType,
                university: userData.university,
                yearOfStudy: userData.yearOfStudy,
                department: userData.department,
                linkedinUrl: userData.linkedinUrl,
                firebaseUid: userData.uid
            };
            
            localStorage.setItem('currentUser', JSON.stringify(localStorageData));
            
        } catch (error) {
            console.error('Error updating localStorage:', error);
        }
    }

    // Sign out user
    async signOutUser() {
        try {
            if (this.currentUser) {
                // Update offline status
                await updateDoc(doc(db, 'users', this.currentUser.uid), {
                    isOnline: false,
                    lastSeen: serverTimestamp()
                });
            }
            
            await signOut(auth);
            this.currentUser = null;
            
            console.log('User signed out');
            
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Add auth state change callback
    onAuthStateChange(callback) {
        this.authCallbacks.push(callback);
        
        // If already initialized, call immediately
        if (this.isInitialized) {
            callback(this.currentUser);
        }
    }

    // Notify all auth callbacks
    notifyAuthCallbacks(user) {
        this.authCallbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Error in auth callback:', error);
            }
        });
    }

    // Get user profile data
    async getUserProfile(userId = null) {
        try {
            const uid = userId || this.currentUser?.uid;
            if (!uid) return null;
            
            const userDoc = await getDoc(doc(db, 'users', uid));
            return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
            
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    // Update user profile
    async updateUserProfile(updates) {
        try {
            if (!this.currentUser) throw new Error('No authenticated user');
            
            const userRef = doc(db, 'users', this.currentUser.uid);
            await updateDoc(userRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            
            console.log('User profile updated:', updates);
            
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Manual sign in with email/password (for future use)
    async signInWithEmail(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
            
        } catch (error) {
            console.error('Error signing in with email:', error);
            throw error;
        }
    }

    // Manual sign up with email/password (for future use)
    async signUpWithEmail(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await this.createUserProfile(userCredential.user, userData);
            return userCredential.user;
            
        } catch (error) {
            console.error('Error signing up with email:', error);
            throw error;
        }
    }
}

// Create and export auth integration instance
export const authIntegration = new AuthIntegration();

// Global access for debugging
window.authIntegration = authIntegration;

// Export for use in other modules
export default AuthIntegration;
