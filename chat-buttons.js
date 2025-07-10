// Chat Buttons Integration
// Adds "Message" buttons to job listings and profiles

class ChatButtons {
    constructor() {
        this.init();
    }

    init() {
        this.addChatButtonsToJobListings();
        this.addChatButtonsToProfiles();
        this.setupEventListeners();
    }

    // Add chat buttons to job listings
    addChatButtonsToJobListings() {
        // Find all job cards
        const jobCards = document.querySelectorAll('.job-card, .job-item');
        
        jobCards.forEach((card, index) => {
            // Skip if button already exists
            if (card.querySelector('.chat-btn')) return;
            
            // Create chat button
            const chatBtn = this.createChatButton('Message Employer', 'employer');
            chatBtn.dataset.jobIndex = index;
            
            // Find the best place to insert the button
            const actionsContainer = card.querySelector('.job-actions, .card-actions, .job-buttons');
            const applyButton = card.querySelector('.apply-btn, .btn-apply, button');
            
            if (actionsContainer) {
                actionsContainer.appendChild(chatBtn);
            } else if (applyButton && applyButton.parentNode) {
                applyButton.parentNode.insertBefore(chatBtn, applyButton.nextSibling);
            } else {
                // Create actions container if none exists
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'job-actions';
                actionsDiv.appendChild(chatBtn);
                card.appendChild(actionsDiv);
            }
        });
    }

    // Add chat buttons to profiles
    addChatButtonsToProfiles() {
        // Check if we're on a profile page
        const isStudentProfile = window.location.pathname.includes('student-profile');
        const isEmployerProfile = window.location.pathname.includes('employer-profile');
        
        if (isStudentProfile || isEmployerProfile) {
            const profileHeader = document.querySelector('.profile-header, .profile-section, .header');
            
            if (profileHeader && !profileHeader.querySelector('.chat-btn')) {
                const userType = isStudentProfile ? 'student' : 'employer';
                const chatBtn = this.createChatButton(`Message this ${userType}`, userType);
                chatBtn.classList.add('profile-chat-btn');
                
                // Add to profile header
                profileHeader.appendChild(chatBtn);
            }
        }
    }

    // Create chat button element
    createChatButton(text, userType) {
        const button = document.createElement('button');
        button.className = 'chat-btn btn-secondary';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 6px;">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${text}
        `;
        button.dataset.userType = userType;
        
        return button;
    }

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.chat-btn')) {
                e.preventDefault();
                this.handleChatButtonClick(e.target.closest('.chat-btn'));
            }
        });
    }

    // Handle chat button click
    handleChatButtonClick(button) {
        const userType = button.dataset.userType;
        const jobIndex = button.dataset.jobIndex;
        
        // Get user data based on context
        let targetUser = null;
        
        if (jobIndex !== undefined) {
            // From job listing - get employer info
            targetUser = this.getEmployerFromJobListing(jobIndex);
        } else {
            // From profile page - get profile user info
            targetUser = this.getUserFromProfile();
        }
        
        if (targetUser) {
            this.startChatWithUser(targetUser);
        } else {
            // Fallback - open chat page
            this.openChatPage();
        }
    }

    // Get employer info from job listing
    getEmployerFromJobListing(jobIndex) {
        // This would typically come from your job data
        // For now, return mock data
        return {
            id: `employer_${jobIndex}`,
            name: 'Law Firm Employer',
            email: 'employer@lawfirm.com',
            userType: 'employer',
            avatar: 'https://via.placeholder.com/40x40/5a3e5d/ffffff?text=E'
        };
    }

    // Get user info from profile page
    getUserFromProfile() {
        const profileName = document.querySelector('.profile-name, h1, .user-name');
        const name = profileName ? profileName.textContent.trim() : 'User';
        
        return {
            id: `user_${Date.now()}`,
            name: name,
            email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            userType: window.location.pathname.includes('student') ? 'student' : 'employer',
            avatar: `https://via.placeholder.com/40x40/d17e7e/ffffff?text=${name.charAt(0)}`
        };
    }

    // Start chat with specific user
    startChatWithUser(user) {
        // Store target user info for chat page
        sessionStorage.setItem('chatTargetUser', JSON.stringify(user));
        
        // Open chat page
        window.open('chat.html?startChat=true', '_blank');
    }

    // Open chat page
    openChatPage() {
        window.open('chat.html', '_blank');
    }

    // Add styles for chat buttons
    addStyles() {
        if (document.getElementById('chat-buttons-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'chat-buttons-styles';
        styles.textContent = `
            .chat-btn {
                display: inline-flex;
                align-items: center;
                padding: 8px 16px;
                background: #f8f9fa;
                color: #5a3e5d;
                border: 1px solid #d17e7e;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                margin: 4px;
            }
            
            .chat-btn:hover {
                background: #d17e7e;
                color: white;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(209, 126, 126, 0.3);
            }
            
            .chat-btn svg {
                transition: all 0.2s ease;
            }
            
            .chat-btn:hover svg {
                stroke: white;
            }
            
            .profile-chat-btn {
                margin-top: 15px;
                font-size: 16px;
                padding: 10px 20px;
            }
            
            .job-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
                flex-wrap: wrap;
            }
            
            @media (max-width: 768px) {
                .chat-btn {
                    font-size: 12px;
                    padding: 6px 12px;
                }
                
                .profile-chat-btn {
                    font-size: 14px;
                    padding: 8px 16px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Enhanced chat widget with better integration
class EnhancedChatWidget extends ChatWidget {
    constructor(options = {}) {
        super(options);
        this.checkForTargetUser();
    }

    // Check if there's a target user to start chat with
    checkForTargetUser() {
        const urlParams = new URLSearchParams(window.location.search);
        const startChat = urlParams.get('startChat');
        
        if (startChat && window.location.pathname.includes('chat.html')) {
            const targetUser = sessionStorage.getItem('chatTargetUser');
            if (targetUser) {
                try {
                    const user = JSON.parse(targetUser);
                    setTimeout(() => {
                        this.startConversationWithTargetUser(user);
                    }, 1000);
                    
                    // Clear the stored user
                    sessionStorage.removeItem('chatTargetUser');
                } catch (error) {
                    console.error('Error parsing target user:', error);
                }
            }
        }
    }

    // Start conversation with target user
    startConversationWithTargetUser(user) {
        // This would integrate with your chat system
        console.log('Starting conversation with:', user);
        
        // Show notification
        this.showNotification(`Starting conversation with ${user.name}...`);
        
        // If chat app is available, use it
        if (window.chatApp) {
            window.chatApp.startConversationWithUser(user.id);
        }
    }

    // Show notification
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'chat-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d17e7e;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            font-size: 14px;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize chat buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const chatButtons = new ChatButtons();
    chatButtons.addStyles();
    
    // Replace default chat widget with enhanced version if on chat page
    if (window.location.pathname.includes('chat.html')) {
        window.chatWidget = new EnhancedChatWidget();
    }
});

// Export for manual use
window.ChatButtons = ChatButtons;
window.EnhancedChatWidget = EnhancedChatWidget;
