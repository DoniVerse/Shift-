document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('sectionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalClose = document.getElementById('modalClose');
    const closeBtn = document.getElementById('closeBtn');
    const profilePicture = document.getElementById('profilePicture');
    const profilePictureInput = document.getElementById('profilePictureInput');

    // Get user data from localStorage
    function getUserData() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : {
            name: 'Student Name',
            email: 'student@university.edu',
            yearOfStudy: 2,
            university: 'University Name',
            department: 'Department',
            linkedinUrl: ''
        };
    }

    // Load user profile data
    function loadProfile() {
        const userData = getUserData();
        document.getElementById('profileName').textContent = userData.name;
        
        // Load profile picture if available
        const savedProfilePic = localStorage.getItem('profilePicture');
        if (savedProfilePic) {
            const img = document.createElement('img');
            img.src = savedProfilePic;
            profilePicture.innerHTML = '';
            profilePicture.appendChild(img);
        }
    }

    // Handle profile picture upload
    profilePicture.addEventListener('click', function() {
        profilePictureInput.click();
    });

    profilePictureInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                profilePicture.innerHTML = '';
                profilePicture.appendChild(img);
                
                // Save to localStorage
                localStorage.setItem('profilePicture', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Modal content templates
    const modalContent = {
        personal: function() {
            const userData = getUserData();
            return `
                <div class="info-item">
                    <span class="info-label">Full Name</span>
                    <span class="info-value">${userData.name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">${userData.email}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">University</span>
                    <span class="info-value">${userData.university}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Department</span>
                    <span class="info-value">${userData.department}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Year of Study</span>
                    <span class="info-value">Year ${userData.yearOfStudy}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">LinkedIn</span>
                    <span class="info-value">${userData.linkedinUrl || 'Not provided'}</span>
                </div>
                <div style="margin-top: 30px;">
                    <button class="btn-primary" onclick="editPersonalInfo()">Edit Information</button>
                </div>
            `;
        },
        
        resume: function() {
            const resumeData = JSON.parse(localStorage.getItem('resumeData') || '{}');
            return `
                <form id="resumeForm">
                    <div class="form-group">
                        <label for="resumeFile">Upload Resume/CV</label>
                        <input type="file" id="resumeFile" accept=".pdf,.doc,.docx">
                        ${resumeData.fileName ? `<p style="margin-top: 8px; color: var(--color-primary);">Current: ${resumeData.fileName}</p>` : ''}
                    </div>
                    <div class="form-group">
                        <label for="resumeSummary">Professional Summary</label>
                        <textarea id="resumeSummary" placeholder="Brief summary of your professional background and goals...">${resumeData.summary || ''}</textarea>
                    </div>
                    <button type="submit" class="btn-primary">Save Resume Information</button>
                </form>
            `;
        },
        
        skills: function() {
            const skillsData = JSON.parse(localStorage.getItem('skillsData') || '{"skills": [], "experience": []}');
            return `
                <form id="skillsForm">
                    <div class="form-group">
                        <label for="skills">Skills (comma-separated)</label>
                        <textarea id="skills" placeholder="e.g., Legal Research, Contract Analysis, Legal Writing...">${skillsData.skills.join(', ')}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="experience">Work Experience</label>
                        <textarea id="experience" placeholder="Describe your relevant work experience...">${skillsData.experience.join('\n\n')}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="certifications">Certifications</label>
                        <textarea id="certifications" placeholder="List any relevant certifications...">${skillsData.certifications || ''}</textarea>
                    </div>
                    <button type="submit" class="btn-primary">Save Skills & Experience</button>
                </form>
            `;
        },
        
        education: function() {
            const userData = getUserData();
            const educationData = JSON.parse(localStorage.getItem('educationData') || '{}');
            return `
                <form id="educationForm">
                    <div class="info-item">
                        <span class="info-label">Current University</span>
                        <span class="info-value">${userData.university}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Department</span>
                        <span class="info-value">${userData.department}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Year of Study</span>
                        <span class="info-value">Year ${userData.yearOfStudy}</span>
                    </div>
                    <hr style="margin: 20px 0;">
                    <div class="form-group">
                        <label for="gpa">GPA</label>
                        <input type="text" id="gpa" placeholder="e.g., 3.8/4.0" value="${educationData.gpa || ''}">
                    </div>
                    <div class="form-group">
                        <label for="graduationDate">Expected Graduation</label>
                        <input type="date" id="graduationDate" value="${educationData.graduationDate || ''}">
                    </div>
                    <div class="form-group">
                        <label for="relevantCourses">Relevant Courses</label>
                        <textarea id="relevantCourses" placeholder="List relevant courses...">${educationData.relevantCourses || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="achievements">Academic Achievements</label>
                        <textarea id="achievements" placeholder="Awards, honors, etc...">${educationData.achievements || ''}</textarea>
                    </div>
                    <button type="submit" class="btn-primary">Save Education Details</button>
                </form>
            `;
        },
        
        applications: function() {
            const applications = JSON.parse(localStorage.getItem('jobApplications') || '[]');
            if (applications.length === 0) {
                return `
                    <div style="text-align: center; padding: 40px 20px;">
                        <p style="color: var(--color-text-light); font-size: 18px;">No job applications yet</p>
                        <p style="color: var(--color-text-light); margin-top: 8px;">Start applying for jobs to see your application history here!</p>
                    </div>
                `;
            }
            
            let html = '<div class="applications-list">';
            applications.forEach(app => {
                html += `
                    <div class="application-item" style="padding: 16px; border: 1px solid #e1e5e9; border-radius: 8px; margin-bottom: 16px;">
                        <h4 style="color: var(--color-secondary); margin-bottom: 8px;">${app.jobTitle}</h4>
                        <p style="color: var(--color-text-light); margin-bottom: 4px;">Company: ${app.company}</p>
                        <p style="color: var(--color-text-light); margin-bottom: 4px;">Applied: ${app.dateApplied}</p>
                        <p style="color: var(--color-text-light);">Status: <span style="color: var(--color-primary); font-weight: 600;">${app.status}</span></p>
                    </div>
                `;
            });
            html += '</div>';
            return html;
        },
        
        settings: function() {
            return `
                <div class="settings-list">
                    <div class="menu-item" onclick="changePassword()">
                        <div class="menu-icon">🔒</div>
                        <div class="menu-text">Change Password</div>
                        <div class="menu-arrow">›</div>
                    </div>
                    <div class="menu-item" onclick="notificationSettings()">
                        <div class="menu-icon">🔔</div>
                        <div class="menu-text">Notification Settings</div>
                        <div class="menu-arrow">›</div>
                    </div>
                    <div class="menu-item" onclick="privacySettings()">
                        <div class="menu-icon">🛡️</div>
                        <div class="menu-text">Privacy Settings</div>
                        <div class="menu-arrow">›</div>
                    </div>
                    <div class="menu-item" onclick="deleteAccount()" style="color: #e74c3c;">
                        <div class="menu-icon">🗑️</div>
                        <div class="menu-text">Delete Account</div>
                        <div class="menu-arrow">›</div>
                    </div>
                </div>
            `;
        }
    };

    // Handle menu item clicks
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            const titles = {
                personal: 'Personal Information',
                resume: 'Resume/CV',
                skills: 'Skills and Experience',
                education: 'Education Details',
                applications: 'Job Application History',
                settings: 'Settings'
            };
            
            modalTitle.textContent = titles[section];
            modalBody.innerHTML = modalContent[section]();
            modal.style.display = 'block';
            
            // Setup form handlers
            setupFormHandlers(section);
        });
    });

    // Setup form handlers for different sections
    function setupFormHandlers(section) {
        const form = document.getElementById(`${section}Form`);
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                saveFormData(section, form);
            });
        }
    }

    // Save form data to localStorage
    function saveFormData(section, form) {
        const formData = new FormData(form);
        let data = {};
        
        switch(section) {
            case 'resume':
                data = {
                    summary: document.getElementById('resumeSummary').value,
                    fileName: document.getElementById('resumeFile').files[0]?.name || JSON.parse(localStorage.getItem('resumeData') || '{}').fileName
                };
                localStorage.setItem('resumeData', JSON.stringify(data));
                break;
                
            case 'skills':
                data = {
                    skills: document.getElementById('skills').value.split(',').map(s => s.trim()).filter(s => s),
                    experience: document.getElementById('experience').value.split('\n\n').filter(s => s.trim()),
                    certifications: document.getElementById('certifications').value
                };
                localStorage.setItem('skillsData', JSON.stringify(data));
                break;
                
            case 'education':
                data = {
                    gpa: document.getElementById('gpa').value,
                    graduationDate: document.getElementById('graduationDate').value,
                    relevantCourses: document.getElementById('relevantCourses').value,
                    achievements: document.getElementById('achievements').value
                };
                localStorage.setItem('educationData', JSON.stringify(data));
                break;
        }
        
        alert('Information saved successfully!');
        modal.style.display = 'none';
    }

    // Close modal handlers
    modalClose.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    closeBtn.addEventListener('click', function() {
        window.history.back();
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Initialize profile
    loadProfile();
});

// Global functions for settings
function changePassword() {
    alert('Change password functionality would be implemented here.');
}

function notificationSettings() {
    alert('Notification settings would be implemented here.');
}

function privacySettings() {
    alert('Privacy settings would be implemented here.');
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        localStorage.clear();
        alert('Account deleted successfully.');
        window.location.href = 'index.html';
    }
}

function editPersonalInfo() {
    alert('Personal information editing would redirect to a dedicated form.');
}