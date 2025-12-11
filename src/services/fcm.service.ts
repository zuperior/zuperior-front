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
  console.log('🔵 [FCM] getFCMToken called');

  if (typeof window === 'undefined') {
    console.warn('⚠️ [FCM] Running on server-side, skipping FCM');
    return null;
  }

  if (!messaging) {
    console.warn('⚠️ [FCM] Firebase Messaging not initialized');
    return null;
  }

  try {
    console.log('🔵 [FCM] Requesting notification permission...');
    // Request permission first
    const permission = await requestNotificationPermission();
    console.log('🔵 [FCM] Permission status:', permission);

    if (permission !== 'granted') {
      console.warn('⚠️ [FCM] Notification permission not granted:', permission);
      return null;
    }

    console.log('🔵 [FCM] Getting FCM token from Firebase...');
    console.log('🔵 [FCM] VAPID key present:', !!VAPID_KEY);

    // Get FCM token
    // Note: VAPID key is required for web push. Get it from Firebase Console > Project Settings > Cloud Messaging
    const token = VAPID_KEY
      ? await getToken(messaging, {
        vapidKey: VAPID_KEY,
      })
      : await getToken(messaging);

    if (token) {
      console.log('✅ [FCM] Token obtained from Firebase:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('⚠️ [FCM] No FCM token available from Firebase');
      return null;
    }
  } catch (error: any) {
    console.error('❌ [FCM] Error getting FCM token:', error);
    console.error('❌ [FCM] Error code:', error.code);
    console.error('❌ [FCM] Error message:', error.message);

    // Handle specific errors
    if (error.code === 'messaging/permission-blocked') {
      console.warn('⚠️ [FCM] Notification permission is blocked');
    } else if (error.code === 'messaging/permission-default') {
      console.warn('⚠️ [FCM] Notification permission is default (not granted)');
    }

    return null;
  }
};

/**
 * Register FCM token with backend
 */
export const registerFCMToken = async (token: string, deviceInfo?: any, platform?: string): Promise<boolean> => {
  console.log('🔵 [FCM] registerFCMToken called with token:', token.substring(0, 20) + '...');
  try {
    console.log('🔵 [FCM] Calling API service to register token...');
    const response = await apiFcmService.registerToken(token, deviceInfo, platform);
    console.log('🔵 [FCM] API response:', response);

    if (response.success) {
      console.log('✅ [FCM] Token registered with backend successfully');
      return true;
    } else {
      console.error('❌ [FCM] Failed to register FCM token:', response.message);
      return false;
    }
  } catch (error: any) {
    console.error('❌ [FCM] Error registering FCM token:', error);
    console.error('❌ [FCM] Error response:', error.response?.data);
    console.error('❌ [FCM] Error status:', error.response?.status);
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
  console.log('🔵 [FCM] Starting FCM initialization...');
  try {
    console.log('🔵 [FCM] Attempting to get FCM token...');
    const token = await getFCMToken();

    if (token) {
      console.log('✅ [FCM] Token obtained successfully:', token.substring(0, 30) + '...');

      // Get device info
      const deviceInfo = {
        browser: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      };
      console.log('🔵 [FCM] Device info:', deviceInfo);

      // Register with backend
      console.log('🔵 [FCM] Registering token with backend...');
      const result = await registerFCMToken(token, deviceInfo, 'web');
      console.log('✅ [FCM] Token registered with backend:', result);
      return token;
    } else {
      console.warn('⚠️ [FCM] No token obtained from Firebase');
    }
    return null;
  } catch (error) {
    console.error('❌ [FCM] Error initializing FCM:', error);
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

