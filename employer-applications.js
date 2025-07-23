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
          <p><strong>Student:</strong> ${app.studentName || 'N/A'}${app.studentEmail ? ` (${app.studentEmail})` : ''}</p>
          <p><strong>Year:</strong> ${app.studentYear || ''} | <strong>University:</strong> ${app.studentUniversity || ''} | <strong>Department:</strong> ${app.studentDepartment || ''}</p>
          <p><strong>Status:</strong> ${app.status || 'pending'}</p>
          ${app.startedAt ? `<p style='color:#22c55e; background-color:#f0fdf4; padding:8px; border-radius:4px; margin:8px 0;'><strong>✅ Started at:</strong> ${app.startedAtFormatted || new Date(app.startedAt.seconds ? app.startedAt.seconds * 1000 : app.startedAt).toLocaleString('en-US', { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</p>` : ''}
          ${app.finishedAt ? `<p style='color:#dc2626; background-color:#fef2f2; padding:8px; border-radius:4px; margin:8px 0;'><strong>🏁 Finished at:</strong> ${app.finishedAtFormatted || new Date(app.finishedAt.seconds ? app.finishedAt.seconds * 1000 : app.finishedAt).toLocaleString('en-US', { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</p>` : ''}
          ${app.status === 'pending' ? `
            <button onclick="handleApplicationAction('${docSnap.id}', 'accepted', '${app.studentId}', '${app.jobTitle}', '${app.employerName}', '${app.studentEmail}')">Accept</button>
            <button onclick="handleApplicationAction('${docSnap.id}', 'rejected', '${app.studentId}', '${app.jobTitle}', '${app.employerName}', '${app.studentEmail}')">Reject</button>
            <button onclick=\"window.location.href='mailto:${app.studentEmail}'\">Contact Student</button>
          ` : ''}
          ${app.status === 'accepted' && !app.startedAt ? `<button onclick="handleStartJob('${docSnap.id}')">Start</button>` : ''}
          ${app.status === 'accepted' && app.startedAt && !app.finishedAt ? `<button onclick="handleFinishJob('${docSnap.id}')">Finish</button>` : ''}
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
window.handleApplicationAction = async function(appId, action, studentId, jobTitle, employerName, studentEmail) {
  const db = window.firebaseFirestore;
  if (!confirm(`Are you sure you want to ${action} this application?`)) return;
  
  try {
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
    
    alert(`Application ${action}!`);
    loadEmployerApplications(window.firebaseAuth.currentUser.uid);
  } catch (err) {
    alert('Error updating application: ' + err.message);
  }
};

// Start job handler
window.handleStartJob = async function(appId) {
  const db = window.firebaseFirestore;
  try {
    const appRef = doc(db, 'applications', appId);
    // Create timestamp with correct local time (UTC+3)
    const startTime = new Date();
    // Ensure we're using the correct timezone offset (UTC+3)
    const utcTime = startTime.getTime() + (startTime.getTimezoneOffset() * 60000);
    const localTime = new Date(utcTime + (3 * 3600000)); // UTC+3
    
    const startTimeString = localTime.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    await updateDoc(appRef, { 
      startedAt: localTime,
      startedAtFormatted: startTimeString,
      startedAtISO: localTime.toISOString(),
      status: 'started'
    });
    alert(`Job started at ${startTimeString}!`);
    loadEmployerApplications(window.firebaseAuth.currentUser.uid);
  } catch (err) {
    alert('Error starting job: ' + err.message);
  }
};

// Finish job handler
window.handleFinishJob = async function(appId) {
  const db = window.firebaseFirestore;
  try {
    const appRef = doc(db, 'applications', appId);
    // Create timestamp with correct local time (UTC+3)
    const finishTime = new Date();
    // Ensure we're using the correct timezone offset (UTC+3)
    const utcTime = finishTime.getTime() + (finishTime.getTimezoneOffset() * 60000);
    const localTime = new Date(utcTime + (3 * 3600000)); // UTC+3
    
    const finishTimeString = localTime.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    await updateDoc(appRef, { 
      finishedAt: localTime,
      finishedAtFormatted: finishTimeString,
      finishedAtISO: localTime.toISOString(),
      status: 'finished'
    });
    alert(`Job finished at ${finishTimeString}!`);
    loadEmployerApplications(window.firebaseAuth.currentUser.uid);
  } catch (err) {
    alert('Error finishing job: ' + err.message);
  }
}; 