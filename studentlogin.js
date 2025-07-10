document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('student-login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Form validation
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showError(input, message) {
        const formGroup = input.parentElement;
        formGroup.classList.add('error');
        
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    function clearError(input) {
        const formGroup = input.parentElement;
        formGroup.classList.remove('error');
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    // Real-time validation
    emailInput.addEventListener('blur', function() {
        if (this.value && !validateEmail(this.value)) {
            showError(this, 'Please enter a valid email address');
        } else {
            clearError(this);
        }
    });

    emailInput.addEventListener('input', function() {
        if (this.value && validateEmail(this.value)) {
            clearError(this);
        }
    });

    passwordInput.addEventListener('input', function() {
        if (this.value) {
            clearError(this);
        }
    });

    // Form submission is now handled by Firebase Auth (firebase-auth.js)
    // The old form submission code has been removed to prevent conflicts

    // Google sign in button
    document.querySelector('.google-btn').addEventListener('click', function() {
        // Implement Google OAuth here
        console.log('Google sign in clicked');
        alert('Google sign in functionality would be implemented here.');
    });

    // Remember me functionality (if you want to add it later)
    function rememberUser(email) {
        localStorage.setItem('rememberedEmail', email);
    }

    function getRememberedUser() {
        return localStorage.getItem('rememberedEmail');
    }

    // Auto-fill remembered email on page load
    const rememberedEmail = getRememberedUser();
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
    }
});