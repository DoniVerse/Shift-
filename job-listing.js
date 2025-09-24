document.addEventListener('DOMContentLoaded', function() {

    // Get user data from localStorage or URL params
    function getUserData() {
        // Try to get from localStorage first (from signup/login)
        const userData = localStorage.getItem('currentUser');

        if (userData) {
            const parsedData = JSON.parse(userData);
            return parsedData;
        }

        // Fallback to URL params or default
        const urlParams = new URLSearchParams(window.location.search);
        const fallbackData = {
            name: urlParams.get('name') || 'Student',
            yearOfStudy: parseInt(urlParams.get('year')) || 2
        };
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

    // Wait for job manager to be available (since firebase-jobs.js loads as a module later)
    async function waitForJobManager(maxWaitMs = 5000, intervalMs = 100) {
        const start = Date.now();
        while (Date.now() - start < maxWaitMs) {
            if (window.jobManager) return true;
            await new Promise(r => setTimeout(r, intervalMs));
        }
        return false;
    }

    // Display jobs matching student's department from Firebase
    async function displayJobs() {
        const userData = getUserData();
        const jobsGrid = document.getElementById('jobsGrid');
        const noJobsMessage = document.getElementById('noJobsMessage');

        let jobs = [];

        // Fetch strictly from Firebase using student's department
        try {
            // Ensure jobManager is ready
            await waitForJobManager();
            if (window.jobManager) {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                const studentDept = currentUser?.department;
                if (!studentDept) {
                    throw new Error('Missing student department. Update your profile to see jobs.');
                }
                if (typeof window.jobManager.getJobsByDepartment !== 'function') {
                    throw new Error('Jobs API unavailable');
                }
                jobs = await window.jobManager.getJobsByDepartment(studentDept);
            } else {
                throw new Error('Firebase not available');
            }
        } catch (firebaseError) {
            // Show error and stop if Firebase path fails
            jobsGrid.style.display = 'none';
            noJobsMessage.style.display = 'block';
            noJobsMessage.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3>No jobs available</h3>
                    <p>${firebaseError?.message || 'Unable to load jobs from server.'}</p>
                </div>
            `;
            return;
        }

        // Best-effort sort by createdAt desc if available
        jobs.sort((a, b) => {
            const ad = (a.createdAt && a.createdAt.getTime) ? a.createdAt.getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const bd = (b.createdAt && b.createdAt.getTime) ? b.createdAt.getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return bd - ad;
        });

        jobsGrid.innerHTML = '';

        if (!jobs.length) {
            jobsGrid.style.display = 'none';
            noJobsMessage.style.display = 'block';
            noJobsMessage.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3>No jobs available yet</h3>
                    <p>Please check back later.</p>
                </div>
            `;
            return;
        }

        jobsGrid.style.display = 'grid';
        noJobsMessage.style.display = 'none';

        // Update page title to show count only
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.innerHTML = `Available Jobs<br><small style="color: #666; font-size: 14px;">${jobs.length} jobs</small>`;
        }

        jobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';
            jobCard.innerHTML = `
                <div class="job-icon">${job.icon || ''}</div>
                <div class="job-title">${job.title || ''}</div>
                <div class="job-rating">${job.rating ? createStarRating(job.rating) : ''}</div>
                <div class="job-description">${job.description || ''}</div>
                <div class="job-employer">${job.employerName ? `<strong>Employer:</strong> ${job.employerName}` : ''}</div>
                <div class="job-hours">${job.expectedHours ? `<strong>Expected Hours:</strong> ${job.expectedHours}` : ''}</div>
            `;
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
                
                switch(label) {
                    case 'Home':
                        // Already on home/job listing
                        break;
                    case 'Search':
                        document.getElementById('searchInput').focus();
                        break;
                    case 'Messages':

                        break;
                    case 'Profile':

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

                return;
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
                appliedAt: new Date().toISOString()
            };
            try {
                if (window.jobManager && window.jobManager.submitApplication) {
                    const result = await window.jobManager.submitApplication(application);
                    if (result.success) {

                        modal.style.display = 'none';
                    } else {

                    }
                } else {

                }
            } catch (e) {

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