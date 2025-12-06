// Firebase Cloud Messaging Service Worker
// This file must be in the public folder for Next.js

importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDUJYeVkHfxPyQDvQiebZESAF9anwE4ViQ',
  authDomain: 'zuperior007.firebaseapp.com',
  projectId: 'zuperior007',
  storageBucket: 'zuperior007.firebasestorage.app',
  messagingSenderId: '568936209830',
  appId: '1:568936209830:web:4c335af94db4499fa24367',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification',
    icon: '/logo.png', // Use your app's icon
    badge: '/logo.png',
    tag: payload.data?.notificationId || 'notification',
    data: payload.data || {},
    requireInteraction: false,
    silent: false,
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);

  event.notification.close();

  // Extract data from notification
  const data = event.notification.data || {};
  const notificationId = data.notificationId;
  const type = data.type;

  // Determine URL to open based on notification type
  let urlToOpen = '/';
  
  if (notificationId) {
    // Open notification details page if available
    urlToOpen = `/notifications/${notificationId}`;
  } else if (type) {
    // Route based on notification type
    switch (type) {
      case 'deposit':
        urlToOpen = '/deposits';
        break;
      case 'withdrawal':
        urlToOpen = '/withdrawals';
        break;
      case 'support_ticket_reply':
        urlToOpen = '/support';
        break;
      case 'kyc':
        urlToOpen = '/kyc';
        break;
      default:
        urlToOpen = '/notifications';
    }
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
});

