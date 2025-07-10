// Chat Application JavaScript
// Telegram-like chat interface with Firebase integration

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    addDoc,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Import Firebase services directly
import {
    getAuth,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2Is7jXaYL4k04tSaI-CRzmtisQ5VSmz4",
    authDomain: "shift-3140e.firebaseapp.com",
    databaseURL: "https://shift-3140e-default-rtdb.firebaseio.com",
    projectId: "shift-3140e",
    storageBucket: "shift-3140e.firebasestorage.app",
    messagingSenderId: "716245939154",
    appId: "1:716245939154:web:64d567a1ded3fa98b34e0b",
    measurementId: "G-F6WJ0T3E71"
};

// Initialize Firebase
console.log('Initializing Firebase with config:', firebaseConfig);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
console.log('Firebase initialized - App:', app.name, 'DB:', !!db, 'Auth:', !!auth);

// Chat Application Class
class ChatApp {
    constructor() {
        this.currentUser = null;
        this.currentConversation = null;
        this.conversations = new Map();
        this.users = new Map();
        this.unsubscribers = [];
        this.typingTimeout = null;
        this.isTyping = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAuth();
    }

    // Initialize DOM elements
    initializeElements() {
        // Sidebar elements
        this.chatSidebar = document.getElementById('chatSidebar');
        this.currentUserName = document.getElementById('currentUserName');
        this.currentUserType = document.getElementById('currentUserType');
        this.currentUserAvatar = document.getElementById('currentUserAvatar');
        this.conversationsList = document.getElementById('conversationsList');
        this.searchInput = document.getElementById('searchInput');
        
        // Main chat elements
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.chatArea = document.getElementById('chatArea');
        this.chatUserName = document.getElementById('chatUserName');
        this.chatUserStatus = document.getElementById('chatUserStatus');
        this.chatUserAvatar = document.getElementById('chatUserAvatar');
        this.chatUserOnline = document.getElementById('chatUserOnline');
        this.messagesList = document.getElementById('messagesList');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        // Modal elements
        this.newChatModal = document.getElementById('newChatModal');
        this.usersList = document.getElementById('usersList');
        this.userSearchInput = document.getElementById('userSearchInput');
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    // Setup event listeners
    setupEventListeners() {
        // New chat button
        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.openNewChatModal();
        });

        // Start chat button (welcome screen)
        document.getElementById('startChatBtn').addEventListener('click', () => {
            this.openNewChatModal();
        });

        // Close modals
        document.getElementById('closeNewChatModal').addEventListener('click', () => {
            this.closeModal('newChatModal');
        });

        // Send message
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // Message input events
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.messageInput.addEventListener('input', () => {
            this.handleTyping();
            this.adjustTextareaHeight();
        });

        // Search conversations
        this.searchInput.addEventListener('input', (e) => {
            this.searchConversations(e.target.value);
        });

        // Search users in modal
        this.userSearchInput.addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });

        // Refresh users button
        document.getElementById('refreshUsersBtn').addEventListener('click', () => {
            console.log('Manual refresh users clicked');
            this.loadUsers();
        });

        // Back button (mobile)
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showWelcomeScreen();
        });

        // Close modals when clicking overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target.id);
            }
        });
    }

    // Initialize authentication
    async initializeAuth() {
        this.showLoading(true);

        // Listen for Firebase auth state changes
        onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user ? user.email : 'No user');

            if (user) {
                await this.handleUserSignedIn(user);
            } else {
                console.log('No user authenticated - redirecting to login');
                this.showLoading(false);
                // Optionally redirect to login page
                // window.location.href = 'studentlogin.html';
            }
        });
    }

    // Handle user signed in
    async handleUserSignedIn(user) {
        this.currentUser = user;
        console.log('Handling user sign in for:', user.email);

        try {
            // Get user profile from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (userDoc.exists()) {
                const userProfile = { id: userDoc.id, ...userDoc.data() };
                console.log('User profile loaded:', userProfile);

                this.updateUserInterface(userProfile);

                // Load conversations and users
                await this.loadConversations();
                await this.loadUsers();

                this.showLoading(false);
            } else {
                console.error('No user profile found in Firestore for:', user.uid);
                this.showLoading(false);
                alert('User profile not found. Please sign up first.');
            }

        } catch (error) {
            console.error('Error handling user sign in:', error);
            this.showLoading(false);
            alert('Error loading user profile: ' + error.message);
        }
    }

    // Update user interface with user data
    updateUserInterface(userData) {
        this.currentUserName.textContent = userData.name || 'User';
        this.currentUserType.textContent = userData.userType || 'Student';
        
        if (userData.profilePicture) {
            this.currentUserAvatar.src = userData.profilePicture;
        }
    }

    // Load user's conversations
    async loadConversations() {
        if (!this.currentUser) {
            console.log('No current user, cannot load conversations');
            return;
        }

        console.log('Loading conversations for user:', this.currentUser.uid);

        try {
            const conversationsRef = collection(db, 'conversations');
            const q = query(
                conversationsRef,
                where('participants', 'array-contains', this.currentUser.uid)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                console.log('Conversations snapshot received, size:', snapshot.size);
                this.conversations.clear();
                this.conversationsList.innerHTML = '';

                if (snapshot.empty) {
                    console.log('No conversations found');
                    this.showEmptyConversations();
                    return;
                }

                const conversationsArray = [];
                snapshot.forEach((doc) => {
                    const conversation = { id: doc.id, ...doc.data() };
                    console.log('Found conversation:', conversation.id, conversation);
                    conversationsArray.push(conversation);
                    this.conversations.set(doc.id, conversation);
                });

                // Sort by updatedAt if available, otherwise by createdAt
                conversationsArray.sort((a, b) => {
                    const aTime = a.updatedAt?.toDate() || a.createdAt?.toDate() || new Date(0);
                    const bTime = b.updatedAt?.toDate() || b.createdAt?.toDate() || new Date(0);
                    return bTime - aTime;
                });

                // Render sorted conversations
                conversationsArray.forEach(conversation => {
                    this.renderConversationItem(conversation);
                });

                console.log(`✅ Loaded ${conversationsArray.length} conversations`);
            }, (error) => {
                console.error('Error loading conversations:', error);
                this.showEmptyConversations();
            });

            this.unsubscribers.push(unsubscribe);
        } catch (error) {
            console.error('Error setting up conversations listener:', error);
            this.showEmptyConversations();
        }
    }

    // Load available users
    async loadUsers() {
        if (!this.currentUser) {
            console.log('No current user, cannot load users');
            return;
        }

        console.log('Loading users from Firestore...');
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, limit(50));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                console.log('Users snapshot received, size:', snapshot.size);
                this.users.clear();

                snapshot.forEach((doc) => {
                    const user = { id: doc.id, ...doc.data() };
                    console.log('Processing user:', user.name, user.email);
                    if (user.id !== this.currentUser.uid) {
                        this.users.set(doc.id, user);
                    }
                });

                console.log(`Loaded ${this.users.size} users for chat (excluding current user)`);

                // If modal is open, refresh the users list
                if (this.newChatModal.style.display === 'flex') {
                    this.renderUsersList();
                }
            }, (error) => {
                console.error('Error loading users:', error);
            });

            this.unsubscribers.push(unsubscribe);
        } catch (error) {
            console.error('Error setting up users listener:', error);
        }
    }

    // Render conversation item in sidebar
    renderConversationItem(conversation) {
        console.log('Rendering conversation item:', conversation.id);

        const otherParticipantId = conversation.participants.find(id => id !== this.currentUser.uid);
        const otherUser = this.users.get(otherParticipantId);

        console.log('Other participant:', otherParticipantId, otherUser);

        const conversationElement = document.createElement('div');
        conversationElement.className = 'conversation-item';
        conversationElement.dataset.conversationId = conversation.id;

        const unreadCount = conversation.unreadCount?.[this.currentUser.uid] || 0;
        const lastMessageTime = conversation.lastMessageTime ?
            this.formatTime(conversation.lastMessageTime.toDate()) :
            (conversation.createdAt ? this.formatTime(conversation.createdAt.toDate()) : 'Recently');

        // Use fallback data if user not found
        const userName = otherUser?.name || 'Unknown User';
        const userAvatar = otherUser?.profilePicture ||
            `https://via.placeholder.com/50x50/5a3e5d/ffffff?text=${userName.charAt(0)}`;
        const isOnline = otherUser?.isOnline || false;

        conversationElement.innerHTML = `
            <div class="conversation-avatar">
                <img src="${userAvatar}" alt="User">
                ${isOnline ? '<div class="online-indicator"></div>' : ''}
            </div>
            <div class="conversation-info">
                <div class="conversation-name">${userName}</div>
                <div class="conversation-preview">${conversation.lastMessage || 'Start a conversation'}</div>
            </div>
            <div class="conversation-meta">
                <div class="conversation-time">${lastMessageTime}</div>
                ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
            </div>
        `;

        conversationElement.addEventListener('click', () => {
            console.log('Conversation clicked:', conversation.id);
            this.openConversation(conversation.id);
        });

        this.conversationsList.appendChild(conversationElement);
        console.log('✅ Conversation item rendered');
    }

    // Show empty conversations state
    showEmptyConversations() {
        this.conversationsList.innerHTML = `
            <div class="loading-conversations">
                <i class="fas fa-comments" style="font-size: 48px; margin-bottom: 15px; color: var(--color-text-muted);"></i>
                <span>No conversations yet</span>
                <p style="font-size: 12px; margin-top: 5px; color: var(--color-text-muted);">Start a new conversation to begin chatting</p>
            </div>
        `;
    }

    // Open conversation
    async openConversation(conversationId) {
        console.log('=== Opening conversation ===');
        console.log('Conversation ID:', conversationId);

        this.currentConversation = conversationId;
        const conversation = this.conversations.get(conversationId);

        console.log('Conversation from cache:', conversation);
        console.log('Available conversations:', Array.from(this.conversations.keys()));

        if (!conversation) {
            console.log('⚠️ Conversation not found in cache, creating temporary conversation data');
            // If conversation not in cache, create temporary data
            const otherParticipantId = conversationId.split('_').find(id => id !== this.currentUser.uid);
            const otherUser = this.users.get(otherParticipantId);

            console.log('Other participant ID:', otherParticipantId);
            console.log('Other user data:', otherUser);

            if (otherUser) {
                // Create temporary conversation data
                const tempConversation = {
                    id: conversationId,
                    participants: [this.currentUser.uid, otherParticipantId],
                    lastMessage: null,
                    lastMessageTime: null
                };

                // Update UI with user info directly
                this.showChatArea();
                this.updateActiveConversation(conversationId);

                this.chatUserName.textContent = otherUser.name;
                this.chatUserAvatar.src = otherUser.profilePicture ||
                    `https://via.placeholder.com/40x40/5a3e5d/ffffff?text=${otherUser.name.charAt(0)}`;

                if (otherUser.isOnline) {
                    this.chatUserStatus.textContent = 'Online';
                    this.chatUserStatus.className = 'user-status online';
                    this.chatUserOnline.style.display = 'block';
                } else {
                    this.chatUserStatus.textContent = `Last seen ${this.formatTime(otherUser.lastSeen?.toDate())}`;
                    this.chatUserStatus.className = 'user-status';
                    this.chatUserOnline.style.display = 'none';
                }

                console.log('✅ Chat area opened with temporary data');
            } else {
                console.error('❌ Other user not found');
                return;
            }
        } else {
            console.log('✅ Using cached conversation data');
            // Update UI
            this.showChatArea();
            this.updateActiveConversation(conversationId);

            // Get other participant info
            const otherParticipantId = conversation.participants.find(id => id !== this.currentUser.uid);
            const otherUser = this.users.get(otherParticipantId);

            if (otherUser) {
                this.chatUserName.textContent = otherUser.name;
                this.chatUserAvatar.src = otherUser.profilePicture ||
                    `https://via.placeholder.com/40x40/5a3e5d/ffffff?text=${otherUser.name.charAt(0)}`;

                if (otherUser.isOnline) {
                    this.chatUserStatus.textContent = 'Online';
                    this.chatUserStatus.className = 'user-status online';
                    this.chatUserOnline.style.display = 'block';
                } else {
                    this.chatUserStatus.textContent = `Last seen ${this.formatTime(otherUser.lastSeen?.toDate())}`;
                    this.chatUserStatus.className = 'user-status';
                    this.chatUserOnline.style.display = 'none';
                }
            }
        }

        // Load messages
        console.log('Loading messages for conversation:', conversationId);
        await this.loadMessages(conversationId);

        // Mark messages as read
        await this.markMessagesAsRead(conversationId);

        console.log('✅ Conversation opened successfully');
    }

    // Load messages for conversation
    async loadMessages(conversationId) {
        // Clear existing messages
        this.messagesList.innerHTML = '';

        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Clear messages list
            this.messagesList.innerHTML = '';
            
            snapshot.forEach((doc) => {
                const message = { id: doc.id, ...doc.data() };
                this.renderMessage(message);
            });

            // Scroll to bottom
            this.scrollToBottom();
        });

        this.unsubscribers.push(unsubscribe);
    }

    // Render message in chat
    renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.senderId === this.currentUser.uid ? 'sent' : 'received'}`;
        
        const messageTime = message.timestamp ? 
            this.formatTime(message.timestamp.toDate()) : 'Sending...';

        messageElement.innerHTML = `
            <div class="message-bubble">
                <div class="message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-time">${messageTime}</div>
            </div>
        `;

        this.messagesList.appendChild(messageElement);
    }

    // Send message
    async sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text || !this.currentConversation) return;

        try {
            // Clear input
            this.messageInput.value = '';
            this.adjustTextareaHeight();

            // Add message to Firestore
            const messagesRef = collection(db, 'conversations', this.currentConversation, 'messages');
            await addDoc(messagesRef, {
                senderId: this.currentUser.uid,
                text: text,
                type: 'text',
                timestamp: serverTimestamp(),
                status: 'sent'
            });

            // Update conversation
            const conversationRef = doc(db, 'conversations', this.currentConversation);
            await updateDoc(conversationRef, {
                lastMessage: text,
                lastMessageTime: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    // Utility functions
    formatTime(date) {
        if (!date) return '';
        
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    showWelcomeScreen() {
        this.welcomeScreen.style.display = 'flex';
        this.chatArea.style.display = 'none';
        this.currentConversation = null;
    }

    showChatArea() {
        console.log('Showing chat area...');
        console.log('Welcome screen element:', this.welcomeScreen);
        console.log('Chat area element:', this.chatArea);

        this.welcomeScreen.style.display = 'none';
        this.chatArea.style.display = 'flex';

        console.log('✅ Chat area should now be visible');
    }

    updateActiveConversation(conversationId) {
        // Remove active class from all conversations
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current conversation
        const activeItem = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    async markMessagesAsRead(conversationId) {
        try {
            const conversationRef = doc(db, 'conversations', conversationId);
            await updateDoc(conversationRef, {
                [`unreadCount.${this.currentUser.uid}`]: 0
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    // Modal functions
    openNewChatModal() {
        console.log('Opening new chat modal...');
        this.newChatModal.style.display = 'flex';
        this.renderUsersList();

        // If no users loaded yet, try to load them
        if (this.users.size === 0) {
            console.log('No users found, attempting to load users...');
            this.loadUsers();
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    renderUsersList() {
        console.log('Rendering users list. Users count:', this.users.size);
        this.usersList.innerHTML = '';

        if (this.users.size === 0) {
            console.log('No users to display');
            this.usersList.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 15px;">👥</div>
                    <div style="font-size: 16px; margin-bottom: 10px;">No users found</div>
                    <div style="font-size: 14px; color: #999;">
                        Users will appear here after they sign up.<br>
                        Try creating some test accounts first.<br><br>
                        <button onclick="window.open('auth-demo.html', '_blank')" style="background: #d17e7e; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            Create Test Users
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        this.users.forEach((user) => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.style.cursor = 'pointer';
            userElement.dataset.userId = user.id;

            userElement.innerHTML = `
                <div class="user-item-avatar">
                    <img src="${user.profilePicture || 'https://via.placeholder.com/40x40/5a3e5d/ffffff?text=' + (user.name ? user.name.charAt(0) : 'U')}" alt="User">
                </div>
                <div class="user-item-info">
                    <div class="user-item-name">${user.name || 'Unknown User'}</div>
                    <div class="user-item-email">${user.email || 'No email'}</div>
                </div>
                <div class="user-item-type">${user.userType || 'user'}</div>
            `;

            // Add click event listener
            userElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('User clicked:', user.name, user.id);
                this.startConversationWithUser(user.id);
            });

            // Add hover effect
            userElement.addEventListener('mouseenter', () => {
                userElement.style.backgroundColor = '#f8f9fa';
            });

            userElement.addEventListener('mouseleave', () => {
                userElement.style.backgroundColor = '';
            });

            this.usersList.appendChild(userElement);
        });
    }

    async startConversationWithUser(userId) {
        console.log('=== Starting conversation ===');
        console.log('Target user ID:', userId);
        console.log('Current user:', this.currentUser?.uid);
        console.log('Current user email:', this.currentUser?.email);

        if (!this.currentUser) {
            console.error('No current user - cannot start conversation');
            alert('Please sign in first to start a conversation');
            return;
        }

        if (!userId) {
            console.error('No user ID provided');
            return;
        }

        try {
            const participants = [this.currentUser.uid, userId].sort();
            const conversationId = participants.join('_');
            console.log('Participants:', participants);
            console.log('Conversation ID:', conversationId);

            // Create conversation (we'll use merge: true to avoid conflicts)
            const conversationRef = doc(db, 'conversations', conversationId);
            console.log('Conversation reference created');

            console.log('Creating/updating conversation...');

            const conversationData = {
                id: conversationId,
                participants: participants,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastMessage: null,
                lastMessageTime: null,
                unreadCount: {}
            };

            console.log('Conversation data:', conversationData);
            console.log('About to call setDoc with merge...');

            // Use merge: true to create if doesn't exist, or update if exists
            await setDoc(conversationRef, conversationData, { merge: true });
            console.log('✅ Conversation created/updated successfully');

            // Close modal and open conversation
            console.log('Closing modal and opening conversation');
            this.closeModal('newChatModal');
            this.openConversation(conversationId);

        } catch (error) {
            console.error('=== Error Details ===');
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Full error:', error);
            console.error('Current user auth state:', this.currentUser);

            alert('Failed to start conversation: ' + error.message + '\nCheck console for details.');
        }
    }

    // Search functions
    searchConversations(query) {
        const items = document.querySelectorAll('.conversation-item');
        items.forEach(item => {
            const name = item.querySelector('.conversation-name').textContent.toLowerCase();
            const preview = item.querySelector('.conversation-preview').textContent.toLowerCase();
            const matches = name.includes(query.toLowerCase()) || preview.includes(query.toLowerCase());
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    searchUsers(query) {
        const items = document.querySelectorAll('.user-item');
        items.forEach(item => {
            const name = item.querySelector('.user-item-name').textContent.toLowerCase();
            const email = item.querySelector('.user-item-email').textContent.toLowerCase();
            const matches = name.includes(query.toLowerCase()) || email.includes(query.toLowerCase());
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    // Typing indicator functions
    handleTyping() {
        if (!this.currentConversation) return;

        // Clear existing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Set typing status
        if (!this.isTyping) {
            this.isTyping = true;
            // In a real app, you'd update the user's typing status in Firestore
        }

        // Clear typing status after 3 seconds
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            // Clear typing status in Firestore
        }, 3000);
    }

    // Cleanup function
    destroy() {
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
    }
}

// Initialize chat app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.chatApp) {
        window.chatApp.destroy();
    }
});
