 document.addEventListener('DOMContentLoaded', function() {
            const roleOptions = document.querySelectorAll('.role-option');
            const continueBtn = document.getElementById('continueBtn');
            let selectedRole = null;

            roleOptions.forEach(option => {
                option.addEventListener('click', function() {
                    // Remove selected class from all options
                    roleOptions.forEach(opt => opt.classList.remove('selected'));
                    
                    // Add selected class to clicked option
                    this.classList.add('selected');
                    
                    // Store selected role
                    selectedRole = this.dataset.role;
                    
                    // Enable continue button
                    continueBtn.classList.add('active');
                });
            });

             continueBtn.addEventListener('click', function() {
        if (selectedRole) {
            // Redirect to different pages based on role
            if (selectedRole === 'student') {
                window.location.href = 'studentsignup.html';
            } else if (selectedRole === 'employer') {
                // For now, show alert until employer page is created
               window.location.href='employer-signup.html';
                // window.location.href = 'employer-signup.html';
            }
        }
    });

            // Add keyboard navigation
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && selectedRole) {
                    continueBtn.click();
                }
            });
        });