// FCM Service for Frontend Push Notifications

import { messaging } from '@/lib/firebase.config';
import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { fcmService as apiFcmService } from './api.service';

// VAPID key for web push (should be obtained from Firebase Console)
// This is a placeholder - you need to get the actual VAPID key from Firebase Console
// Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined') {
    return 'denied';
  }

  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission was previously denied');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Get FCM token for current device
 */
export const getFCMToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined' || !messaging) {
    console.warn('Firebase Messaging not available (server-side or not initialized)');
    return null;
  }

  try {
    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Get FCM token
    // Note: VAPID key is required for web push. Get it from Firebase Console > Project Settings > Cloud Messaging
    const token = VAPID_KEY 
      ? await getToken(messaging, {
          vapidKey: VAPID_KEY,
        })
      : await getToken(messaging);

    if (token) {
      console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('No FCM token available');
      return null;
    }
  } catch (error: any) {
    console.error('Error getting FCM token:', error);
    
    // Handle specific errors
    if (error.code === 'messaging/permission-blocked') {
      console.warn('Notification permission is blocked');
    } else if (error.code === 'messaging/permission-default') {
      console.warn('Notification permission is default (not granted)');
    }
    
    return null;
  }
};

/**
 * Register FCM token with backend
 */
export const registerFCMToken = async (token: string, deviceInfo?: any, platform?: string): Promise<boolean> => {
  try {
    const response = await apiFcmService.registerToken(token, deviceInfo, platform);
    if (response.success) {
      console.log('✅ FCM token registered with backend');
      return true;
    } else {
      console.error('Failed to register FCM token:', response.message);
      return false;
    }
  } catch (error: any) {
    console.error('Error registering FCM token:', error);
    return false;
  }
};

/**
 * Unregister FCM token from backend
 */
export const unregisterFCMToken = async (token: string): Promise<boolean> => {
  try {
    const response = await apiFcmService.unregisterToken(token);
    if (response.success) {
      console.log('✅ FCM token unregistered from backend');
      return true;
    } else {
      console.error('Failed to unregister FCM token:', response.message);
      return false;
    }
  } catch (error: any) {
    console.error('Error unregistering FCM token:', error);
    return false;
  }
};

/**
 * Initialize FCM and register token
 * Call this when user logs in
 */
export const initializeFCM = async (): Promise<string | null> => {
  try {
    const token = await getFCMToken();
    if (token) {
      // Get device info
      const deviceInfo = {
        browser: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      };

      // Register with backend
      await registerFCMToken(token, deviceInfo, 'web');
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error initializing FCM:', error);
    return null;
  }
};

/**
 * Listen for foreground push notifications
 * Call this to handle notifications when app is in foreground
 */
export const onForegroundMessage = (
  callback: (payload: any) => void
): (() => void) | null => {
  if (typeof window === 'undefined' || !messaging) {
    return null;
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📬 Foreground message received:', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return null;
  }
};

/**
 * Cleanup FCM (unregister token)
 * Call this when user logs out
 */
export const cleanupFCM = async (token: string | null): Promise<void> => {
  if (token) {
    await unregisterFCMToken(token);
  }
};

export default {
  requestNotificationPermission,
  getFCMToken,
  registerFCMToken,
  unregisterFCMToken,
  initializeFCM,
  onForegroundMessage,
  cleanupFCM,
};

