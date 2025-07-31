// employer-applications-view.js
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

/**
 * Renders employer job applications into the given element.
 * @param {HTMLElement} targetElement - The element to render applications into.
 * @param {string} employerUid - The employer's Firebase UID.
 * @param {object} [options] - Optional settings (e.g., modalMode: true disables Accept/Reject buttons).
 */
export async function renderEmployerApplications(targetElement, employerId, options = {}) {
  if (!targetElement) {
    console.error('Target element not found for renderEmployerApplications');
    return;
  }
  
  const db = window.firebaseFirestore;
  if (!db) {
    targetElement.innerHTML = '<p>Database not available.</p>';
    return;
  }

  try {
    const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
    const applicationsRef = collection(db, 'applications');
    const q = query(applicationsRef, where('employerId', '==', employerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      targetElement.innerHTML = '<p style="text-align:center;color:#64748b;padding:2em;">No applications received yet.</p>';
      return;
    }

    let html = '';
    querySnapshot.forEach(docSnap => {
      const app = docSnap.data();
      console.log('Application data:', app); // Debug log
      
      // Basic info with fallbacks
      const university = app.studentUniversity || app.universityName || app.university || 'Not provided';
      const year = app.studentYear || app.yearOfStudy || app.year || 'Not provided';
      const department = app.studentDepartment || app.department || 'Not provided';
      const studentEmail = app.studentEmail || app.email || 'Not provided';
      const studentName = app.studentName || app.name || 'Not provided';
      const studentId = app.studentId || app.studentUID || app.studentUid || '';
      
      // Enhanced profile information with better fallbacks
      const resumeFileName = app.resumeFileName || 'Not uploaded';
      const resumeSummary = app.resumeSummary || 'Not provided';
      const skills = Array.isArray(app.skills) ? app.skills : [];
      const workExperience = Array.isArray(app.workExperience) ? app.workExperience : [];
      const certifications = app.certifications || 'Not provided';
      const gpa = app.gpa || 'Not provided';
      const graduationDate = app.graduationDate || 'Not provided';
      const relevantCourses = app.relevantCourses || 'Not provided';
      const academicAchievements = app.academicAchievements || 'Not provided';
      const linkedIn = app.studentLinkedIn || app.linkedinUrl || 'Not provided';

      console.log('Processed data:', {
        resumeFileName, resumeSummary, skills, workExperience, certifications,
        gpa, graduationDate, relevantCourses, academicAchievements
      });

      html += `
        <div class="application-card" style="border:1px solid #d1d5db; background:#f9fafb; padding:1.5em; margin-bottom:1.5em; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
          <h3 style="margin:0 0 0.5em 0; font-size:1.2em; color:#1e293b;">${app.jobTitle || 'Job Application'}</h3>
          
          <!-- Basic Information -->
          <div style="margin-bottom:1em; padding:1em; background:#fff; border-radius:8px;">
            <h4 style="margin:0 0 0.5em 0; color:#2563eb;">📋 Basic Information</h4>
            <div style="margin-bottom:0.3em;"><strong>Student:</strong> <span style="color:#2563eb;">${studentName}</span></div>
            <div style="margin-bottom:0.3em;"><strong>Email:</strong> <span style="color:#64748b;">${studentEmail}</span></div>
            <div style="margin-bottom:0.3em;"><strong>University:</strong> <span style="color:#334155;">${university}</span></div>
            <div style="margin-bottom:0.3em;"><strong>Department:</strong> <span style="color:#334155;">${department}</span></div>
            <div style="margin-bottom:0.3em;"><strong>Year of Study:</strong> <span style="color:#334155;">${year}</span></div>
            <div style="margin-bottom:0.3em;"><strong>LinkedIn:</strong> <span style="color:#334155;">${linkedIn}</span></div>
            <div style="margin-bottom:0.3em;"><strong>Status:</strong> <span style="color:${app.status === 'accepted' ? '#22c55e' : app.status === 'rejected' ? '#dc2626' : '#64748b'}; font-weight:500;">${app.status || 'pending'}</span></div>
          </div>

          <!-- Resume Information -->
          <div style="margin-bottom:1em; padding:1em; background:#fff; border-radius:8px;">
            <h4 style="margin:0 0 0.5em 0; color:#2563eb;">📄 Resume & Summary</h4>
            <div style="margin-bottom:0.3em;"><strong>Resume File:</strong> <span style="color:#334155;">${resumeFileName}</span></div>
            <div><strong>Professional Summary:</strong></div>
            <div style="background:#f8f9fa; padding:0.5em; border-radius:4px; margin-top:0.3em; font-style:italic; color:#555; min-height:40px;">${resumeSummary}</div>
          </div>

          <!-- Skills & Experience -->
          <div style="margin-bottom:1em; padding:1em; background:#fff; border-radius:8px;">
            <h4 style="margin:0 0 0.5em 0; color:#2563eb;">💼 Skills & Experience</h4>
            <div style="margin-bottom:0.5em;"><strong>Skills:</strong> <span style="color:#334155;">${skills.length > 0 ? skills.join(', ') : 'Not provided'}</span></div>
            <div style="margin-bottom:0.5em;"><strong>Work Experience:</strong></div>
            <div style="background:#f8f9fa; padding:0.5em; border-radius:4px; margin-bottom:0.5em; white-space:pre-line; color:#555; min-height:40px;">${workExperience.length > 0 ? workExperience.join('\n\n') : 'Not provided'}</div>
            <div><strong>Certifications:</strong> <span style="color:#334155;">${certifications}</span></div>
          </div>

          <!-- Education Details -->
          <div style="margin-bottom:1em; padding:1em; background:#fff; border-radius:8px;">
            <h4 style="margin:0 0 0.5em 0; color:#2563eb;">🎓 Education Details</h4>
            <div style="margin-bottom:0.3em;"><strong>GPA:</strong> <span style="color:#334155;">${gpa}</span></div>
            <div style="margin-bottom:0.3em;"><strong>Expected Graduation:</strong> <span style="color:#334155;">${graduationDate}</span></div>
            <div style="margin-bottom:0.3em;"><strong>Relevant Courses:</strong></div>
            <div style="background:#f8f9fa; padding:0.5em; border-radius:4px; margin-bottom:0.5em; color:#555; min-height:40px;">${relevantCourses}</div>
            <div style="margin-bottom:0.3em;"><strong>Academic Achievements:</strong></div>
            <div style="background:#f8f9fa; padding:0.5em; border-radius:4px; color:#555; min-height:40px;">${academicAchievements}</div>
          </div>

          <!-- Action Buttons -->
          <div style="margin-top:1em; padding-top:1em; border-top:1px solid #e5e7eb;">
            <button onclick="window.location.href='chat.html?studentEmail=${encodeURIComponent(studentEmail)}'" style="background:#2563eb;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;margin-right:10px;">💬 Contact Student</button>
            ${!options.modalMode && app.status === 'pending' ? `
              <button onclick="window.handleApplicationAction && window.handleApplicationAction('${docSnap.id}', 'accepted', '${studentId}')" style="background:#22c55e;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;margin-right:10px;">✅ Accept</button>
              <button onclick="window.handleApplicationAction && window.handleApplicationAction('${docSnap.id}', 'rejected', '${studentId}')" style="background:#dc2626;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">❌ Reject</button>
            ` : ''}
          </div>
        </div>
      `;
    });
    targetElement.innerHTML = html;
  } catch (err) {
    targetElement.innerHTML = `<p>Error loading applications: ${err.message}</p>`;
    console.error('Error loading applications:', err);
  }
}

// Accept/Reject handler with notification
window.handleApplicationAction = async function(appId, action, studentId) {
  const db = window.firebaseFirestore;
  if (!confirm(`Are you sure you want to ${action} this application?`)) return;
  
  try {
    const { doc, updateDoc, addDoc, serverTimestamp, getDoc, collection } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
    const appDocRef = doc(db, 'applications', appId);
    
    // Get application details first
    const appDoc = await getDoc(appDocRef);
    const appData = appDoc.data();
    
    // Update application status
    if (action === 'accepted') {
      await updateDoc(appDocRef, { 
        status: action, 
        acceptedAt: serverTimestamp(),
        requiresAgreements: true 
      });
      
      // Send notification to student with agreement requirement
      const studentNotifRef = collection(db, 'users', studentId, 'notifications');
      await addDoc(studentNotifRef, {
        type: 'application_accepted',
        applicationId: appId,
        jobTitle: appData.jobTitle,
        employerName: appData.employerName,
        message: `You have been accepted for the job '${appData.jobTitle}'. Contact your employer (${appData.employerName}) to receive the file. You have 30 minutes to start and ${appData.duration || '1 hour(s)'} to finish and submit the work through chat.`,
        status: 'accepted',
        timestamp: serverTimestamp(),
        requiresAgreement: true,
        studentAgreementSigned: false
      });
      
    } else {
      await updateDoc(appDocRef, { status: action });
      
      // Send rejection notification
      const studentNotifRef = collection(db, 'users', studentId, 'notifications');
      await addDoc(studentNotifRef, {
        type: 'application_rejected',
        applicationId: appId,
        jobTitle: appData.jobTitle,
        employerName: appData.employerName,
        message: `Your application for '${appData.jobTitle}' has been rejected.`,
        status: 'rejected',
        timestamp: serverTimestamp()
      });
    }
    
    alert(`Application ${action}!`);
    // Reload applications
    const user = window.firebaseAuth && window.firebaseAuth.currentUser;
    if (user) {
      loadEmployerApplications(user.uid);
    }
  } catch (err) {
    alert('Error updating application: ' + err.message);
  }
}; 
