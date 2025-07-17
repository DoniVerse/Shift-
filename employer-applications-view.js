// employer-applications-view.js
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

/**
 * Renders employer job applications into the given element.
 * @param {HTMLElement} targetElement - The element to render applications into.
 * @param {string} employerUid - The employer's Firebase UID.
 * @param {object} [options] - Optional settings (e.g., modalMode: true disables Accept/Reject buttons).
 */
export async function renderEmployerApplications(targetElement, employerUid, options = {}) {
  const db = window.firebaseFirestore;
  if (!db) {
    targetElement.innerHTML = '<p>Firestore not available.</p>';
    return;
  }
  targetElement.innerHTML = '<p>Loading applications...</p>';
  try {
    const q = query(
      collection(db, 'applications'),
      where('employerId', '==', employerUid)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      targetElement.innerHTML = '<p>No applications found for your jobs yet.</p>';
      return;
    }
    let html = '';
    querySnapshot.forEach(docSnap => {
      const app = docSnap.data();
      // Fallbacks for alternate field names
      const university = app.studentUniversity || app.universityName || app.university || app.university_of_study || '';
      const year = app.studentYear || app.yearOfStudy || app.year || app.year_of_study || '';
      const department = app.studentDepartment || app.department || app.student_dept || '';
      const studentEmail = app.studentEmail || app.email || '';
      const studentName = app.studentName || app.name || '';
      const studentId = app.studentId || app.studentUID || app.studentUid || '';
      html += `
        <div class="application-card" style="border:1px solid #d1d5db; background:#f9fafb; padding:1.5em; margin-bottom:1.5em; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
          <h3 style="margin:0 0 0.5em 0; font-size:1.2em; color:#1e293b;">${app.jobTitle || 'Job'}</h3>
          <div style="margin-bottom:0.5em;"><strong>Student:</strong> <span style="color:#2563eb;">${studentName || 'N/A'}</span> <span style="color:#64748b;">(${studentEmail})</span></div>
          <div style="margin-bottom:0.5em;"><strong>University:</strong> <span style="color:#334155;">${university}</span></div>
          <div style="margin-bottom:0.5em;"><strong>Year of Study:</strong> <span style="color:#334155;">${year}</span></div>
          <div style="margin-bottom:0.5em;"><strong>Department:</strong> <span style="color:#334155;">${department}</span></div>
          <div style="margin-bottom:0.5em;"><strong>Status:</strong> <span style="color:${app.status === 'accepted' ? '#22c55e' : app.status === 'rejected' ? '#dc2626' : '#64748b'}; font-weight:500;">${app.status || 'pending'}</span></div>
          <div style="margin-top:10px;">
            <button onclick="window.location.href='chat.html?studentEmail=${encodeURIComponent(studentEmail)}'" style="background:#2563eb;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;margin-right:10px;">Contact Student</button>
            ${!options.modalMode && app.status === 'pending' ? `
              <button onclick=\"window.handleApplicationAction && window.handleApplicationAction('${docSnap.id}', 'accepted', '${studentId}')\" style=\"background:#22c55e;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;margin-right:10px;\">Accept</button>
              <button onclick=\"window.handleApplicationAction && window.handleApplicationAction('${docSnap.id}', 'rejected', '${studentId}')\" style=\"background:#dc2626;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;\">Reject</button>
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
    // If accepting, also set acceptedAt timestamp
    if (action === 'accepted') {
      await updateDoc(appDocRef, { status: action, acceptedAt: serverTimestamp() });
    } else {
      await updateDoc(appDocRef, { status: action });
    }
    // Fetch application data for notification
    const appSnap = await getDoc(appDocRef);
    const app = appSnap.data();
    // Compose notification
    let message = '';
    if (action === 'accepted') {
      message = `You have been accepted for the job '${app.jobTitle}'. Contact your employer (${app.employerName || ''}) to receive the file. You have ${app.expectedHours || 1} hour(s) to finish and submit the work through chat.`;
    } else if (action === 'rejected') {
      message = `You have been rejected for the job '${app.jobTitle}'.`;
    }
    // Debug log
    console.log('Adding notification for studentId:', studentId, 'Message:', message);
    if (studentId) {
      const notifRef = collection(db, 'users', studentId, 'notifications');
      await addDoc(notifRef, {
        type: 'application',
        status: action,
        jobTitle: app.jobTitle || '',
        employerName: app.employerName || '',
        employerEmail: app.employerEmail || '',
        message,
        timestamp: serverTimestamp(),
        applicationId: appId
      });
      console.log('Notification added!');
    } else {
      console.warn('No studentId provided, notification not added.');
    }
    alert(`Application ${action}! Notification sent to student.`);
    location.reload();
  } catch (err) {
    alert('Error updating application: ' + err.message);
    console.error('Error in handleApplicationAction:', err);
  }
}; 