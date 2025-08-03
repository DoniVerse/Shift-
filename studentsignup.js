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

    // Form submission is now handled by Firebase Auth (firebase-auth.js)
    // The old form submission code has been removed to prevent conflicts

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