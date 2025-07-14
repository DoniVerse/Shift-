// Local Jobs Management System (localStorage + sync)
class LocalJobsManager {
    constructor() {
        this.jobsKey = 'jobs';
        this.applicationsKey = 'jobApplications';
        this.syncKey = 'jobsLastSync';
        
        // Initialize if not exists
        if (!localStorage.getItem(this.jobsKey)) {
            localStorage.setItem(this.jobsKey, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.applicationsKey)) {
            localStorage.setItem(this.applicationsKey, JSON.stringify([]));
        }
    }

    // Generate unique ID
    generateId() {
        return 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Publish a new job
    publishJob(jobData) {
        try {
            console.log('📝 Publishing job locally:', jobData);
            
            const job = {
                id: this.generateId(),
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
                createdAt: new Date().toISOString(),
                timestamp: Date.now(),
                source: 'local'
            };

            const jobs = this.getAllJobs();
            jobs.push(job);
            localStorage.setItem(this.jobsKey, JSON.stringify(jobs));
            
            console.log('✅ Job published locally with ID:', job.id);
            
            return {
                success: true,
                jobId: job.id,
                message: 'Job published successfully!'
            };
        } catch (error) {
            console.error('❌ Error publishing job locally:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all jobs
    getAllJobs() {
        try {
            return JSON.parse(localStorage.getItem(this.jobsKey) || '[]');
        } catch (error) {
            console.error('Error getting jobs:', error);
            return [];
        }
    }

    // Get jobs by category
    getJobsByCategory(category) {
        try {
            const allJobs = this.getAllJobs();
            const categoryJobs = allJobs.filter(job => 
                job.category === category && job.status === 'active'
            );
            
            console.log(`✅ Found ${categoryJobs.length} jobs for category ${category}`);
            return categoryJobs;
        } catch (error) {
            console.error('❌ Error fetching jobs by category:', error);
            return [];
        }
    }

    // Get jobs by employer
    getJobsByEmployer(employerEmail) {
        try {
            const allJobs = this.getAllJobs();
            const employerJobs = allJobs.filter(job => 
                job.employerEmail === employerEmail
            );
            
            console.log(`✅ Found ${employerJobs.length} jobs for employer ${employerEmail}`);
            return employerJobs;
        } catch (error) {
            console.error('❌ Error fetching employer jobs:', error);
            return [];
        }
    }

    // Submit job application
    submitApplication(applicationData) {
        try {
            console.log('📝 Submitting application locally:', applicationData);
            
            const application = {
                id: this.generateId(),
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
                createdAt: new Date().toISOString(),
                timestamp: Date.now()
            };

            const applications = this.getAllApplications();
            applications.push(application);
            localStorage.setItem(this.applicationsKey, JSON.stringify(applications));
            
            console.log('✅ Application submitted locally with ID:', application.id);
            
            return {
                success: true,
                applicationId: application.id,
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

    // Get all applications
    getAllApplications() {
        try {
            return JSON.parse(localStorage.getItem(this.applicationsKey) || '[]');
        } catch (error) {
            console.error('Error getting applications:', error);
            return [];
        }
    }

    // Get applications for employer
    getApplicationsByEmployer(employerEmail) {
        try {
            const allApplications = this.getAllApplications();
            const employerApplications = allApplications.filter(app => 
                app.employerEmail === employerEmail
            );
            
            console.log(`✅ Found ${employerApplications.length} applications for employer ${employerEmail}`);
            return employerApplications;
        } catch (error) {
            console.error('❌ Error fetching applications:', error);
            return [];
        }
    }

    // Delete job
    deleteJob(jobId) {
        try {
            const jobs = this.getAllJobs();
            const updatedJobs = jobs.filter(job => job.id !== jobId);
            localStorage.setItem(this.jobsKey, JSON.stringify(updatedJobs));
            
            console.log('✅ Job deleted:', jobId);
            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting job:', error);
            return { success: false, error: error.message };
        }
    }

    // Update application status
    updateApplicationStatus(applicationId, status) {
        try {
            const applications = this.getAllApplications();
            const appIndex = applications.findIndex(app => app.id === applicationId);
            
            if (appIndex !== -1) {
                applications[appIndex].status = status;
                applications[appIndex].updatedAt = new Date().toISOString();
                localStorage.setItem(this.applicationsKey, JSON.stringify(applications));
                
                console.log('✅ Application status updated:', applicationId, status);
                return { success: true };
            } else {
                throw new Error('Application not found');
            }
        } catch (error) {
            console.error('❌ Error updating application status:', error);
            return { success: false, error: error.message };
        }
    }

    // Clear all data (for testing)
    clearAllData() {
        localStorage.removeItem(this.jobsKey);
        localStorage.removeItem(this.applicationsKey);
        localStorage.removeItem(this.syncKey);
        console.log('🗑️ All job data cleared');
    }

    // Get statistics
    getStats() {
        const jobs = this.getAllJobs();
        const applications = this.getAllApplications();
        
        return {
            totalJobs: jobs.length,
            activeJobs: jobs.filter(job => job.status === 'active').length,
            totalApplications: applications.length,
            categories: [...new Set(jobs.map(job => job.category))],
            employers: [...new Set(jobs.map(job => job.employerEmail))]
        };
    }
}

// Create global instance
window.localJobsManager = new LocalJobsManager();

console.log('📋 Local Jobs Manager initialized');
console.log('📊 Current stats:', window.localJobsManager.getStats());
