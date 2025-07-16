// employer-applications.js

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

  try {
    const querySnapshot = await db.collection('applications')
      .where('employerId', '==', employerUid)
      .get();

    if (querySnapshot.empty) {
      applicationsList.innerHTML = '<p>No applications found for your jobs yet.</p>';
      return;
    }

    let html = '';
    querySnapshot.forEach(doc => {
      const app = doc.data();
      html += `
        <div class="application-card" style="border:1px solid #ccc; padding:1em; margin-bottom:1em; border-radius:8px;">
          <h3>${app.jobTitle || 'Job'}</h3>
          <p><strong>Student:</strong> ${app.studentName || 'N/A'} (${app.studentEmail || ''})</p>
          <p><strong>Year:</strong> ${app.studentYear || ''} | <strong>University:</strong> ${app.studentUniversity || ''} | <strong>Department:</strong> ${app.studentDepartment || ''}</p>
          <p><strong>Status:</strong> ${app.status || 'pending'}</p>
          ${app.status === 'pending' ? `
            <button onclick="handleApplicationAction('${doc.id}', 'accepted')">Accept</button>
            <button onclick="handleApplicationAction('${doc.id}', 'rejected')">Reject</button>
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
  if (!confirm(`Are you sure you want to ${action} this application?`)) return;
  const db = window.firebaseFirestore;
  try {
    await db.collection('applications').doc(appId).update({ status: action });
    alert(`Application ${action}!`);
    location.reload();
  } catch (err) {
    alert('Error updating application: ' + err.message);
  }
}; 