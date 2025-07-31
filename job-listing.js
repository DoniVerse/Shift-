document.addEventListener('DOMContentLoaded', function() {
    // Job categories based on year of study
    const jobCategories = {
        2: [
            {
                id: 1,
                title: "Summarizing Legal Documents",
                icon: "📄",
                rating: 4.2,
                description: "Review and summarize legal documents",
                category: "summarizing"
            },
            {
                id: 2,
                title: "Document Review Assistant",
                icon: "📋",
                rating: 4.0,
                description: "Assist with document review processes",
                category: "summarizing"
            }
        ],
        3: [
            {
                id: 3,
                title: "Legal Research Assistance",
                icon: "🔍",
                rating: 4.5,
                description: "Conduct legal research and analysis",
                category: "research"
            },
            {
                id: 4,
                title: "Case Law Research",
                icon: "⚖️",
                rating: 4.3,
                description: "Research case law and precedents",
                category: "research"
            },
            {
                id: 5,
                title: "Legal Database Research",
                icon: "💻",
                rating: 4.1,
                description: "Navigate legal databases for research",
                category: "research"
            }
        ],
        4: [
            {
                id: 6,
                title: "Preparing Legal Filings & Case Documents",
                icon: "📁",
                rating: 4.4,
                description: "Prepare and organize legal filings",
                category: "filing"
            },
            {
                id: 7,
                title: "Court Document Preparation",
                icon: "📝",
                rating: 4.2,
                description: "Assist with court document preparation",
                category: "filing"
            },
            {
                id: 8,
                title: "Legal Filing Assistant",
                icon: "📤",
                rating: 4.0,
                description: "Support legal filing processes",
                category: "filing"
            }
        ],
        5: [
            {
                id: 9,
                title: "Corporate Legal Advisory Support",
                icon: "🤝",
                rating: 4.6,
                description: "Support corporate legal advisory services",
                category: "corporate"
            },
            {
                id: 10,
                title: "Contract Review Assistant",
                icon: "📋",
                rating: 4.3,
                description: "Assist with contract review and analysis",
                category: "corporate"
            },
            {
                id: 11,
                title: "Corporate Compliance Support",
                icon: "✅",
                rating: 4.1,
                description: "Support corporate compliance initiatives",
                category: "corporate"
            }
        ]
    };

    // Get user data from localStorage or URL params
    function getUserData() {
        // Try to get from localStorage first (from signup/login)
        const userData = localStorage.getItem('currentUser');
        console.log('Raw user data from localStorage:', userData);

        if (userData) {
            const parsedData = JSON.parse(userData);
            console.log('Parsed user data:', parsedData);
            console.log('Year of study:', parsedData.yearOfStudy);
            return parsedData;
        }

        // Fallback to URL params or default
        const urlParams = new URLSearchParams(window.location.search);
        const fallbackData = {
            name: urlParams.get('name') || 'Student',
            yearOfStudy: parseInt(urlParams.get('year')) || 2
        };
        console.log('Using fallback data:', fallbackData);
        return fallbackData;
    }

    // Display user info
    function displayUserInfo() {
        const userData = getUserData();
        const userName = document.getElementById('userName');
        const yearBadge = document.getElementById('yearBadge');
        
        userName.textContent = userData.name.split(' ')[0]; // First name only
        yearBadge.textContent = `Year ${userData.yearOfStudy}`;
    }

    // Create star rating HTML
    function createStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let starsHTML = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHTML += '<span class="star filled">★</span>';
            } else if (i === fullStars && hasHalfStar) {
                starsHTML += '<span class="star filled">★</span>';
            } else {
                starsHTML += '<span class="star">☆</span>';
            }
        }
        
        return starsHTML;
    }

    // Display jobs based on year
    async function displayJobs() {
        const userData = getUserData();
        const jobsGrid = document.getElementById('jobsGrid');
        const noJobsMessage = document.getElementById('noJobsMessage');

        // Map year to category
        const yearToCategory = {
            2: 'document-summary',
            3: 'legal-research',
            4: 'legal-filings',
            5: 'corporate-advisory'
        };
        const userYear = parseInt(userData.yearOfStudy) || 2;
        const category = yearToCategory[userYear];

        // Debug student filtering
        console.log('🎓 STUDENT FILTERING DEBUG:');
        console.log('🎓 Student data:', userData);
        console.log('🎓 Student year:', userYear);
        console.log('🎓 Category for this year:', category);
        console.log('🎓 Available categories:', Object.values(yearToCategory));

        // PRIMARY: Get jobs from Firebase (where employers publish them)
        console.log('🔥 Student looking for Firebase jobs in category:', category);

        let jobs = [];

        // Try Firebase first
        try {
            if (window.jobManager) {
                console.log('🔥 Fetching from Firebase...');
                const firebaseJobs = await window.jobManager.getJobsByCategory(category);
                jobs = firebaseJobs;
                console.log('🔥 Firebase jobs found:', jobs.length);
            } else {
                throw new Error('Firebase not available');
            }
        } catch (firebaseError) {
            console.error('🔥 Firebase error, using fallback:', firebaseError);

            // Fallback to local storage
            let allJobs = [];
            if (window.localJobsManager) {
                console.log('📱 Using Local Jobs Manager fallback');
                allJobs = window.localJobsManager.getAllJobs();
            } else {
                console.log('📱 Using direct localStorage fallback');
                allJobs = JSON.parse(localStorage.getItem('jobs') || '[]');
            }

            jobs = allJobs.filter(job => {
                console.log(`🔍 Checking job: ${job.title} | Category: ${job.category} | Looking for: ${category}`);
                return job.category === category;
            });
        }

        console.log('✅ Final jobs for student:', jobs.length, jobs);

        // If no jobs posted by employers, fallback to static
        let jobsToShow = jobs;
        if (!jobs.length) {
            // fallback to static
            jobsToShow = jobCategories[userYear] || [];
        }

        jobsGrid.innerHTML = '';

        if (!jobsToShow.length) {
            jobsGrid.style.display = 'none';
            noJobsMessage.style.display = 'block';

            const categoryTitles = {
                'document-summary': 'Summarizing Legal Documents',
                'legal-research': 'Legal Research Assistance',
                'legal-filings': 'Preparing Legal Filings & Case Documents',
                'corporate-advisory': 'Corporate Legal Advisory Support'
            };

            noJobsMessage.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3>🎓 No Jobs Available for Year ${userYear} Students</h3>
                    <p><strong>Your Category:</strong> ${categoryTitles[category] || category}</p>
                    <p><strong>Category ID:</strong> ${category}</p>
                    <hr style="margin: 20px 0; border: 1px solid #eee;">
                    <p>📋 <strong>Year-to-Category Mapping:</strong></p>
                    <ul style="text-align: left; display: inline-block;">
                        <li>Year 2 → Summarizing Legal Documents</li>
                        <li>Year 3 → Legal Research Assistance</li>
                        <li>Year 4 → Preparing Legal Filings & Case Documents</li>
                        <li>Year 5 → Corporate Legal Advisory Support</li>
                    </ul>
                    <p>💼 Employers need to publish jobs in the <strong>"${categoryTitles[category]}"</strong> category for you to see them.</p>
                </div>
            `;
            return;
        }

        jobsGrid.style.display = 'grid';
        noJobsMessage.style.display = 'none';

        // Update page title to show filtering info
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            const categoryTitles = {
                'document-summary': 'Summarizing Legal Documents',
                'legal-research': 'Legal Research Assistance',
                'legal-filings': 'Preparing Legal Filings & Case Documents',
                'corporate-advisory': 'Corporate Legal Advisory Support'
            };
            pageTitle.innerHTML = `Available Jobs<br><small style="color: #666; font-size: 14px;">🎓 Year ${userYear} Student - ${categoryTitles[category] || category} (${jobsToShow.length} jobs)</small>`;
        }

        jobsToShow.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';
            jobCard.innerHTML = `
                <div class="job-icon">${job.icon || ''}</div>
                <div class="job-title">${job.title}</div>
                <div class="job-rating">${job.rating ? createStarRating(job.rating) : ''}</div>
                <div class="job-description">${job.description}</div>
                <div class="job-employer">${job.employerName ? `<strong>Employer:</strong> ${job.employerName}` : ''}</div>
                <div class="job-hours">${job.expectedHours ? `<strong>Expected Hours:</strong> ${job.expectedHours}` : ''}</div>
            `;
            // Show job details modal on click
            jobCard.onclick = () => showJobModal(job);
            jobsGrid.appendChild(jobCard);
        });
    }

    // Search functionality
    function setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        function performSearch() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const jobCards = document.querySelectorAll('.job-card');
            
            jobCards.forEach(card => {
                const title = card.querySelector('.job-title').textContent.toLowerCase();
                const description = card.querySelector('.job-description').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || description.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = searchTerm === '' ? 'block' : 'none';
                }
            });
        }

        searchInput.addEventListener('input', performSearch);
        searchBtn.addEventListener('click', performSearch);
    }

    // Filter functionality
    function setupFilter() {
        const filterBtn = document.getElementById('filterBtn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                // Simple filter toggle - you can expand this
                alert('Filter options:\n- By Rating\n- By Category\n- By Date Posted\n\nThis would open a filter modal.');
            });
        }
    }

    // Bottom navigation
    function setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Handle navigation
                const label = this.querySelector('.nav-label').textContent;
                console.log('Navigation clicked:', label);
                
                switch(label) {
                    case 'Home':
                        // Already on home/job listing
                        break;
                    case 'Search':
                        document.getElementById('searchInput').focus();
                        break;
                    case 'Messages':
                        alert('Messages feature coming soon!');
                        break;
                    case 'Profile':
                        alert('Profile page coming soon!');
                        // window.location.href = 'profile.html';
                        break;
                }
            });
        });
    }

    // Helper to show job details modal
    function showJobModal(job) {
        // Create modal overlay
        let modal = document.getElementById('jobDetailsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'jobDetailsModal';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.background = 'rgba(0,0,0,0.5)';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.zIndex = '9999';
            document.body.appendChild(modal);
        }
        modal.innerHTML = `
            <div style="background:#fff;max-width:400px;width:90vw;padding:24px 20px 20px 20px;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.15);position:relative;">
                <button id="closeJobModal" style="position:absolute;top:10px;right:10px;background:none;border:none;font-size:1.5rem;cursor:pointer;">&times;</button>
                <h2 style="margin-bottom:10px;">${job.title}</h2>
                <div style="margin-bottom:8px;"><strong>Category:</strong> ${job.categoryTitle || job.category || ''}</div>
                <div style="margin-bottom:8px;"><strong>Employer:</strong> ${job.employerName || 'N/A'}</div>
                <div style="margin-bottom:8px;"><strong>Payment:</strong> ${job.paymentCode || ''}</div>
                <div style="margin-bottom:8px;"><strong>Expected Hours:</strong> ${job.expectedHours || ''}</div>
                <div style="margin-bottom:16px;"><strong>Description:</strong><br>${job.description || ''}</div>
                <button id="applyJobBtn" style="width:100%;padding:10px 0;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:1rem;cursor:pointer;">Apply</button>
            </div>
        `;
        // Close modal
        document.getElementById('closeJobModal').onclick = function() {
            modal.style.display = 'none';
        };
        // Apply button
        document.getElementById('applyJobBtn').onclick = async function() {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const firebaseUid = window.firebaseAuth && window.firebaseAuth.currentUser ? window.firebaseAuth.currentUser.uid : '';
            
            if (!firebaseUid) {
                alert('You must be signed in to apply. Please log in again.');
                return;
            }

            // Load additional student data from Firestore
            let resumeData = {};
            let skillsData = {};
            let educationData = {};
            
            try {
                const auth = window.firebaseAuth;
                const db = window.firebaseFirestore;
                const currentUser = auth?.currentUser;
                
                if (currentUser && db) {
                    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        resumeData = userData.resumeData || {};
                        skillsData = userData.skillsData || {};
                        educationData = userData.educationData || {};
                    }
                }
                
                // Fallback to localStorage if Firestore fails
                if (!resumeData.summary) {
                    resumeData = JSON.parse(localStorage.getItem('resumeData') || '{}');
                }
                if (!skillsData.skills) {
                    skillsData = JSON.parse(localStorage.getItem('skillsData') || '{}');
                }
                if (!educationData.gpa) {
                    educationData = JSON.parse(localStorage.getItem('educationData') || '{}');
                }
            } catch (error) {
                console.error('Error loading student profile data:', error);
                // Use localStorage as fallback
                resumeData = JSON.parse(localStorage.getItem('resumeData') || '{}');
                skillsData = JSON.parse(localStorage.getItem('skillsData') || '{}');
                educationData = JSON.parse(localStorage.getItem('educationData') || '{}');
            }

            const application = {
                jobId: job.id,
                jobTitle: job.title,
                jobCategory: job.category || job.categoryTitle || '',
                employerName: job.employerName || '',
                employerEmail: job.employerEmail || '',
                employerId: job.employerId || '',
                studentName: user.name || '',
                studentEmail: user.email || '',
                studentYear: user.yearOfStudy || '',
                studentUniversity: user.university || '',
                studentDepartment: user.department || '',
                studentId: firebaseUid, // Use actual Firebase UID
                status: 'applied',
                appliedAt: new Date().toISOString(),
                
                // Additional profile information
                resumeFileName: resumeData.fileName || 'Not uploaded',
                resumeSummary: resumeData.summary || 'Not provided',
                
                skills: skillsData.skills || [],
                workExperience: skillsData.experience || [],
                certifications: skillsData.certifications || 'Not provided',
                
                gpa: educationData.gpa || 'Not provided',
                graduationDate: educationData.graduationDate || 'Not provided',
                relevantCourses: educationData.relevantCourses || 'Not provided',
                academicAchievements: educationData.achievements || 'Not provided'
            };

            // Debug logging
            console.log('Submitting enhanced application:', application);
            
            try {
                if (window.jobManager && window.jobManager.submitApplication) {
                    const result = await window.jobManager.submitApplication(application);
                    if (result.success) {
                        alert('Application submitted successfully!');
                        modal.style.display = 'none';
                    } else {
                        alert('Failed to apply: ' + (result.error || 'Unknown error'));
                    }
                } else {
                    alert('Job manager not available.');
                }
            } catch (e) {
                alert('Failed to apply: ' + e.message);
            }
        };
        modal.style.display = 'flex';
    }

    // Student notifications modal logic
    const notificationsNav = document.getElementById('studentNotificationsNav');
    const notificationsModal = document.getElementById('studentNotificationsModal');
    if (notificationsNav) {
        notificationsNav.onclick = function(e) {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const applications = JSON.parse(localStorage.getItem('jobApplications') || '[]');
            const notifications = JSON.parse(localStorage.getItem('studentNotifications') || '[]');
            // Get all jobs this student applied to
            const myApps = applications.filter(app => app.student === user.email);
            if (!myApps.length) {
                notificationsModal.innerHTML = `<div style='background:#fff;padding:24px 20px 20px 20px;border-radius:12px;max-width:400px;width:90vw;position:relative;'><button id='closeStudentNotificationsModal' style='position:absolute;top:10px;right:10px;background:none;border:none;font-size:1.5rem;cursor:pointer;'>&times;</button><h2>My Applications</h2><div>No job applications yet.</div></div>`;
                notificationsModal.style.display = 'flex';
                document.getElementById('closeStudentNotificationsModal').onclick = function() { notificationsModal.style.display = 'none'; };
                return;
            }
            let html = `<div style='background:#fff;padding:24px 20px 20px 20px;border-radius:12px;max-width:400px;width:90vw;position:relative;'><button id='closeStudentNotificationsModal' style='position:absolute;top:10px;right:10px;background:none;border:none;font-size:1.5rem;cursor:pointer;'>&times;</button><h2>My Applications</h2>`;
            myApps.forEach((app, idx) => {
                // Check if accepted
                const accepted = notifications.find(n => n.email === user.email && n.message.includes(app.jobTitle));
                let status = 'Pending';
                let timerHtml = '';
                let canStart = false;
                let expireKey = `expire_${user.email}_${app.jobTitle}`;
                if (accepted) {
                    status = 'Accepted';
                    // Timer logic
                    let expireTime = localStorage.getItem(expireKey);
                    if (!expireTime) {
                        expireTime = Date.now() + 30 * 60 * 1000; // 30 minutes from now
                        localStorage.setItem(expireKey, expireTime);
                    }
                    const now = Date.now();
                    const msLeft = expireTime - now;
                    if (msLeft <= 0) {
                        // Remove job from applications
                        const newApps = myApps.filter((_, i) => i !== idx);
                        localStorage.setItem('jobApplications', JSON.stringify(newApps));
                        localStorage.removeItem(expireKey);
                        return; // Skip rendering this job
                    } else {
                        const min = Math.floor(msLeft / 60000);
                        const sec = Math.floor((msLeft % 60000) / 1000);
                        timerHtml = `<div style='color:#f59e42;margin-bottom:8px;'>Accept within: ${min}m ${sec}s</div>`;
                        canStart = true;
                    }
                }
                html += `<div class='student-app-card' style='border:1px solid #e1e5e9;border-radius:8px;padding:12px;margin-bottom:12px;'>
                    <div><strong>Job:</strong> ${app.jobTitle}</div>
                    <div><strong>Status:</strong> <span style='color:${status==='Accepted'?'#22c55e':'#f59e42'};'>${status}</span></div>
                    ${timerHtml}
                    ${canStart ? `<button class='agreeStartBtn' data-idx='${idx}' style='width:100%;padding:10px 0;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:1rem;cursor:pointer;margin-top:8px;'>Agree & Start Job</button>` : ''}
                </div>`;
            });
            html += `</div>`;
            notificationsModal.innerHTML = html;
            notificationsModal.style.display = 'flex';
            document.getElementById('closeStudentNotificationsModal').onclick = function() { notificationsModal.style.display = 'none'; };
            // Agree & Start Job button logic
            notificationsModal.querySelectorAll('.agreeStartBtn').forEach(btn => {
                btn.onclick = function() {
                    const idx = this.getAttribute('data-idx');
                    // Remove job from applications and timer
                    const newApps = myApps.filter((_, i) => i !== parseInt(idx));
                    localStorage.setItem('jobApplications', JSON.stringify(newApps));
                    const app = myApps[idx];
                    let expireKey = `expire_${user.email}_${app.jobTitle}`;
                    localStorage.removeItem(expireKey);
                    alert('You have agreed to start the job!');
                    notificationsModal.style.display = 'none';
                };
            });
        };
    }

    // Initialize the page
    displayUserInfo();
    displayJobs();
    setupSearch();
    setupFilter();
    setupNavigation();

    // For demo purposes, let's simulate user data
    if (!localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', JSON.stringify({
            name: 'John Doe',
            yearOfStudy: 3,
            email: 'john.doe@university.edu'
        }));
        // Refresh to show the demo data
        location.reload();
    }
});
