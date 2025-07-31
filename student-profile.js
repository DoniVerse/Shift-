import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

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

    // Load user profile data from Firestore
    async function loadProfile() {
        const auth = window.firebaseAuth;
        const db = window.firebaseFirestore;
        const user = auth?.currentUser;
        
        let userData = getUserData();
        
        // Try to load from Firestore first
        if (user && db) {
            try {
                const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const firestoreData = userDoc.data();
                    console.log('Firestore user data:', firestoreData);
                    
                    // Merge Firestore data with localStorage data
                    userData = {
                        ...userData,
                        name: firestoreData.name || userData.name,
                        profilePicture: firestoreData.profilePicture || firestoreData.logo
                    };
                    
                    // Update localStorage with Firestore data
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                }
            } catch (error) {
                console.error('Error loading profile from Firestore:', error);
            }
        }
        
        document.getElementById('profileName').textContent = userData.name;
        
        // Load profile picture - check multiple sources
        const profilePictureUrl = userData.profilePicture || localStorage.getItem('profilePicture');
        console.log('Profile picture URL:', profilePictureUrl);
        
        if (profilePictureUrl) {
            const img = document.createElement('img');
            img.src = profilePictureUrl;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '50%';
            profilePicture.innerHTML = '';
            profilePicture.appendChild(img);
        }
    }

    // Handle profile picture upload
    profilePicture.addEventListener('click', function() {
        profilePictureInput.click();
    });

    profilePictureInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                profilePicture.innerHTML = '';
                profilePicture.appendChild(img);
                
                // Save to localStorage
                localStorage.setItem('profilePicture', e.target.result);
                
                // Save to Firestore
                const auth = window.firebaseAuth;
                const db = window.firebaseFirestore;
                const user = auth?.currentUser;
                
                if (user && db) {
                    try {
                        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                        const userDocRef = doc(db, 'users', user.uid);
                        await updateDoc(userDocRef, {
                            profilePicture: e.target.result,
                            updatedAt: new Date()
                        });
                        console.log('Profile picture saved to Firestore');
                    } catch (error) {
                        console.error('Error saving profile picture to Firestore:', error);
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Load data from Firestore or localStorage
    async function loadSectionData(section) {
        const auth = window.firebaseAuth;
        const db = window.firebaseFirestore;
        const user = auth?.currentUser;
        
        if (user && db) {
            try {
                const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    return userData[section + 'Data'] || {};
                }
            } catch (error) {
                console.error('Error loading from Firestore:', error);
            }
        }
        
        // Fallback to localStorage
        return JSON.parse(localStorage.getItem(section + 'Data') || '{}');
    }

    // Update modal content functions
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
        
        resume: async function() {
            const resumeData = await loadSectionData('resume');
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
        
        skills: async function() {
            const skillsData = await loadSectionData('skills');
            return `
                <form id="skillsForm">
                    <div class="form-group">
                        <label for="skills">Skills (comma-separated)</label>
                        <textarea id="skills" placeholder="e.g., Legal Research, Contract Analysis, Legal Writing...">${(skillsData.skills || []).join(', ')}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="experience">Work Experience</label>
                        <textarea id="experience" placeholder="Describe your relevant work experience...">${(skillsData.experience || []).join('\n\n')}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="certifications">Certifications</label>
                        <textarea id="certifications" placeholder="List your certifications...">${skillsData.certifications || ''}</textarea>
                    </div>
                    <button type="submit" class="btn-primary">Save Skills & Experience</button>
                </form>
            `;
        },
        
        education: async function() {
            const userData = getUserData();
            const educationData = await loadSectionData('education');
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
            // Show all jobs the student has applied to (application history)
            const db = window.firebaseFirestore;
            const auth = window.firebaseAuth;
            const user = auth.currentUser;
            // Show loading state
            return `<div id="applications-loading" style="text-align:center;padding:40px 20px;">Loading applications...</div>`;
        }
    };

    // Handle menu item clicks
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', async function() {
            const section = this.dataset.section;
            const titles = {
                personal: 'Personal Information',
                resume: 'Resume/CV',
                skills: 'Skills and Experience',
                education: 'Education Details',
                applications: 'Job Application History'
            };
            
            modalTitle.textContent = titles[section];
            
            // Handle async modal content
            if (typeof modalContent[section] === 'function') {
                const content = await modalContent[section]();
                modalBody.innerHTML = content;
            } else {
                modalBody.innerHTML = modalContent[section];
            }
            
            modal.style.display = 'block';
            
            // Setup form handlers
            setupFormHandlers(section);

            // Special handling for applications section (fetch async)
            if (section === 'applications') {
                const db = window.firebaseFirestore;
                const auth = window.firebaseAuth;
                const user = auth.currentUser;
                const container = document.createElement('div');
                container.className = 'applications-list';
                if (!user) {
                    container.innerHTML = `<div style="text-align: center; padding: 40px 20px;"><p style="color: var(--color-text-light); font-size: 18px;">Please sign in to view your applications.</p></div>`;
                    modalBody.innerHTML = container.outerHTML;
                    return;
                }
                (async () => {
                    try {
                        const q = query(collection(db, 'applications'), where('studentId', '==', user.uid));
                        const querySnapshot = await getDocs(q);
                        if (querySnapshot.empty) {
                            container.innerHTML = `<div style="text-align: center; padding: 40px 20px;"><p style="color: var(--color-text-light); font-size: 18px;">No job applications yet</p><p style="color: var(--color-text-light); margin-top: 8px;">Start applying for jobs to see your application history here!</p></div>`;
                        } else {
                            querySnapshot.forEach(docSnap => {
                                const app = docSnap.data();
                                let statusHtml = '';
                                if (app.status === 'accepted') {
                                    statusHtml = `<span style=\"color: #22c55e; font-weight: 600;\">Accepted</span>`;
                                } else if (app.status === 'rejected') {
                                    statusHtml = `<span style=\"color: #dc2626; font-weight: 600;\">Rejected</span>`;
                                } else {
                                    statusHtml = `<span style=\"color: #f59e42; font-weight: 600;\">Applied</span>`;
                                }
                                container.innerHTML += `
                                    <div class=\"application-item\" style=\"padding: 16px; border: 1px solid #e1e5e9; border-radius: 8px; margin-bottom: 16px;\">
                                        <h4 style=\"color: var(--color-secondary); margin-bottom: 8px;\">${app.jobTitle}</h4>
                                        <p style=\"color: var(--color-text-light); margin-bottom: 4px;\">Company: ${app.employerName}</p>
                                        <p style=\"color: var(--color-text-light); margin-bottom: 4px;\">Status: ${statusHtml}</p>
                                        <p style=\"color: var(--color-text-light);\">Applied: ${app.appliedAt ? new Date(app.appliedAt).toLocaleString() : ''}</p>
                                    </div>
                                `;
                            });
                        }
                        modalBody.innerHTML = container.outerHTML;
                    } catch (err) {
                        container.innerHTML = `<div style=\"color:#dc2626;text-align:center;padding:40px 20px;\">Error loading applications: ${err.message}</div>`;
                        modalBody.innerHTML = container.outerHTML;
                    }
                })();
            }

            // Always reload profile picture in modal (for personal section)
            if (section === 'personal') {
                // Load profile picture if available
                const profilePicture = document.getElementById('profilePicture');
                const savedProfilePic = localStorage.getItem('profilePicture');
                if (profilePicture && savedProfilePic) {
                    const img = document.createElement('img');
                    img.src = savedProfilePic;
                    profilePicture.innerHTML = '';
                    profilePicture.appendChild(img);
                }
            }
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

    // Save form data to Firestore and localStorage
    async function saveFormData(section, form) {
        const userData = JSON.parse(localStorage.getItem('currentUser')) || {};
        if (userData.userType !== 'student') {
            alert('Only authenticated students can edit this information.');
            return;
        }

        const auth = window.firebaseAuth;
        const db = window.firebaseFirestore;
        const user = auth?.currentUser;

        if (!user || !db) {
            alert('Please sign in to save your information.');
            return;
        }

        let data = {};
        let error = '';

        switch(section) {
            case 'resume':
                const summary = document.getElementById('resumeSummary').value.trim();
                const fileInput = document.getElementById('resumeFile');
                const existingData = JSON.parse(localStorage.getItem('resumeData') || '{}');
                const fileName = fileInput.files[0]?.name || existingData.fileName || 'Not uploaded';
                
                if (!summary) {
                    error = 'Professional summary is required.';
                } else {
                    data = { summary, fileName };
                }
                break;
                
            case 'skills':
                const skills = document.getElementById('skills').value.trim();
                const experience = document.getElementById('experience').value.trim();
                const certifications = document.getElementById('certifications').value.trim();
                
                if (!skills || !experience || !certifications) {
                    error = 'All fields are required.';
                } else {
                    data = {
                        skills: skills.split(',').map(s => s.trim()).filter(s => s),
                        experience: experience.split('\n\n').filter(s => s.trim()),
                        certifications
                    };
                }
                break;
                
            case 'education':
                const gpa = document.getElementById('gpa').value.trim();
                const graduationDate = document.getElementById('graduationDate').value.trim();
                const relevantCourses = document.getElementById('relevantCourses').value.trim();
                const achievements = document.getElementById('achievements').value.trim();
                
                if (!gpa || !graduationDate || !relevantCourses || !achievements) {
                    error = 'All fields are required.';
                } else {
                    data = { gpa, graduationDate, relevantCourses, achievements };
                }
                break;
        }

        if (error) {
            const errorDiv = document.createElement('div');
            errorDiv.style.color = '#dc2626';
            errorDiv.style.marginTop = '10px';
            errorDiv.textContent = error;
            form.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
            return;
        }

        try {
            // Save to Firestore
            const { doc, updateDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            const userDocRef = doc(db, 'users', user.uid);
            
            // Update the specific section in the user document
            const updateData = {};
            updateData[section + 'Data'] = data;
            updateData.updatedAt = new Date();
            
            await updateDoc(userDocRef, updateData);
            console.log(`${section} data saved to Firestore:`, data);
            
            // Also save to localStorage for backward compatibility
            localStorage.setItem(section + 'Data', JSON.stringify(data));
            
            // Show success message
            const successDiv = document.createElement('div');
            successDiv.style.color = '#22c55e';
            successDiv.style.marginTop = '10px';
            successDiv.textContent = 'Information saved successfully!';
            form.appendChild(successDiv);
            
            // Remove success message after 3 seconds
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 3000);
            
        } catch (error) {
            console.error('Error saving to Firestore:', error);
            // Fallback to localStorage
            localStorage.setItem(section + 'Data', JSON.stringify(data));
            alert('Information saved locally. Please check your internet connection.');
        }
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

    // Student logout button handler
    const logoutBtn = document.getElementById('student-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (window.firebaseAuth && typeof window.firebaseAuth.signOutUser === 'function') {
                window.firebaseAuth.signOutUser();
            } else {
                // Fallback: clear localStorage and redirect
                localStorage.clear();
                window.location.href = 'landing.html';
            }
        });
    }
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

window.editPersonalInfo = function() {
    const userData = JSON.parse(localStorage.getItem('currentUser')) || {};
    const modalBody = document.getElementById('modalBody');
    const modal = document.getElementById('sectionModal');
    modalBody.innerHTML = `
        <form id="personalInfoForm">
            <div class="form-group">
                <label for="editName">Full Name</label>
                <input type="text" id="editName" value="${userData.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="editEmail">Email</label>
                <input type="email" id="editEmail" value="${userData.email || ''}" required>
            </div>
            <div class="form-group">
                <label for="editUniversity">University</label>
                <input type="text" id="editUniversity" value="${userData.university || ''}" required>
            </div>
            <div class="form-group">
                <label for="editDepartment">Department</label>
                <input type="text" id="editDepartment" value="${userData.department || ''}" required>
            </div>
            <div class="form-group">
                <label for="editYear">Year of Study</label>
                <input type="number" id="editYear" value="${userData.yearOfStudy || ''}" min="1" required>
            </div>
            <div class="form-group">
                <label for="editLinkedIn">LinkedIn</label>
                <input type="url" id="editLinkedIn" value="${userData.linkedinUrl || ''}" required>
            </div>
            <button type="submit" class="btn-primary">Save Changes</button>
            <button type="button" class="btn-secondary" onclick="location.reload()" style="margin-left: 10px;">Cancel</button>
        </form>
        <div id="personalInfoError" style="color:#dc2626;margin-top:10px;"></div>
    `;
    modal.style.display = 'block';
    
    document.getElementById('personalInfoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const university = document.getElementById('editUniversity').value.trim();
        const department = document.getElementById('editDepartment').value.trim();
        const year = document.getElementById('editYear').value.trim();
        const linkedin = document.getElementById('editLinkedIn').value.trim();
        
        if (!name || !email || !university || !department || !year || !linkedin) {
            document.getElementById('personalInfoError').textContent = 'All fields are required.';
            return;
        }
        
        const updatedUser = {
            ...userData,
            name,
            email,
            university,
            department,
            yearOfStudy: parseInt(year),
            linkedinUrl: linkedin
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Save to Firestore
        const auth = window.firebaseAuth;
        const db = window.firebaseFirestore;
        const user = auth?.currentUser;
        
        if (user && db) {
            try {
                const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, {
                    name,
                    email,
                    university,
                    department,
                    yearOfStudy: parseInt(year),
                    linkedinUrl: linkedin,
                    updatedAt: new Date()
                });
                console.log('Personal info saved to Firestore');
            } catch (error) {
                console.error('Error saving personal info to Firestore:', error);
            }
        }
        
        document.getElementById('profileName').textContent = name;
        document.getElementById('sectionModal').style.display = 'none';
        alert('Personal information updated successfully!');
        location.reload(); // Refresh to show updated data
    });
};
