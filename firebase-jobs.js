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
} catch (e) {
  app = initializeApp(firebaseConfig);
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
        });
    }

    // Publish a new job
    async publishJob(jobData) {
        const user = window.firebaseAuth && window.firebaseAuth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated to publish jobs');
        }

        try {
            const jobDoc = {
                title: jobData.title,
                description: jobData.description,
                paymentCode: jobData.paymentCode,
                expectedHours: jobData.expectedHours,
                category: jobData.category,
                categoryTitle: jobData.categoryTitle,
                employerName: jobData.employerName,
                employerEmail: jobData.employerEmail,
                employerId: user.uid,
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(this.db, this.jobsCollection), jobDoc);

            return {
                success: true,
                jobId: docRef.id,
                message: 'Job published successfully!'
            };
        } catch (error) {
            console.error('Error publishing job:', error.message);
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

            return jobs;
        } catch (error) {
            console.error('Error fetching jobs:', error.message);
            return [];
        }
    }

    // Get all jobs
    async getAllJobs() {
        try {
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

            return jobs;
        } catch (error) {
            console.error('Error fetching all jobs:', error.message);
            return [];
        }
    }

    // Get jobs by employer
    async getJobsByEmployer(employerId) {
        if (!employerId) {
            const user = window.firebaseAuth && window.firebaseAuth.currentUser;
            if (!user) {
                return [];
            }
            employerId = user.uid;
        }
        try {
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

            return jobs;
        } catch (error) {
            console.error('Error fetching employer jobs:', error.message);
            return [];
        }
    }

    // Submit job application
    async submitApplication(applicationData) {
        try {
            const appDoc = {
                jobId: applicationData.jobId,
                jobTitle: applicationData.jobTitle,
                jobCategory: applicationData.jobCategory,
                employerName: applicationData.employerName,
                employerEmail: applicationData.employerEmail,
                employerId: applicationData.employerId,
                studentName: applicationData.studentName,
                studentEmail: applicationData.studentEmail,
                studentYear: applicationData.studentYear,
                studentUniversity: applicationData.studentUniversity,
                studentDepartment: applicationData.studentDepartment,
                studentId: applicationData.studentId,
                status: 'applied',
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(this.db, this.applicationsCollection), appDoc);
            
            return {
                success: true,
                applicationId: docRef.id,
                message: 'Application submitted successfully!'
            };
        } catch (error) {
            console.error('Error submitting application:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get applications for employer
    async getApplicationsByEmployer(employerId) {
        try {
            if (!employerId) {
                return [];
            }
            
            const q = query(
                collection(this.db, this.applicationsCollection),
                where('employerId', '==', employerId),
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

            return applications;
        } catch (error) {
            console.error('Error fetching applications:', error.message);
            return [];
        }
    }
}

// Create global instance
window.jobManager = new JobManager();
window.firebaseFirestore = window.jobManager.db;

// Export for use in other files
export default JobManager;
