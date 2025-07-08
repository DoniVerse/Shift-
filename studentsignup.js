document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('studentSignupForm');
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

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        
        // Extract form values
        const userData = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            password: formData.get('password'),
            universityName: formData.get('universityName'),
            yearOfStudy: parseInt(formData.get('yearOfStudy')),
            department: formData.get('department'),
            linkedinUrl: formData.get('linkedinUrl'),
            profilePicture: formData.get('profilePicture'),
            studentId: formData.get('studentId')
        };
        
        // Basic validation
        const requiredFields = ['fullName', 'email', 'password', 'universityName', 'yearOfStudy', 'department'];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const input = document.getElementById(field);
            if (!input.value.trim()) {
                input.style.borderColor = '#e74c3c';
                isValid = false;
            } else {
                input.style.borderColor = '#e1e5e9';
            }
        });
        
        // Check if student ID is uploaded
        if (!studentIdInput.files[0]) {
            studentIdDisplay.style.borderColor = '#e74c3c';
            isValid = false;
        } else {
            studentIdDisplay.style.borderColor = '#e1e5e9';
        }
        
        if (isValid) {
            // Show loading state
            const submitBtn = form.querySelector('.signup-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                // Store user data in localStorage for the job listing page
                const userDataForStorage = {
                    name: userData.fullName,
                    email: userData.email,
                    yearOfStudy: userData.yearOfStudy,
                    university: userData.universityName,
                    department: userData.department,
                    linkedinUrl: userData.linkedinUrl
                };
                
                localStorage.setItem('currentUser', JSON.stringify(userDataForStorage));
                
                console.log('Account created successfully!', userDataForStorage);
                alert('Account created successfully! Welcome to the platform.');
                
                // Redirect to job listing page with user data
                window.location.href = 'job-listing.html';
                
            }, 2000);
        } else {
            alert('Please fill in all required fields and upload your student ID.');
        }
    });

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