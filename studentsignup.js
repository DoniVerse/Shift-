document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('student-signup-form');
    const profilePictureInput = document.getElementById('profilePicture');
    const studentIdInput = document.getElementById('studentId');
    const cvUploadInput = document.getElementById('cvUpload');
    const profilePictureDisplay = document.getElementById('profilePictureDisplay');
    const studentIdDisplay = document.getElementById('studentIdDisplay');
    const cvUploadDisplay = document.getElementById('cvUploadDisplay');

    // Handle file upload displays
    function handleFileUpload(input, display) {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const uploadText = display.querySelector('.upload-text');
            
            if (file) {
                uploadText.textContent = file.name;
                display.classList.add('file-selected');
            } else {
                let defaultText = 'Choose file';
                if (input.id === 'profilePicture') defaultText = 'Choose profile picture';
                else if (input.id === 'studentId') defaultText = 'Upload student ID picture';
                else if (input.id === 'cvUpload') defaultText = 'Upload your CV/Resume (PDF, DOC, DOCX)';

                uploadText.textContent = defaultText;
                display.classList.remove('file-selected');
            }
        });
    }

    handleFileUpload(profilePictureInput, profilePictureDisplay);
    handleFileUpload(studentIdInput, studentIdDisplay);
    handleFileUpload(cvUploadInput, cvUploadDisplay);

    // Form submission: upload student ID image to Firebase Storage and save URL to Firestore
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Get student ID file
        const studentIdFile = studentIdInput.files[0];
        // Get other form data as needed
        // ...existing code for other fields...

        // Firebase imports (assume firebase-auth.js already loaded and initialized)
        // Use window.firebaseApp, window.firebaseAuth, window.firebaseFirestore if available
        const app = window.firebaseApp || window.app;
        const db = window.firebaseFirestore || window.db;
        const auth = window.firebaseAuth || window.auth;
        const storage = window.firebaseStorage || (await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js')).getStorage(app);
        const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js');

        let studentIdImageUrl = '';
        if (studentIdFile) {
            try {
                // Upload to Firebase Storage
                const storageRef = ref(storage, 'student_ids/' + Date.now() + '_' + studentIdFile.name);
                await uploadBytes(storageRef, studentIdFile);
                studentIdImageUrl = await getDownloadURL(storageRef);
            } catch (err) {
                console.error('Error uploading student ID image:', err);
            }
        }

        // After successful signup (handled by firebase-auth.js), update Firestore profile
        // Save studentIdImageUrl to Firestore user profile as soon as user is available
        async function saveStudentIdImageUrl() {
            const user = auth.currentUser;
            if (user && studentIdImageUrl) {
                const { doc, setDoc, updateDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    await updateDoc(userDocRef, { studentIdImageUrl });
                } else {
                    await setDoc(userDocRef, { studentIdImageUrl }, { merge: true });
                }
            }
        }
        // Try immediately, then fallback to wait for user creation
        await saveStudentIdImageUrl();
        if (!auth.currentUser) {
            auth.onAuthStateChanged(async (user) => {
                if (user) await saveStudentIdImageUrl();
            });
        }
    });

    // Google sign up button
    document.querySelector('.google-btn').addEventListener('click', function() {
        // Implement Google OAuth here
        console.log('Google sign up clicked');

    });

    // LinkedIn URL validation
    const linkedinInput = document.getElementById('linkedinUrl');
    linkedinInput.addEventListener('blur', function() {
        const url = this.value;
        if (url && !url.includes('linkedin.com')) {
            this.style.borderColor = '#e74c3c';
            // You could show an error message here
        } else {
            this.style.borderColor = '#e1e5e9';
        }
    });
});