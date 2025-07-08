document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
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

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        let isValid = true;

        // Clear previous errors
        clearError(emailInput);
        clearError(passwordInput);

        // Validate email
        if (!email) {
            showError(emailInput, 'Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError(emailInput, 'Please enter a valid email address');
            isValid = false;
        }

        // Validate password
        if (!password) {
            showError(passwordInput, 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            showError(passwordInput, 'Password must be at least 6 characters');
            isValid = false;
        }

        if (isValid) {
            // Show loading state
            const submitBtn = form.querySelector('.signin-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Signing In...';
            submitBtn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                // Here you would typically send the data to your server
                console.log('Login attempt:', { email, password });
                
                // For demo purposes, let's simulate a successful login
                if (email === 'demo@example.com' && password === 'password') {
                    alert('Login successful! Welcome back.');
                    // Redirect to dashboard
                    // window.location.href = 'dashboard.html';
                } else {
                    // Simulate login failure
                    showError(passwordInput, 'Invalid email or password');
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            }, 1500);
        }
    });

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