// employer-applications.js
import { collection, query, where, getDocs, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  // Debug: Log the state of globals
  console.log('DEBUG: window.firebaseAuth:', window.firebaseAuth);
  console.log('DEBUG: window.firebaseFirestore:', window.firebaseFirestore);
  console.log('DEBUG: window.jobManager:', window.jobManager);

  // Wait for Firebase Auth to be ready
  if (window.firebaseAuth && typeof window.firebaseAuth.onAuthStateChange === 'function') {
    window.firebaseAuth.onAuthStateChange(user => {
      const applicationsList = document.getElementById('applications-list');
      if (!user) {
        applicationsList.innerHTML = '<p>Please log in as an employer to view applications.</p>';
        return;
      }
      // Now user is guaranteed to be loaded
      console.log('DEBUG: Auth user loaded:', user);
      console.log('DEBUG: window.firebaseFirestore at load:', window.firebaseFirestore);
      loadEmployerApplications(user.uid);
    });
  } else {
    // Only log a warning, do not show a message in the UI
    console.warn('DEBUG: window.firebaseAuth or onAuthStateChange not available', window.firebaseAuth);
  }
});

async function loadEmployerApplications(employerUid) {
  const db = window.firebaseFirestore;
  const applicationsList = document.getElementById('applications-list');
  applicationsList.innerHTML = '<p>Loading applications...</p>';

  if (!db) {
    applicationsList.innerHTML = '<p>Firestore not available.</p>';
    console.warn('DEBUG: Firestore not available when loading applications');
    return;
  }
  if (!employerUid) {
    applicationsList.innerHTML = '<p>Error: Employer ID is missing. Please log in again.</p>';
    console.error('DEBUG: employerUid is undefined or null');
    return;
  }

  try {
    console.log('Querying applications for employerUid:', employerUid);
    const q = query(
      collection(db, 'applications'),
      where('employerId', '==', employerUid)
    );
    const querySnapshot = await getDocs(q);
    console.log('QuerySnapshot size:', querySnapshot.size);
    querySnapshot.forEach(docSnap => {
      console.log('Application doc:', docSnap.id, docSnap.data());
    });

    if (querySnapshot.empty) {
      applicationsList.innerHTML = '<p>No applications found for your jobs yet.</p>';
      return;
    }

    let html = '';
    querySnapshot.forEach(docSnap => {
      const app = docSnap.data();
      html += `
        <div class="application-card" style="border:1px solid #ccc; padding:1em; margin-bottom:1em; border-radius:8px;">
          <h3>${app.jobTitle || 'Job'}</h3>
          <p><strong>Student:</strong> ${app.studentName || 'N/A'} (${app.studentEmail || ''})</p>
          <p><strong>Year:</strong> ${app.studentYear || ''} | <strong>University:</strong> ${app.studentUniversity || ''} | <strong>Department:</strong> ${app.studentDepartment || ''}</p>
          <p><strong>Status:</strong> ${app.status || 'pending'}</p>
          ${app.status === 'pending' ? `
            <button onclick="handleApplicationAction('${docSnap.id}', 'accepted', '${app.studentId}', '${app.jobTitle}', '${app.employerName}', '${app.studentEmail}')">Accept</button>
            <button onclick="handleApplicationAction('${docSnap.id}', 'rejected', '${app.studentId}', '${app.jobTitle}', '${app.employerName}', '${app.studentEmail}')">Reject</button>
            <button onclick=\"window.location.href='mailto:${app.studentEmail}'\">Contact Student</button>
          ` : ''}
        </div>
      `;
    });
    applicationsList.innerHTML = html;
  } catch (err) {
    applicationsList.innerHTML = `<p>Error loading applications: ${err.message}</p>`;
    console.error('DEBUG: Error loading applications:', err);
  }
}

// Accept/Reject handler
window.handleApplicationAction = async function(appId, action) {
  const db = window.firebaseFirestore;
  if (!confirm(`Are you sure you want to ${action} this application?`)) return;
window.handleApplicationAction = async function(appId, action, studentId, jobTitle, employerName, studentEmail) {
  const db = window.firebaseFirestore;
  const appRef = doc(db, 'applications', appId);
  await updateDoc(appRef, { status: action });
  if (action === 'accepted') {
    // Create notification for student
    const notificationsRef = collection(db, 'notifications');
    await window.firebaseAddDoc(notificationsRef, {
      studentId,
      jobTitle,
      employerName,
      studentEmail,
      status: 'accepted',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min from now
    });
  }
  loadEmployerApplications(window.firebaseAuth.currentUser.uid);
};
  try {
    const appDocRef = doc(db, 'applications', appId);
    await updateDoc(appDocRef, { status: action });
    alert(`Application ${action}!`);
    location.reload();
  } catch (err) {
    alert('Error updating application: ' + err.message);
  }
}; 