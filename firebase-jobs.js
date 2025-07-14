// Firebase Jobs Management System
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
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

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2Is7jXaYL4k04tSaI-CRzmtisQ5VSmz4",
    authDomain: "shift-3140e.firebaseapp.com",
    projectId: "shift-3140e",
    storageBucket: "shift-3140e.firebasestorage.app",
    messagingSenderId: "716245939154",
    appId: "1:716245939154:web:64d567a1ded3fa98b34e0b",
    measurementId: "G-F6WJ0T3E71"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Job Management Functions
class JobManager {
    constructor() {
        this.db = db;
        this.jobsCollection = 'jobs';
        this.applicationsCollection = 'applications';
    }

    // Publish a new job
    async publishJob(jobData) {
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
                employerId: jobData.employerId || null,
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
            
            const q = query(
                collection(this.db, this.jobsCollection),
                where('category', '==', category),
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

            console.log(`✅ Found ${jobs.length} jobs for category ${category}`);
            return jobs;
        } catch (error) {
            console.error('❌ Error fetching jobs:', error);
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
    async getJobsByEmployer(employerEmail) {
        try {
            console.log('🔍 Fetching jobs for employer:', employerEmail);
            
            const q = query(
                collection(this.db, this.jobsCollection),
                where('employerEmail', '==', employerEmail),
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

            console.log(`✅ Found ${jobs.length} jobs for employer ${employerEmail}`);
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

// Export for use in other files
export default JobManager;
