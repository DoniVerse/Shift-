# Google OAuth Setup Guide

This guide will help you set up real Google OAuth authentication for your employer signup/signin pages.

## 🚀 Quick Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Give your project a name (e.g., "Shift Employer Auth")

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity" if available

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set up the following:

   **Name:** Shift Employer Auth
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://127.0.0.1:3000
   https://yourdomain.com
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:3000/google-callback.html
   http://127.0.0.1:3000/google-callback.html
   https://yourdomain.com/google-callback.html
   ```

5. Click "Create"
6. **Copy your Client ID** - you'll need this!

### 4. Update Your Code

Replace `YOUR_GOOGLE_CLIENT_ID` in both files with your actual Client ID:

**In `employer-signup.html`:**
```javascript
const clientId = 'YOUR_ACTUAL_GOOGLE_CLIENT_ID_HERE';
```

**In `employer-signin.html`:**
```javascript
const clientId = 'YOUR_ACTUAL_GOOGLE_CLIENT_ID_HERE';
```

### 5. Test the Integration

1. Open your signup or signin page
2. Click "Sign up/in with Google"
3. You should see the real Google account chooser with your actual Google accounts!

## 🔧 How It Works

### The OAuth Flow:

1. **User clicks Google button** → Redirects to Google's real OAuth page
2. **Google shows account chooser** → User sees their actual Google accounts
3. **User selects account** → Google redirects back with authorization code
4. **Callback page processes** → Exchanges code for user information
5. **User is authenticated** → Redirected to appropriate page

### Key Features:

- ✅ **Real Google accounts** - Shows user's actual signed-in accounts
- ✅ **Account chooser** - `prompt=select_account` forces account selection
- ✅ **Secure flow** - Uses proper OAuth 2.0 authorization code flow
- ✅ **Error handling** - Handles cancellation and errors gracefully
- ✅ **Source tracking** - Knows if user came from signup or signin

## 🛠️ For Production Use

### Backend Integration Required

For a production application, you'll need to:

1. **Create a backend API endpoint** to handle the OAuth callback
2. **Exchange authorization code** for access token server-side
3. **Get user profile information** from Google's API
4. **Create/authenticate user** in your database
5. **Return session token** to frontend

### Example Backend Endpoint (Node.js/Express):

```javascript
app.post('/api/auth/google/callback', async (req, res) => {
  try {
    const { code, source } = req.body;
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI
      })
    });
    
    const tokens = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    const userInfo = await userResponse.json();
    
    // Create or authenticate user in your database
    const user = await createOrAuthenticateUser(userInfo, source);
    
    // Return success response
    res.json({
      success: true,
      user: user,
      token: generateJWT(user)
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});
```

## 🔒 Security Notes

- **Never expose Client Secret** in frontend code
- **Always validate tokens** on the server side
- **Use HTTPS** in production
- **Implement proper session management**
- **Add CSRF protection**

## 📱 Testing

To test locally:
1. Serve your files from a local server (not file://)
2. Use `http://localhost:3000` or similar
3. Make sure your redirect URI matches exactly

## 🎯 Current Status

- ✅ Frontend OAuth flow implemented
- ✅ Real Google account chooser integration
- ✅ Error handling and user feedback
- ⚠️ Backend integration needed for production
- ⚠️ Replace placeholder Client ID

Once you add your real Google Client ID, users will see their actual Google accounts when they click the Google sign-in buttons!
