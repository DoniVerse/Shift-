// employer-applications.js
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {

  // Wait for Firebase Auth to be ready
  if (window.firebaseAuth && typeof window.firebaseAuth.onAuthStateChange === 'function') {
    window.firebaseAuth.onAuthStateChange(user => {
      const applicationsList = document.getElementById('applications-list');
      if (!user) {
        applicationsList.innerHTML = '<p>Please log in as an employer to view applications.</p>';
        return;
      }
      // Now user is guaranteed to be loaded
      loadEmployerApplications(user.uid);
    });
  }
});

async function loadEmployerApplications(employerUid) {
  const db = window.firebaseFirestore;
  const applicationsList = document.getElementById('applications-list');
  applicationsList.innerHTML = '<p>Loading applications...</p>';

  if (!db) {
    applicationsList.innerHTML = '<p>Firestore not available.</p>';
    return;
  }
  if (!employerUid) {
    applicationsList.innerHTML = '<p>Error: Employer ID is missing. Please log in again.</p>';
    return;
  }

  try {
    const q = query(
      collection(db, 'applications'),
      where('employerId', '==', employerUid)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      applicationsList.innerHTML = '<p>No applications found for your jobs yet.</p>';
      return;
    }

    let html = '';
    querySnapshot.forEach(docSnap => {
      const app = docSnap.data();
      const bothAgreementsSigned = app.studentAgreementSigned && app.employerAgreementSigned;
      html += `
        <div class="application-card" data-app-id="${docSnap.id}" style="border:1px solid #ccc; padding:1em; margin-bottom:1em; border-radius:8px;">
          <h3>${app.jobTitle || 'Job'}</h3>
          <p><strong>Student:</strong> ${app.studentName || 'N/A'}${app.studentEmail ? ` (${app.studentEmail})` : ''}</p>
          <p><strong>Year:</strong> ${app.studentYear || ''} | <strong>University:</strong> ${app.studentUniversity || ''} | <strong>Department:</strong> ${app.studentDepartment || ''}</p>
          <p><strong>Status:</strong> ${app.status || 'pending'}</p>
          ${app.status === 'pending' ? `
            <button onclick="handleApplicationAction('${docSnap.id}', 'accepted', '${app.studentId}', '${app.jobTitle}', '${app.employerName}', '${app.studentEmail}')">Accept</button>
            <button onclick="handleApplicationAction('${docSnap.id}', 'rejected', '${app.studentId}', '${app.jobTitle}', '${app.employerName}', '${app.studentEmail}')">Reject</button>
            <button onclick=\"window.location.href='mailto:${app.studentEmail}'\">Contact Student</button>
          ` : ''}
          ${app.status === 'accepted' && !bothAgreementsSigned ? `
            <div style="background:#fff3cd; border:1px solid #ffeaa7; padding:15px; border-radius:4px; margin:10px 0;">
              <p style="margin:0; color:#856404; font-weight:bold;">📋 Check your notifications. If the student accepts the agreement and you agree to the terms, then you can start the job in the job-application section.</p>
            </div>
            <button onclick=\"window.location.href='mailto:${app.studentEmail}'\">Contact Student</button>
          ` : ''}
          ${app.status === 'accepted' && bothAgreementsSigned && !app.startedAt ? `
            <button onclick="handleStartJob('${docSnap.id}')">Start</button>
            <div style="margin-top:10px;">
              <img src="QR.jpg" alt="QR Code" style="border:1px solid #ccc;width:150px;height:150px;">
            </div>
          ` : ''}
          ${app.status === 'accepted' && bothAgreementsSigned && app.startedAt && !app.finishedAt ? `
            <button onclick="handleFinishJob('${docSnap.id}')">Finish</button>
            <div style="margin-top:10px;">
              <img src="QR.jpg" alt="QR Code" style="border:1px solid #ccc;width:150px;height:150px;">
            </div>
          ` : ''}
          ${app.startedAt ? `<p style='color:#22c55e; background-color:#f0fdf4; padding:8px; border-radius:4px; margin:8px 0;'><strong>✅ Started at:</strong> ${app.startedAtFormatted || new Date(app.startedAt.seconds ? app.startedAt.seconds * 1000 : app.startedAt).toLocaleString()}</p>` : ''}
          ${app.finishedAt ? `<p style='color:#dc2626; background-color:#fef2f2; padding:8px; border-radius:4px; margin:8px 0;'><strong>🏁 Finished at:</strong> ${app.finishedAtFormatted || new Date(app.finishedAt.seconds ? app.finishedAt.seconds * 1000 : app.finishedAt).toLocaleString()}</p>` : ''}
        </div>
      `;
    });
    applicationsList.innerHTML = html;
  } catch (err) {
    applicationsList.innerHTML = `<p>Error loading applications: ${err.message}</p>`;
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
      await addDoc(notificationsRef, {
        studentId,
        jobTitle,
        employerName,
        studentEmail,
        status: 'accepted',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min from now
      });
      // Update the application card UI directly
      const card = document.querySelector(`[data-app-id='${appId}']`);
      if (card) {
        // Remove action buttons
        const buttons = card.querySelectorAll('button');
        buttons.forEach(btn => btn.remove());
        // Insert the info message
        const infoDiv = document.createElement('div');
        infoDiv.style.background = '#fff3cd';
        infoDiv.style.border = '1px solid #ffeaa7';
        infoDiv.style.padding = '15px';
        infoDiv.style.borderRadius = '4px';
        infoDiv.style.margin = '10px 0';
        infoDiv.innerHTML = '<p style="margin:0; color:#856404; font-weight:bold;">📋 Do not start the job yet. Check your notifications. If the student accepts the agreement and you agree to the terms, then you can start the job in the job-application section.</p>';
        card.appendChild(infoDiv);
      }
      alert('Application accepted!');
    } else {
      alert(`Application ${action}!`);
      window.location.reload();
    }
  } catch (err) {
    console.error('Error in handleApplicationAction:', err);
    alert('Error updating application: ' + err.message);
    window.location.reload();
  }
};
