document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('student-signup-form');
    const profilePictureInput = document.getElementById('profilePicture');
    const studentIdInput = document.getElementById('studentId');
    const profilePictureDisplay = document.getElementById('profilePictureDisplay');
    const studentIdDisplay = document.getElementById('studentIdDisplay');

    // Handle file upload displays
    function handleFileUpload(input, display) {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const uploadText = display.querySelector('.upload-text');
            
            if (file) {
                uploadText.textContent = file.name;
                display.classList.add('file-selected');
            } else {
                uploadText.textContent = input.id === 'profilePicture' ? 'Choose profile picture' : 'Upload student ID picture';
                display.classList.remove('file-selected');
            }
        });
    }

    handleFileUpload(profilePictureInput, profilePictureDisplay);
    handleFileUpload(studentIdInput, studentIdDisplay);

    // Form submission is now handled by Firebase Auth (firebase-auth.js)
    // The old form submission code has been removed to prevent conflicts

    // Google sign up button
    document.querySelector('.google-btn').addEventListener('click', function() {
        // Implement Google OAuth here
        console.log('Google sign up clicked');
        alert('Google sign up functionality would be implemented here.');
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