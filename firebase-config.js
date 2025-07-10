// Firebase Configuration and Initialization
// Replace these values with your actual Firebase project configuration

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
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// For development - connect to emulators if running locally
if (location.hostname === 'localhost') {
    // Uncomment these lines if you want to use Firebase emulators for development
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectStorageEmulator(storage, 'localhost', 9199);
}

// Export the app instance
export default app;

// Chat Service Class
export class ChatService {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.currentUser = null;
        
        // Listen for auth state changes
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                this.updateUserOnlineStatus(true);
            }
        });
    }

    // Initialize user in Firestore
    async initializeUser(userData) {
        try {
            const userRef = doc(this.db, 'users', userData.uid);
            await setDoc(userRef, {
                uid: userData.uid,
                email: userData.email,
                name: userData.name || userData.displayName,
                userType: userData.userType, // 'student' or 'employer'
                profilePicture: userData.profilePicture || userData.photoURL,
                isOnline: true,
                lastSeen: new Date(),
                createdAt: new Date(),
                ...userData
            }, { merge: true });
            
            return true;
        } catch (error) {
            console.error('Error initializing user:', error);
            return false;
        }
    }

    // Update user online status
    async updateUserOnlineStatus(isOnline) {
        if (!this.currentUser) return;
        
        try {
            const userRef = doc(this.db, 'users', this.currentUser.uid);
            await updateDoc(userRef, {
                isOnline: isOnline,
                lastSeen: new Date()
            });
        } catch (error) {
            console.error('Error updating online status:', error);
        }
    }

    // Create or get conversation between two users
    async getOrCreateConversation(participantIds) {
        try {
            // Sort participant IDs to ensure consistent conversation ID
            const sortedIds = participantIds.sort();
            const conversationId = sortedIds.join('_');
            
            const conversationRef = doc(this.db, 'conversations', conversationId);
            const conversationSnap = await getDoc(conversationRef);
            
            if (!conversationSnap.exists()) {
                // Create new conversation
                await setDoc(conversationRef, {
                    id: conversationId,
                    participants: participantIds,
                    createdAt: new Date(),
                    lastMessage: null,
                    lastMessageTime: null,
                    unreadCount: {}
                });
            }
            
            return conversationId;
        } catch (error) {
            console.error('Error creating conversation:', error);
            return null;
        }
    }

    // Send a message
    async sendMessage(conversationId, messageData) {
        try {
            const messagesRef = collection(this.db, 'conversations', conversationId, 'messages');
            const messageRef = await addDoc(messagesRef, {
                senderId: this.currentUser.uid,
                text: messageData.text,
                type: messageData.type || 'text', // 'text', 'image', 'file'
                timestamp: new Date(),
                status: 'sent',
                ...messageData
            });

            // Update conversation with last message
            const conversationRef = doc(this.db, 'conversations', conversationId);
            await updateDoc(conversationRef, {
                lastMessage: messageData.text,
                lastMessageTime: new Date(),
                [`unreadCount.${this.currentUser.uid}`]: 0
            });

            return messageRef.id;
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    }

    // Listen to messages in a conversation
    listenToMessages(conversationId, callback) {
        const messagesRef = collection(this.db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        return onSnapshot(q, (snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(messages);
        });
    }

    // Listen to user's conversations
    listenToConversations(userId, callback) {
        const conversationsRef = collection(this.db, 'conversations');
        const q = query(
            conversationsRef, 
            where('participants', 'array-contains', userId),
            orderBy('lastMessageTime', 'desc')
        );
        
        return onSnapshot(q, (snapshot) => {
            const conversations = [];
            snapshot.forEach((doc) => {
                conversations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(conversations);
        });
    }

    // Mark messages as read
    async markMessagesAsRead(conversationId) {
        if (!this.currentUser) return;
        
        try {
            const conversationRef = doc(this.db, 'conversations', conversationId);
            await updateDoc(conversationRef, {
                [`unreadCount.${this.currentUser.uid}`]: 0
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    // Get user data
    async getUserData(userId) {
        try {
            const userRef = doc(this.db, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                return { id: userSnap.id, ...userSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }
}

// Import required Firestore functions
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    addDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot 
} from 'firebase/firestore';

// Create and export chat service instance
export const chatService = new ChatService();
