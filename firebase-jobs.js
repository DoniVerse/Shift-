// Firebase Jobs Management System
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2Is7jXaYL4k04tSaI-CRzmtisQ5VSmz4",
    authDomain: "shift-3140e.firebaseapp.com",
    projectId: "shift-3140e",
    storageBucket: "shift-3140e.firebaseapp.com",
    messagingSenderId: "716245939154",
    appId: "1:716245939154:web:64d567a1ded3fa98b34e0b",
    measurementId: "G-F6WJ0T3E71"
};

// Initialize or get existing Firebase App
let app;
try {
  app = getApp();
  console.log('Using existing Firebase app');
} catch (e) {
  app = initializeApp(firebaseConfig);
  console.log('Initialized new Firebase app');
}

const db = getFirestore(app);
const auth = getAuth(app);

// Job Management Functions
class JobManager {
    constructor() {
        this.db = db;
        this.jobsCollection = 'jobs';
        this.applicationsCollection = 'applications';
        this.auth = auth;
        this.currentUser = null;

        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            console.log('🔐 Auth state changed:', user ? `Logged in as ${user.email}` : 'Not logged in');
        });
    }

    // Publish a new job
    async publishJob(jobData) {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to publish jobs');
        }

        try {
            console.log('📝 Publishing job to Firebase:', jobData);
            console.log('🔍 Firebase config:', this.db.app.options);

            const jobDoc = {
                title: jobData.title,
                description: jobData.description,
                paymentCode: jobData.paymentCode,
                expectedHours: jobData.expectedHours,
                category: jobData.category,
                categoryTitle: jobData.categoryTitle,
                employerName: jobData.employerName,
                employerEmail: jobData.employerEmail,
                employerId: this.currentUser.uid,
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            console.log('🔍 Attempting to write to collection:', this.jobsCollection);
            console.log('🔍 Document data:', jobDoc);

            const docRef = await addDoc(collection(this.db, this.jobsCollection), jobDoc);
            console.log('✅ Job published with ID:', docRef.id);

            return {
                success: true,
                jobId: docRef.id,
                message: 'Job published successfully!'
            };
        } catch (error) {
            console.error('❌ Error publishing job:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            console.error('❌ Full error:', error);

            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    // Get jobs by category
    async getJobsByCategory(category) {
        try {
            console.log('🔍 Fetching jobs for category:', category);

            // Simplified query without orderBy to avoid index requirement
            const q = query(
                collection(this.db, this.jobsCollection),
                where('category', '==', category),
                where('status', '==', 'active')
            );

            const querySnapshot = await getDocs(q);
            const jobs = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                jobs.push({
                    id: doc.id,
                    ...data,
                    // Convert Firestore timestamp to JavaScript date for sorting
                    createdAt: data.createdAt?.toDate?.() || new Date(data.timestamp || Date.now())
                });
            });

            // Sort manually by creation date (newest first)
            jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            console.log(`✅ Found ${jobs.length} jobs for category ${category}`);
            return jobs;
        } catch (error) {
            console.error('❌ Error fetching jobs:', error);
            console.error('❌ Error details:', error.code, error.message);
            return [];
        }
    }

    // Get all jobs
    async getAllJobs() {
        try {
            console.log('🔍 Fetching all jobs');
            
            const q = query(
                collection(this.db, this.jobsCollection),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const jobs = [];
            
            querySnapshot.forEach((doc) => {
                jobs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`✅ Found ${jobs.length} total jobs`);
            return jobs;
        } catch (error) {
            console.error('❌ Error fetching all jobs:', error);
            return [];
        }
    }

    // Get jobs by employer
    async getJobsByEmployer(employerId) {
        try {
            if (!employerId) {
                console.error('🚫 No employerId provided');
                return [];
            }
            console.log('🔍 Fetching jobs for employer:', employerId);

            const q = query(
                collection(this.db, this.jobsCollection),
                where('employerId', '==', employerId),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const jobs = [];
            
            querySnapshot.forEach((doc) => {
                jobs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`✅ Found ${jobs.length} jobs for employer ${employerId}`);
            return jobs;
        } catch (error) {
            console.error('❌ Error fetching employer jobs:', error);
            return [];
        }
    }

    // Submit job application
    async submitApplication(applicationData) {
        try {
            console.log('📝 Submitting application to Firebase:', applicationData);
            
            const appDoc = {
                jobId: applicationData.jobId,
                jobTitle: applicationData.jobTitle,
                jobCategory: applicationData.jobCategory,
                employerName: applicationData.employerName,
                employerEmail: applicationData.employerEmail,
                studentName: applicationData.studentName,
                studentEmail: applicationData.studentEmail,
                studentYear: applicationData.studentYear,
                studentUniversity: applicationData.studentUniversity,
                studentDepartment: applicationData.studentDepartment,
                studentId: applicationData.studentId, // Always include studentId (Firebase UID)
                status: 'applied',
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(this.db, this.applicationsCollection), appDoc);
            console.log('✅ Application submitted with ID:', docRef.id);
            
            return {
                success: true,
                applicationId: docRef.id,
                message: 'Application submitted successfully!'
            };
        } catch (error) {
            console.error('❌ Error submitting application:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get applications for employer
    async getApplicationsByEmployer(employerEmail) {
        try {
            console.log('🔍 Fetching applications for employer:', employerEmail);
            
            const q = query(
                collection(this.db, this.applicationsCollection),
                where('employerEmail', '==', employerEmail),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const applications = [];
            
            querySnapshot.forEach((doc) => {
                applications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`✅ Found ${applications.length} applications for employer ${employerEmail}`);
            return applications;
        } catch (error) {
            console.error('❌ Error fetching applications:', error);
            return [];
        }
    }
}

// Create global instance
window.jobManager = new JobManager();
window.firebaseFirestore = window.jobManager.db;
console.log('window.firebaseFirestore set by firebase-jobs.js!');

// Export for use in other files
export default JobManager;
