# Firebase Configuration Usage Guide

## Where Firebase is Used

### 1. Main Firebase Configuration
**File**: `zuperior-front/src/lib/firebase.config.ts`

This is the main Firebase initialization file that:
- Initializes the Firebase app
- Sets up Firebase Messaging for push notifications
- Sets up Firebase Analytics
- Exports the app, messaging, and analytics instances

**Usage**: This file is imported by:
- `zuperior-front/src/services/fcm.service.ts` - For FCM token management
- `zuperior-front/src/hooks/useNotifications.ts` - For push notification handling

### 2. Service Worker (Background Notifications)
**File**: `zuperior-front/public/firebase-messaging-sw.js`

This service worker handles push notifications when the app is in the background or closed.

**Location**: Must be in the `public` folder for Next.js to serve it at `/firebase-messaging-sw.js`

### 3. FCM Service
**File**: `zuperior-front/src/services/fcm.service.ts`

Uses Firebase Messaging to:
- Request notification permission
- Get FCM tokens
- Register tokens with backend
- Listen for foreground messages

**Imports from**: `@/lib/firebase.config`

### 4. Notification Hook
**File**: `zuperior-front/src/hooks/useNotifications.ts`

Uses FCM service to:
- Initialize FCM on component mount
- Register FCM token after login
- Listen for push notifications
- Update notification state when push is received

**Imports from**: `@/services/fcm.service`

### 5. Authentication Flow
**File**: `zuperior-front/src/app/login/_components/auth-form.tsx`

Automatically initializes FCM after:
- User registration
- User login
- 2FA verification

**Imports from**: `@/services/fcm.service` → `initializeFCM()`

## Configuration Values

The Firebase configuration is now set with your actual values:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDUJYeVkHfxPyQDvQiebZESAF9anwE4ViQ",
  authDomain: "zuperior007.firebaseapp.com",
  projectId: "zuperior007",
  storageBucket: "zuperior007.firebasestorage.app",
  messagingSenderId: "568936209830",
  appId: "1:568936209830:web:4c335af94db4499fa24367",
  measurementId: "G-VB8WVJH19C"
};
```

## Environment Variables (Optional)

You can override these values with environment variables in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDUJYeVkHfxPyQDvQiebZESAF9anwE4ViQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=zuperior007.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=zuperior007
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=zuperior007.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=568936209830
NEXT_PUBLIC_FIREBASE_APP_ID=1:568936209830:web:4c335af94db4499fa24367
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-VB8WVJH19C
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
```

**Note**: The `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is required for web push notifications. Get it from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates.

## How It Works

1. **App Initialization**: When the app loads, `firebase.config.ts` initializes Firebase
2. **User Authentication**: After login/registration, `auth-form.tsx` calls `initializeFCM()`
3. **Token Registration**: FCM service gets token and registers it with backend
4. **Push Notifications**: When notifications are created, backend sends FCM push
5. **Notification Display**: Service worker shows notification (background) or hook updates state (foreground)

## Testing

1. **Check Console**: After login, you should see:
   - `✅ Firebase Messaging initialized`
   - `✅ Firebase Analytics initialized`
   - `✅ FCM token obtained: ...`
   - `✅ FCM token registered with backend`

2. **Check Database**: Verify token is stored:
   ```sql
   SELECT * FROM "FCMToken" WHERE "userId" = 'your-user-id';
   ```

3. **Test Push**: Create a notification (e.g., approve deposit) and verify push is received

## Important Notes

- **HTTPS Required**: Web push requires HTTPS (except localhost)
- **Service Worker**: Must be accessible at `/firebase-messaging-sw.js`
- **Browser Support**: Chrome, Firefox, Edge support web push; Safari has limited support
- **Permission**: Users must grant notification permission

