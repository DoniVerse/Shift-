// Chat Application JavaScript
// Telegram-like chat interface with Firebase integration

// Import Firebase modules
import { initializeApp, getApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
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

// Initialize Firebase (with duplicate check)
let app, db, auth;

try {
    // Try to get existing app first
    app = getApp();
    console.log('Using existing Firebase app');
} catch (error) {
    // If no app exists, create new one
    console.log('Initializing new Firebase app with config:', firebaseConfig);
    app = initializeApp(firebaseConfig);
}

db = getFirestore(app);
auth = getAuth(app);
console.log('Firebase ready - App:', app.name, 'DB:', !!db, 'Auth:', !!auth);

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
        this.initializeFileHandling();
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
            const messageText = this.messageInput.value.trim();
            if (this.selectedFiles && this.selectedFiles.length > 0) {
                this.sendMessageWithFiles(messageText);
            } else {
                this.sendMessage();
            }
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

        // Set a timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            console.log('⚠️ Loading timeout - hiding loading state');
            this.showLoading(false);
            this.showError('Loading took too long. Please refresh the page.');
        }, 15000); // 15 second timeout

        // Listen for Firebase auth state changes
        onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user ? user.email : 'No user');

            clearTimeout(loadingTimeout); // Clear timeout since auth state changed

            if (user) {
                await this.handleUserSignedIn(user);
            } else {
                console.log('No user authenticated - checking localStorage');
                this.showLoading(false);

                // Check if user data exists in localStorage (fallback)
                const localUser = localStorage.getItem('currentUser');
                if (localUser) {
                    console.log('Found user in localStorage, but not authenticated with Firebase');
                    this.showError('Session expired. Please sign in again.');
                    setTimeout(() => {
                        window.location.href = 'studentlogin.html';
                    }, 2000);
                } else {
                    console.log('No user data found, redirecting to login');
                    window.location.href = 'studentlogin.html';
                }
            }
        });
    }

    // Handle user signed in
    async handleUserSignedIn(user) {
        this.currentUser = user;
        console.log('🔄 Handling user sign in for:', user.email);

        try {
            console.log('📄 Loading user profile from Firestore...');

            // Add timeout for Firestore operations
            const userDocPromise = getDoc(doc(db, 'users', user.uid));
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Firestore timeout')), 10000)
            );

            const userDoc = await Promise.race([userDocPromise, timeoutPromise]);

            if (userDoc.exists()) {
                const userProfile = { id: userDoc.id, ...userDoc.data() };
                console.log('✅ User profile loaded:', userProfile);

                this.updateUserInterface(userProfile);

                console.log('🔄 Loading conversations and users...');

                // Load data with timeout protection
                try {
                    // Load users first, then conversations (so user data is available)
                    await Promise.race([
                        this.loadUsers(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Users timeout')), 8000))
                    ]);
                    console.log('✅ Users loaded');
                } catch (error) {
                    console.warn('⚠️ Users loading failed:', error.message);
                    // Continue without users list
                }

                try {
                    await Promise.race([
                        this.loadConversations(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Conversations timeout')), 8000))
                    ]);
                    console.log('✅ Conversations loaded');
                } catch (error) {
                    console.warn('⚠️ Conversations loading failed:', error.message);
                    this.showEmptyConversations();
                }

                this.showLoading(false);
                console.log('✅ Chat initialization complete');

            } else {
                console.error('❌ No user profile found in Firestore for:', user.uid);
                this.showLoading(false);
                this.showError('User profile not found. Please sign up first.');
            }

        } catch (error) {
            console.error('❌ Error handling user sign in:', error);
            this.showLoading(false);

            if (error.message.includes('timeout')) {
                this.showError('Connection timeout. Please check your internet and refresh.');
            } else {
                this.showError('Error loading user profile: ' + error.message);
            }
        }
    }

    // Generate local avatar
    generateAvatar(name, size = 40) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        // Background color based on name
        const colors = ['#d17e7e', '#5a3e5d', '#7e9dd1', '#7ed17e', '#d1d17e', '#d17ed1'];
        const colorIndex = (name || 'U').charCodeAt(0) % colors.length;

        // Draw background
        ctx.fillStyle = colors[colorIndex];
        ctx.fillRect(0, 0, size, size);

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${size * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((name || 'U').charAt(0).toUpperCase(), size / 2, size / 2);

        return canvas.toDataURL();
    }

    // Update user interface with user data
    updateUserInterface(userData) {
        this.currentUserName.textContent = userData.name || 'User';
        this.currentUserType.textContent = userData.userType || 'Student';

        if (userData.profilePicture) {
            this.currentUserAvatar.src = userData.profilePicture;
        } else {
            this.currentUserAvatar.src = this.generateAvatar(userData.name || 'User');
        }
    }

    // Load user's conversations
    async loadConversations() {
        if (!this.currentUser) {
            console.log('❌ No current user, cannot load conversations');
            return;
        }

        console.log('🔄 Loading conversations for user:', this.currentUser.uid);

        try {
            const conversationsRef = collection(db, 'conversations');
            const q = query(
                conversationsRef,
                where('participants', 'array-contains', this.currentUser.uid)
            );

            // Set up snapshot listener with timeout protection
            let snapshotReceived = false;

            const unsubscribe = onSnapshot(q, (snapshot) => {
                snapshotReceived = true;
                console.log('📨 Conversations snapshot received, size:', snapshot.size);

                this.conversations.clear();
                this.conversationsList.innerHTML = '';

                if (snapshot.empty) {
                    console.log('📭 No conversations found');
                    this.showEmptyConversations();
                    return;
                }

                const conversationsArray = [];
                snapshot.forEach((doc) => {
                    const conversation = { id: doc.id, ...doc.data() };
                    console.log('💬 Found conversation:', conversation.id);
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

                console.log(`✅ Loaded ${conversationsArray.length} conversations successfully`);
            }, (error) => {
                console.error('❌ Error in conversations listener:', error);
                this.showEmptyConversations();
                throw error; // Re-throw to be caught by outer try-catch
            });

            // Timeout check for initial snapshot
            setTimeout(() => {
                if (!snapshotReceived) {
                    console.warn('⚠️ Conversations snapshot timeout - showing empty state');
                    this.showEmptyConversations();
                }
            }, 8000);

            this.unsubscribers.push(unsubscribe);

        } catch (error) {
            console.error('❌ Error setting up conversations listener:', error);
            this.showEmptyConversations();
            throw error; // Re-throw for parent error handling
        }
    }

    // Load available users
    async loadUsers() {
        if (!this.currentUser) {
            console.log('❌ No current user, cannot load users');
            return;
        }

        console.log('🔄 Loading users from Firestore...');
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, limit(50));

            let snapshotReceived = false;

            const unsubscribe = onSnapshot(q, (snapshot) => {
                snapshotReceived = true;
                console.log('👥 Users snapshot received, size:', snapshot.size);
                this.users.clear();

                snapshot.forEach((doc) => {
                    const user = { id: doc.id, ...doc.data() };
                    console.log('👤 Processing user:', user.name || 'Unknown', user.email);
                    if (user.id !== this.currentUser.uid) {
                        this.users.set(doc.id, user);
                    }
                });

                console.log(`✅ Loaded ${this.users.size} users for chat (excluding current user)`);

                // Refresh conversations display now that we have user data
                this.refreshConversationsDisplay();

                // If modal is open, refresh the users list
                if (this.newChatModal && this.newChatModal.style.display === 'flex') {
                    this.renderUsersList();
                }
            }, (error) => {
                console.error('❌ Error in users listener:', error);
                // Don't throw error, just log it
            });

            // Timeout check for initial snapshot
            setTimeout(() => {
                if (!snapshotReceived) {
                    console.warn('⚠️ Users snapshot timeout - continuing without users');
                }
            }, 8000);

            this.unsubscribers.push(unsubscribe);

        } catch (error) {
            console.error('❌ Error setting up users listener:', error);
            // Don't throw error, just log it
        }
    }

    // Refresh conversations display with updated user data
    refreshConversationsDisplay() {
        console.log('🔄 Refreshing conversations display with user data');

        // Clear and re-render all conversations
        this.conversationsList.innerHTML = '';

        // Convert conversations map to array and sort
        const conversationsArray = Array.from(this.conversations.values());
        conversationsArray.sort((a, b) => {
            const aTime = a.updatedAt?.toDate() || a.createdAt?.toDate() || new Date(0);
            const bTime = b.updatedAt?.toDate() || b.createdAt?.toDate() || new Date(0);
            return bTime - aTime;
        });

        // Re-render each conversation with updated user data
        conversationsArray.forEach(conversation => {
            this.renderConversationItem(conversation);
        });

        console.log(`✅ Refreshed ${conversationsArray.length} conversations with user data`);
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
        const userAvatar = otherUser?.profilePicture || this.generateAvatar(userName, 50);
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
                this.chatUserAvatar.src = otherUser.profilePicture || this.generateAvatar(otherUser.name);

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
                this.chatUserAvatar.src = otherUser.profilePicture || this.generateAvatar(otherUser.name);

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

        let messageContent = '';

        // Add text content if present
        if (message.text && message.text.trim()) {
            messageContent += `<div class="message-text">${this.escapeHtml(message.text)}</div>`;
        }

        // Add files if present
        if (message.files && message.files.length > 0) {
            messageContent += '<div class="message-files">';
            message.files.forEach(file => {
                const fileIcon = this.getFileIcon(file.type);
                const fileSize = this.formatFileSize(file.size);
                messageContent += `
                    <div class="message-file-item">
                        <span class="file-icon">${fileIcon}</span>
                        <div class="file-info">
                            <div class="file-name">${this.escapeHtml(file.name)}</div>
                            <div class="file-size">${fileSize}</div>
                        </div>
                        <button class="file-download-btn" onclick="alert('File download would be implemented here')" title="Download file">
                            📥
                        </button>
                    </div>
                `;
            });
            messageContent += '</div>';
        }

        messageElement.innerHTML = `
            <div class="message-bubble">
                ${messageContent}
                <div class="message-time">${messageTime}</div>
            </div>
        `;

        this.messagesList.appendChild(messageElement);
    }

    // Send message
    async sendMessage(messageData = null) {
        // If messageData is provided, use it; otherwise create from input
        let messageToSend;

        if (messageData) {
            messageToSend = messageData;
        } else {
            const text = this.messageInput.value.trim();
            if (!text || !this.currentConversation) return;

            messageToSend = {
                senderId: this.currentUser.uid,
                text: text,
                type: 'text',
                timestamp: serverTimestamp(),
                status: 'sent'
            };
        }

        if (!this.currentConversation) {
            alert('Please select a conversation first');
            return;
        }

        try {
            console.log('📤 Sending message:', messageToSend);

            // Clear input only if not sending files
            if (!messageData) {
                this.messageInput.value = '';
                this.adjustTextareaHeight();
            }

            // Add message to Firestore
            const messagesRef = collection(db, 'conversations', this.currentConversation, 'messages');
            await addDoc(messagesRef, messageToSend);

            console.log('✅ Message sent successfully');

            // Update conversation with last message
            const conversationRef = doc(db, 'conversations', this.currentConversation);
            const lastMessageText = messageToSend.text ||
                (messageToSend.files && messageToSend.files.length > 0 ?
                    `📎 ${messageToSend.files.length} file(s)` : 'Message');

            await updateDoc(conversationRef, {
                lastMessage: lastMessageText,
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

    // Show error message
    showError(message) {
        console.error('💥 Error:', message);

        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
        `;
        errorDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">×</button>
            </div>
        `;

        document.body.appendChild(errorDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
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
                    <img src="${user.profilePicture || this.generateAvatar(user.name || 'User')}" alt="User">
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

    // Initialize file handling
    initializeFileHandling() {
        this.selectedFiles = [];
        this.fileInput = document.getElementById('fileInput');
        this.attachmentBtn = document.getElementById('attachmentBtn');
        this.filePreviewContainer = document.getElementById('filePreviewContainer');
        this.filePreviewList = document.getElementById('filePreviewList');
        this.clearFilesBtn = document.getElementById('clearFilesBtn');

        // Attachment button click
        this.attachmentBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Clear files button
        this.clearFilesBtn.addEventListener('click', () => {
            this.clearSelectedFiles();
        });
    }

    // Handle file selection
    handleFileSelection(files) {
        console.log('Files selected:', files.length);

        Array.from(files).forEach(file => {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
                return;
            }

            // Check if file already selected
            if (this.selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
                alert(`File "${file.name}" is already selected.`);
                return;
            }

            this.selectedFiles.push(file);
        });

        this.updateFilePreview();
        this.fileInput.value = ''; // Clear input
    }

    // Update file preview
    updateFilePreview() {
        if (this.selectedFiles.length === 0) {
            this.filePreviewContainer.style.display = 'none';
            return;
        }

        this.filePreviewContainer.style.display = 'block';
        this.filePreviewList.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-preview-item';

            const fileIcon = this.getFileIcon(file.type);
            const fileSize = this.formatFileSize(file.size);

            fileItem.innerHTML = `
                <span class="file-preview-icon">${fileIcon}</span>
                <span class="file-preview-name" title="${file.name}">${file.name}</span>
                <span class="file-preview-size">${fileSize}</span>
                <button class="file-remove-btn" data-index="${index}">✕</button>
            `;

            // Remove file button
            fileItem.querySelector('.file-remove-btn').addEventListener('click', () => {
                this.removeFile(index);
            });

            this.filePreviewList.appendChild(fileItem);
        });
    }

    // Get file icon based on type
    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return '🖼️';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('text')) return '📃';
        if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
        return '📎';
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Remove file from selection
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFilePreview();
    }

    // Clear all selected files
    clearSelectedFiles() {
        this.selectedFiles = [];
        this.updateFilePreview();
    }

    // Send message with files (enhanced version)
    async sendMessageWithFiles(messageText) {
        if (!this.currentConversation) {
            alert('Please select a conversation first');
            return;
        }

        if (!messageText.trim() && this.selectedFiles.length === 0) {
            alert('Please enter a message or select files to send');
            return;
        }

        try {
            console.log('📎 Sending message with files:', this.selectedFiles.length);

            const messageData = {
                text: messageText.trim(),
                senderId: this.currentUser.uid,
                timestamp: serverTimestamp(),
                type: this.selectedFiles.length > 0 ? 'file' : 'text',
                status: 'sent',
                files: []
            };

            // Store file info (in production, upload to Firebase Storage)
            if (this.selectedFiles.length > 0) {
                messageData.files = this.selectedFiles.map(file => ({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    // In production: url: uploadedFileUrl
                    url: `#file-${Date.now()}-${file.name}` // Placeholder
                }));
                console.log('📁 Files to send:', messageData.files);
            }

            // Send message
            await this.sendMessage(messageData);

            // Clear input and files after sending
            this.messageInput.value = '';
            this.adjustTextareaHeight();
            this.clearSelectedFiles();

            console.log('✅ Message with files sent successfully');

        } catch (error) {
            console.error('❌ Error sending message with files:', error);
            alert('Failed to send message: ' + error.message);
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
