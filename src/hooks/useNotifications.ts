import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '@/services/api.service';
import { initializeFCM, onForegroundMessage, cleanupFCM } from '@/services/fcm.service';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
  readAt?: string | null;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fcmTokenRef = useRef<string | null>(null);
  const fcmUnsubscribeRef = useRef<(() => void) | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getNotifications({ limit: 50 });
      if (response.success) {
        setNotifications(response.data || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (err: any) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, [notifications]);

  // Initialize FCM and listen for push notifications
  useEffect(() => {
    let mounted = true;

    const setupFCM = async () => {
      try {
        // Initialize FCM and register token
        const token = await initializeFCM();
        if (token && mounted) {
          fcmTokenRef.current = token;
        }

        // Listen for foreground push notifications
        const unsubscribe = onForegroundMessage((payload) => {
          if (mounted) {
            // Refresh notifications when push is received
            fetchNotifications();
            fetchUnreadCount();

            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
              const notificationBody = payload.notification?.body || payload.data?.body || 'You have a new notification';
              
              new Notification(notificationTitle, {
                body: notificationBody,
                icon: '/logo.png',
                tag: payload.data?.notificationId || 'notification',
              });
            }
          }
        });

        if (unsubscribe && mounted) {
          fcmUnsubscribeRef.current = unsubscribe;
        }
      } catch (error) {
        console.error('Error setting up FCM:', error);
      }
    };

    setupFCM();

    return () => {
      mounted = false;
      // Cleanup FCM on unmount
      if (fcmTokenRef.current) {
        cleanupFCM(fcmTokenRef.current);
      }
      if (fcmUnsubscribeRef.current) {
        fcmUnsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
