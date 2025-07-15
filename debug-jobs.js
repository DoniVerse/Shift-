// Debug script to check job categories and Firebase connectivity
console.log('🔍 Starting job debug...');

// Check what jobs are in localStorage
const localJobs = JSON.parse(localStorage.getItem('jobs') || '[]');
console.log('📋 Local jobs found:', localJobs.length);
localJobs.forEach((job, index) => {
    console.log(`Job ${index + 1}:`, {
        title: job.title,
        category: job.category,
        employer: job.employerName,
        created: job.timestamp ? new Date(job.timestamp).toLocaleString() : 'No timestamp'
    });
});

// Check Firebase connection
if (window.jobManager) {
    console.log('🔥 Firebase jobManager available');
    
    // Test Firebase job fetching
    window.jobManager.getAllJobs().then(firebaseJobs => {
        console.log('🔥 Firebase jobs found:', firebaseJobs.length);
        firebaseJobs.forEach((job, index) => {
            console.log(`Firebase Job ${index + 1}:`, {
                title: job.title,
                category: job.category,
                employer: job.employerName,
                created: job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleString() : 'No timestamp'
            });
        });
    }).catch(error => {
        console.error('🔥 Firebase error:', error);
    });
} else {
    console.log('❌ Firebase jobManager NOT available');
}

// Check current user
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
console.log('👤 Current user:', {
    name: currentUser.name,
    email: currentUser.email,
    userType: currentUser.userType,
    yearOfStudy: currentUser.yearOfStudy
});

// Check category mapping
const yearToCategory = {
    2: 'document-summary',
    3: 'legal-research',
    4: 'legal-filings',
    5: 'corporate-advisory'
};

const userYear = parseInt(currentUser.yearOfStudy) || 2;
const expectedCategory = yearToCategory[userYear];
console.log(`🎓 User year ${userYear} should see category: ${expectedCategory}`);

// Count jobs by category
const jobsByCategory = {};
localJobs.forEach(job => {
    jobsByCategory[job.category] = (jobsByCategory[job.category] || 0) + 1;
});
console.log('📊 Jobs by category:', jobsByCategory);

// Test job filtering
const userJobs = localJobs.filter(job => job.category === expectedCategory);
console.log(`✅ Jobs for user (category: ${expectedCategory}):`, userJobs.length);
