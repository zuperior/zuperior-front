// Firebase Configuration for Web Push Notifications

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging } from 'firebase/messaging';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase configuration
// You can override these with environment variables if needed
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDUJYeVkHfxPyQDvQiebZESAF9anwE4ViQ',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'zuperior007.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'zuperior007',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'zuperior007.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '568936209830',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:568936209830:web:4c335af94db4499fa24367',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-VB8WVJH19C',
};

// Initialize Firebase app (singleton pattern)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Get messaging instance (only in browser)
let messaging: Messaging | null = null;
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Failed to initialize Firebase Messaging:', error);
    // Messaging might not be available (e.g., in development without HTTPS)
  }

  // Initialize Analytics (only in browser)
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Failed to initialize Firebase Analytics:', error);
    // Analytics might fail in some environments
  }
}

export { app, messaging, analytics };

