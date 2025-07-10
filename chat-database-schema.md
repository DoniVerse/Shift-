# Chat Database Schema Design

This document outlines the Firestore database structure for the Telegram-like chat feature.

## 📊 Collections Overview

```
📁 users/
📁 conversations/
📁 notifications/
📁 chat_settings/
```

## 👤 Users Collection

**Path:** `users/{userId}`

```javascript
{
  // Core user data
  uid: "user123",                    // Firebase Auth UID
  email: "john@example.com",         // User email
  name: "John Doe",                  // Display name
  userType: "student",               // "student" | "employer"
  
  // Profile information
  profilePicture: "https://...",     // Profile image URL
  university: "Harvard Law",         // For students
  yearOfStudy: 3,                    // For students
  department: "Law",                 // For students
  companyName: "Smith & Associates", // For employers
  companyType: "Law Firm",           // For employers
  
  // Chat-specific data
  isOnline: true,                    // Current online status
  lastSeen: Timestamp,               // Last activity timestamp
  typingIn: "conv123",               // Currently typing in conversation
  
  // Settings
  chatSettings: {
    notifications: true,
    soundEnabled: true,
    readReceipts: true,
    onlineStatus: true
  },
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 💬 Conversations Collection

**Path:** `conversations/{conversationId}`

```javascript
{
  // Conversation metadata
  id: "user1_user2",                 // Sorted participant IDs joined with _
  type: "direct",                    // "direct" | "group" (future)
  participants: ["user1", "user2"],  // Array of participant UIDs
  
  // Last message info
  lastMessage: {
    text: "Hello there!",
    senderId: "user1",
    timestamp: Timestamp,
    type: "text"                     // "text" | "image" | "file"
  },
  
  // Unread counts per user
  unreadCount: {
    "user1": 0,
    "user2": 3
  },
  
  // Conversation settings
  settings: {
    archived: {
      "user1": false,
      "user2": false
    },
    muted: {
      "user1": false,
      "user2": false
    },
    pinned: {
      "user1": false,
      "user2": false
    }
  },
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 📨 Messages Subcollection

**Path:** `conversations/{conversationId}/messages/{messageId}`

```javascript
{
  // Message content
  text: "Hello! How are you?",       // Message text
  type: "text",                      // "text" | "image" | "file" | "system"
  
  // Sender information
  senderId: "user123",               // Sender's UID
  senderName: "John Doe",            // Sender's name (cached)
  senderAvatar: "https://...",       // Sender's avatar (cached)
  
  // Message metadata
  timestamp: Timestamp,              // When message was sent
  editedAt: Timestamp,               // When message was edited (if applicable)
  
  // Message status
  status: "delivered",               // "sending" | "sent" | "delivered" | "read"
  readBy: {                          // Read receipts
    "user1": Timestamp,
    "user2": Timestamp
  },
  
  // File/media data (for non-text messages)
  fileData: {
    url: "https://...",              // File download URL
    name: "document.pdf",            // Original filename
    size: 1024000,                   // File size in bytes
    mimeType: "application/pdf",     // File MIME type
    thumbnailUrl: "https://..."      // Thumbnail for images/videos
  },
  
  // Reply/thread data
  replyTo: {
    messageId: "msg456",             // ID of message being replied to
    text: "Original message...",     // Preview of original message
    senderId: "user2"                // Original sender
  },
  
  // Reactions (future feature)
  reactions: {
    "👍": ["user1", "user2"],
    "❤️": ["user1"]
  },
  
  // System message data (for join/leave notifications)
  systemData: {
    action: "user_joined",           // "user_joined" | "user_left" | "conversation_created"
    userId: "user3",                 // User who performed action
    metadata: {}                     // Additional action data
  }
}
```

## 🔔 Notifications Collection

**Path:** `notifications/{notificationId}`

```javascript
{
  // Notification target
  userId: "user123",                 // Who should receive this notification
  
  // Notification content
  type: "new_message",               // "new_message" | "mention" | "conversation_invite"
  title: "New message from John",
  body: "Hello! How are you?",
  
  // Related data
  conversationId: "user1_user2",
  messageId: "msg123",
  senderId: "user1",
  
  // Notification state
  read: false,
  delivered: false,
  
  // Metadata
  createdAt: Timestamp,
  expiresAt: Timestamp               // Auto-delete old notifications
}
```

## ⚙️ Chat Settings Collection

**Path:** `chat_settings/{userId}`

```javascript
{
  // Global chat preferences
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
    showPreviews: true
  },
  
  // Privacy settings
  privacy: {
    readReceipts: true,
    onlineStatus: true,
    lastSeen: true,
    profilePhoto: "everyone"         // "everyone" | "contacts" | "nobody"
  },
  
  // Appearance settings
  appearance: {
    theme: "light",                  // "light" | "dark" | "auto"
    fontSize: "medium",              // "small" | "medium" | "large"
    chatWallpaper: "default"
  },
  
  // Blocked users
  blockedUsers: ["user456"],
  
  // Metadata
  updatedAt: Timestamp
}
```

## 🔍 Database Indexes

For optimal performance, create these composite indexes:

### Conversations
```javascript
// For user's conversation list
conversations: [
  { fields: ["participants", "updatedAt"], order: "desc" }
]
```

### Messages
```javascript
// For conversation messages
messages: [
  { fields: ["conversationId", "timestamp"], order: "asc" }
]
```

### Notifications
```javascript
// For user notifications
notifications: [
  { fields: ["userId", "read", "createdAt"], order: "desc" }
]
```

## 🔒 Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Others can read basic profile info
    }
    
    // Conversation access
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      // Messages within conversations
      match /messages/{messageId} {
        allow read, write: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
      }
    }
    
    // Notifications - users can only access their own
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Chat settings - users can only access their own
    match /chat_settings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📱 Real-time Listeners

### Key listeners to implement:

1. **User's conversations**: Listen to conversations where user is a participant
2. **Conversation messages**: Listen to messages in active conversation
3. **User online status**: Listen to other participants' online status
4. **Typing indicators**: Listen to typing status in active conversation
5. **Notifications**: Listen to user's unread notifications

## 🚀 Performance Considerations

1. **Pagination**: Implement pagination for message history
2. **Caching**: Cache user profiles and conversation metadata
3. **Offline support**: Use Firestore offline persistence
4. **Image optimization**: Compress images before upload
5. **Message limits**: Limit message length and file sizes

## 📊 Data Flow Examples

### Sending a Message
1. Add message to `conversations/{id}/messages`
2. Update `conversations/{id}` with lastMessage
3. Increment unread count for recipients
4. Create notification for offline users
5. Update sender's typing status

### Reading Messages
1. Query messages with real-time listener
2. Mark messages as read
3. Reset unread count to 0
4. Update read receipts

This schema provides a solid foundation for a scalable, real-time chat system similar to Telegram!
