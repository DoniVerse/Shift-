// Chat Integration Widget
// Adds a floating chat button to existing pages

class ChatWidget {
    constructor(options = {}) {
        this.options = {
            position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
            theme: 'light', // 'light', 'dark'
            showUnreadCount: true,
            autoOpen: false,
            ...options
        };
        
        this.isOpen = false;
        this.unreadCount = 0;
        this.currentUser = null;
        
        this.init();
    }

    // Initialize the widget
    init() {
        this.createWidget();
        this.setupEventListeners();
        this.loadUserData();
        
        // Initialize Firebase auth integration
        this.initializeAuth();
        
        // Setup real-time notifications
        this.setupNotifications();
    }
    
    // Initialize Firebase authentication
    initializeAuth() {
        // Check if Firebase auth is available
        if (typeof window.auth !== 'undefined' && window.auth) {
            // Listen for auth state changes
            window.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.updateWidget();
                
                if (user) {
                    // User signed in, setup notifications
                    this.setupNotifications();
                    this.loadConversations();
                } else {
                    // User signed out, clear notifications
                    this.updateUnreadCount(0);
                }
            });
        } else {
            // Fallback to legacy auth integration
            if (window.authIntegration) {
                window.authIntegration.onAuthStateChange((user) => {
                    this.currentUser = user;
                    this.updateWidget();
                });
            }
        }
    }

    // Create the widget HTML
    createWidget() {
        // Create widget container
        this.widget = document.createElement('div');
        this.widget.className = `chat-widget chat-widget-${this.options.position} chat-widget-${this.options.theme}`;
        this.widget.innerHTML = `
            <div class="chat-widget-button" id="chatWidgetButton">
                <div class="chat-widget-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="chat-widget-unread" id="chatWidgetUnread" style="display: none;">0</div>
                <div class="chat-widget-close" id="chatWidgetClose" style="display: none;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>
            <div class="chat-widget-popup" id="chatWidgetPopup" style="display: none;">
                <div class="chat-widget-header">
                    <h3>Messages</h3>
                    <button class="chat-widget-expand" id="chatWidgetExpand" title="Open in new window">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div class="chat-widget-content">
                    <div class="chat-widget-loading">
                        <div class="chat-widget-spinner"></div>
                        <span>Loading conversations...</span>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        this.addStyles();
        
        // Add to page
        document.body.appendChild(this.widget);
    }

    // Add CSS styles
    addStyles() {
        if (document.getElementById('chat-widget-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'chat-widget-styles';
        styles.textContent = `
            .chat-widget {
                position: fixed;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .chat-widget-bottom-right {
                bottom: 20px;
                right: 20px;
            }
            
            .chat-widget-bottom-left {
                bottom: 20px;
                left: 20px;
            }
            
            .chat-widget-top-right {
                top: 20px;
                right: 20px;
            }
            
            .chat-widget-top-left {
                top: 20px;
                left: 20px;
            }
            
            .chat-widget-button {
                width: 60px;
                height: 60px;
                background: #d17e7e;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transition: all 0.3s ease;
                position: relative;
                color: white;
            }
            
            .chat-widget-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            }
            
            .chat-widget-icon {
                transition: all 0.3s ease;
            }
            
            .chat-widget-button.open .chat-widget-icon {
                transform: scale(0);
                opacity: 0;
            }
            
            .chat-widget-close {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                transition: all 0.3s ease;
                opacity: 0;
            }
            
            .chat-widget-button.open .chat-widget-close {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            
            .chat-widget-unread {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #dc3545;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 600;
                border: 2px solid white;
            }
            
            .chat-widget-popup {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 350px;
                height: 400px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
                border: 1px solid #e1e5e9;
                overflow: hidden;
                transform: scale(0.8) translateY(20px);
                opacity: 0;
                transition: all 0.3s ease;
            }
            
            .chat-widget-popup.open {
                transform: scale(1) translateY(0);
                opacity: 1;
            }
            
            .chat-widget-bottom-left .chat-widget-popup {
                right: auto;
                left: 0;
            }
            
            .chat-widget-top-right .chat-widget-popup,
            .chat-widget-top-left .chat-widget-popup {
                bottom: auto;
                top: 80px;
            }
            
            .chat-widget-header {
                padding: 15px 20px;
                border-bottom: 1px solid #e1e5e9;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #f8f9fa;
            }
            
            .chat-widget-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
            
            .chat-widget-expand {
                background: none;
                border: none;
                cursor: pointer;
                color: #666;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            
            .chat-widget-expand:hover {
                background: #e9ecef;
                color: #333;
            }
            
            .chat-widget-content {
                height: calc(100% - 60px);
                overflow-y: auto;
                padding: 20px;
            }
            
            .chat-widget-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #666;
                font-size: 14px;
            }
            
            .chat-widget-spinner {
                width: 24px;
                height: 24px;
                border: 2px solid #e1e5e9;
                border-top: 2px solid #d17e7e;
                border-radius: 50%;
                animation: chat-widget-spin 1s linear infinite;
                margin-bottom: 10px;
            }
            
            @keyframes chat-widget-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .chat-widget-conversation {
                display: flex;
                align-items: center;
                padding: 12px 0;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s ease;
            }
            
            .chat-widget-conversation:hover {
                background: #f8f9fa;
                margin: 0 -20px;
                padding-left: 20px;
                padding-right: 20px;
            }
            
            .chat-widget-conversation:last-child {
                border-bottom: none;
            }
            
            .chat-widget-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                margin-right: 12px;
                object-fit: cover;
            }
            
            .chat-widget-conversation-info {
                flex: 1;
                min-width: 0;
            }
            
            .chat-widget-conversation-name {
                font-size: 14px;
                font-weight: 600;
                color: #333;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .chat-widget-conversation-preview {
                font-size: 12px;
                color: #666;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .chat-widget-conversation-meta {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 4px;
            }
            
            .chat-widget-conversation-time {
                font-size: 11px;
                color: #999;
            }
            
            .chat-widget-conversation-unread {
                background: #d17e7e;
                color: white;
                font-size: 10px;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: 10px;
                min-width: 16px;
                text-align: center;
            }
            
            .chat-widget-empty {
                text-align: center;
                color: #666;
                font-size: 14px;
                padding: 40px 20px;
            }
            
            .chat-widget-empty-icon {
                font-size: 48px;
                margin-bottom: 15px;
                opacity: 0.5;
            }
            
            .chat-widget-start-chat {
                background: #d17e7e;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                cursor: pointer;
                margin-top: 15px;
                transition: all 0.2s ease;
            }
            
            .chat-widget-start-chat:hover {
                background: #c06c6c;
            }
            
            @media (max-width: 768px) {
                .chat-widget-popup {
                    width: 300px;
                    height: 350px;
                }
                
                .chat-widget-bottom-right {
                    bottom: 15px;
                    right: 15px;
                }
                
                .chat-widget-bottom-left {
                    bottom: 15px;
                    left: 15px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // Setup event listeners
    setupEventListeners() {
        const button = this.widget.querySelector('#chatWidgetButton');
        const popup = this.widget.querySelector('#chatWidgetPopup');
        const expandBtn = this.widget.querySelector('#chatWidgetExpand');
        
        button.addEventListener('click', () => {
            this.toggleWidget();
        });
        
        expandBtn.addEventListener('click', () => {
            this.openFullChat();
        });
        
        // Close widget when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.widget.contains(e.target) && this.isOpen) {
                this.closeWidget();
            }
        });
    }

    // Load user data and conversations
    loadUserData() {
        // Check if user is already authenticated
        if (this.currentUser) {
            this.loadConversations();
        } else {
            // Wait for auth state to be determined
            setTimeout(() => {
                if (this.currentUser) {
                    this.loadConversations();
                }
            }, 2000);
        }
    }

    // Load real conversations from Firebase
    async loadConversations() {
        const content = this.widget.querySelector('.chat-widget-content');
        
        if (!this.currentUser) {
            content.innerHTML = `
                <div class="chat-widget-empty">
                    <div class="chat-widget-empty-icon">🔐</div>
                    <div>Please sign in to view conversations</div>
                    <button class="chat-widget-start-chat" onclick="window.location.href='/login.html'">
                        Sign In
                    </button>
                </div>
            `;
            return;
        }
        
        try {
            // Import Firebase functions if available
            if (typeof window.db === 'undefined') {
                console.log('Firebase not available, showing empty state');
                this.showEmptyConversations(content);
                return;
            }
            
            // Get Firebase functions from global scope or imports
            const { collection, query, where, onSnapshot, orderBy } = window.firebaseImports || 
                (typeof window.firebase !== 'undefined' ? window.firebase : {});
            if (!collection) {
                console.log('Firebase functions not available');
                this.showEmptyConversations(content);
                return;
            }
            
            // Query conversations for current user
            const conversationsRef = collection(window.db, 'conversations');
            const q = query(
                conversationsRef,
                where('participants', 'array-contains', this.currentUser.uid)
            );
            
            // Listen for real-time updates
            onSnapshot(q, (snapshot) => {
                const conversations = [];
                
                snapshot.forEach((doc) => {
                    const conversation = { id: doc.id, ...doc.data() };
                    conversations.push(conversation);
                });
                
                this.renderConversations(conversations, content);
            });
            
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showEmptyConversations(content);
        }
    }
    
    // Show empty conversations state
    showEmptyConversations(content) {
        content.innerHTML = `
            <div class="chat-widget-empty">
                <div class="chat-widget-empty-icon">💬</div>
                <div>No conversations yet</div>
                <button class="chat-widget-start-chat" onclick="chatWidget.openFullChat()">
                    Start Chatting
                </button>
            </div>
        `;
    }
    
    // Render conversations with real data
    renderConversations(conversations, content) {
        if (conversations.length === 0) {
            this.showEmptyConversations(content);
            return;
        }
        
        // Sort conversations by last message time
        conversations.sort((a, b) => {
            const aTime = a.lastMessageTime?.toDate() || a.createdAt?.toDate() || new Date(0);
            const bTime = b.lastMessageTime?.toDate() || b.createdAt?.toDate() || new Date(0);
            return bTime - aTime;
        });
        
        // Generate avatar for user
        const generateAvatar = (name) => {
            const colors = ['#d17e7e', '#5a3e5d', '#8c6c8e', '#4a3249'];
            const colorIndex = name ? name.length % colors.length : 0;
            const initial = name ? name.charAt(0).toUpperCase() : 'U';
            return `data:image/svg+xml;base64,${btoa(`<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" fill="${colors[colorIndex]}"/><text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="14">${initial}</text></svg>`)}`;
        };
        
        const conversationElements = conversations.map(conv => {
            // Get other participant info
            const otherParticipantId = conv.participants.find(id => id !== this.currentUser.uid);
            const userName = conv.participantNames?.[otherParticipantId] || 'Unknown User';
            const userAvatar = generateAvatar(userName);
            
            // Calculate unread count for current user
            const unreadCount = conv.unreadCount?.[this.currentUser.uid] || 0;
            
            // Format time
            const lastMessageTime = conv.lastMessageTime ? 
                this.formatTime(conv.lastMessageTime.toDate()) : 'Recently';
            
            return `
                <div class="chat-widget-conversation" onclick="chatWidget.openConversation('${conv.id}')">
                    <img src="${userAvatar}" alt="${userName}" class="chat-widget-avatar">
                    <div class="chat-widget-conversation-info">
                        <div class="chat-widget-conversation-name">${userName}</div>
                        <div class="chat-widget-conversation-preview">${conv.lastMessage || 'Start a conversation'}</div>
                    </div>
                    <div class="chat-widget-conversation-meta">
                        <div class="chat-widget-conversation-time">${lastMessageTime}</div>
                        ${unreadCount > 0 ? `<div class="chat-widget-conversation-unread">${unreadCount}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = conversationElements;
        
        // Update total unread count
        const totalUnread = conversations.reduce((sum, conv) => {
            return sum + (conv.unreadCount?.[this.currentUser.uid] || 0);
        }, 0);
        
        this.updateUnreadCount(totalUnread);
    }
    
    // Format time helper
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    }
    
    // Setup real-time notifications
    setupNotifications() {
        if (!this.currentUser || typeof window.db === 'undefined') return;
        
        try {
            // Get Firebase functions from global scope or imports
            const { collection, query, where, onSnapshot } = window.firebaseImports || 
                (typeof window.firebase !== 'undefined' ? window.firebase : {});
            if (!collection) return;
            
            // Listen for new messages in user's conversations
            const conversationsRef = collection(window.db, 'conversations');
            const q = query(
                conversationsRef,
                where('participants', 'array-contains', this.currentUser.uid)
            );
            
            onSnapshot(q, (snapshot) => {
                let totalUnread = 0;
                
                snapshot.forEach((doc) => {
                    const conversation = doc.data();
                    const unreadCount = conversation.unreadCount?.[this.currentUser.uid] || 0;
                    totalUnread += unreadCount;
                });
                
                this.updateUnreadCount(totalUnread);
                
                // Show browser notification for new messages
                if (totalUnread > this.lastUnreadCount && this.lastUnreadCount !== undefined) {
                    this.showBrowserNotification('New message received!');
                }
                
                this.lastUnreadCount = totalUnread;
            });
            
        } catch (error) {
            console.error('Error setting up notifications:', error);
        }
    }
    
    // Show browser notification
    showBrowserNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Shift Chat', {
                body: message,
                icon: '/favicon.ico',
                badge: '/favicon.ico'
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Shift Chat', {
                        body: message,
                        icon: '/favicon.ico',
                        badge: '/favicon.ico'
                    });
                }
            });
        }
    }

    // Toggle widget open/close
    toggleWidget() {
        if (this.isOpen) {
            this.closeWidget();
        } else {
            this.openWidget();
        }
    }

    // Open widget
    openWidget() {
        this.isOpen = true;
        const button = this.widget.querySelector('#chatWidgetButton');
        const popup = this.widget.querySelector('#chatWidgetPopup');
        
        button.classList.add('open');
        popup.style.display = 'block';
        
        // Trigger animation
        setTimeout(() => {
            popup.classList.add('open');
        }, 10);
    }

    // Close widget
    closeWidget() {
        this.isOpen = false;
        const button = this.widget.querySelector('#chatWidgetButton');
        const popup = this.widget.querySelector('#chatWidgetPopup');
        
        button.classList.remove('open');
        popup.classList.remove('open');
        
        // Hide after animation
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300);
    }

    // Open full chat in new window/tab
    openFullChat() {
        window.open('chat.html', '_blank');
        this.closeWidget();
    }

    // Open specific conversation
    openConversation(conversationId) {
        window.open(`chat.html?conversation=${conversationId}`, '_blank');
        this.closeWidget();
    }

    // Update unread count
    updateUnreadCount(count) {
        this.unreadCount = count;
        const unreadElement = this.widget.querySelector('#chatWidgetUnread');
        
        if (count > 0) {
            unreadElement.textContent = count > 99 ? '99+' : count;
            unreadElement.style.display = 'flex';
        } else {
            unreadElement.style.display = 'none';
        }
    }

    // Update widget based on user state
    updateWidget() {
        if (this.currentUser) {
            this.loadConversations();
        }
    }

    // Destroy widget
    destroy() {
        if (this.widget && this.widget.parentNode) {
            this.widget.parentNode.removeChild(this.widget);
        }
        
        const styles = document.getElementById('chat-widget-styles');
        if (styles && styles.parentNode) {
            styles.parentNode.removeChild(styles);
        }
    }
}

// Auto-initialize if not in chat page
if (!window.location.pathname.includes('chat.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.chatWidget = new ChatWidget();
    });
}

// Export for manual initialization
window.ChatWidget = ChatWidget;
