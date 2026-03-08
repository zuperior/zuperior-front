import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { toast } from 'sonner';

// Socket.io functionality is disabled - using polling only
// Commented out to prevent build errors since socket.io-client import is not needed
/*
// Lazy import to avoid SSR issues and build-time errors
let ioClient: any;
let ioPromise: Promise<any> | null = null;

async function getSocket() {
  if (typeof window === 'undefined') return null;
  
  if (!ioClient && !ioPromise) {
    // Use dynamic import to avoid build-time errors
    ioPromise = import('socket.io-client')
      .then((module) => {
        ioClient = module.default || module;
        return ioClient;
      })
      .catch((e) => {
        console.warn('socket.io-client not available:', e);
        ioPromise = null;
        return null;
      });
  }
  
  if (ioPromise) {
    return await ioPromise;
  }
  
  return ioClient;
}
*/

export function useSessionCheck() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('userToken') || localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    if (!token) return; // Not logged in, skip

    // Get backend URL - remove /api suffix for socket connection, keep it for fetch
    const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';
    const serverBaseUrl = backendApiUrl.replace('/api', ''); // Remove /api for socket.io

    // Centralized logout helper
    const handleLogout = (reason: 'deleted' | 'expired' = 'expired') => {
      // Clear ALL localStorage items
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('Failed to clear localStorage:', e);
      }

      // Clear ALL sessionStorage items
      try {
        sessionStorage.clear();
      } catch (e) {
        console.warn('Failed to clear sessionStorage:', e);
      }

      // Clear ALL cookies by setting them to expire
      try {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          // Clear cookie by setting it to expire in the past
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        });
      } catch (e) {
        console.warn('Failed to clear cookies:', e);
      }

      // Dispatch logout action
      dispatch(logout());

      // Call server logout endpoint to clear server-side cookies
      try {
        const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';
        fetch(`${backendApiUrl}/logout`, {
          method: 'POST',
          credentials: 'include',
        }).catch(() => {
          // Ignore errors - client-side cleanup is done
        });
      } catch (e) {
        // Ignore errors - client-side cleanup is done
      }

      // Show toast
      const message = reason === 'deleted'
        ? 'Your account was deleted. For your security, you have been logged out.'
        : 'Your session has expired. Please log in again.';
      toast.error(message, { duration: 5001 });

      // Redirect to login
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    };

    // Setup websocket listener if available
    // Note: Socket.io is optional - polling will handle session checks if socket fails
    const socketRef = { current: null as any };

    // Skip socket connection entirely if socket.io might not be available
    // Socket is purely optional - polling provides the same functionality
    // Uncomment below if socket.io support is confirmed on backend
    /*
    const isProductionUrl = backendApiUrl && !backendApiUrl.includes('localhost') && !backendApiUrl.includes('127.0.0.1');
    
    if (isProductionUrl) {
      (async () => {
        try {
          const io = await getSocket();
          if (io && typeof io === 'function') {
            // Suppress all socket.io console errors
            const originalError = console.error;
            const originalWarn = console.warn;
            
            // Temporarily suppress console errors for socket.io
            console.error = (...args: any[]) => {
              if (args[0]?.toString().includes('socket.io') || args[0]?.toString().includes('WebSocket')) {
                return; // Suppress socket.io errors
              }
              originalError.apply(console, args);
            };
            console.warn = (...args: any[]) => {
              if (args[0]?.toString().includes('socket.io') || args[0]?.toString().includes('WebSocket')) {
                return; // Suppress socket.io warnings
              }
              originalWarn.apply(console, args);
            };
            
            socketRef.current = io(serverBaseUrl, {
              transports: ['websocket'],
              withCredentials: true,
              reconnection: false,
              timeout: 3000,
              autoConnect: false, // Manual connection
            });
            
            // Restore console after socket setup
            setTimeout(() => {
              console.error = originalError;
              console.warn = originalWarn;
            }, 100);
            
            // Set up all event handlers before connecting
            socketRef.current.on('connect', () => {
              socketRef.current.emit('auth', { token });
            });
            
            socketRef.current.on('auth:ok', () => {
              // Silent success
            });
            
            socketRef.current.on('account-deleted', () => {
              handleLogout('deleted');
            });
            
            // Suppress all error events
            socketRef.current.on('connect_error', () => {});
            socketRef.current.on('disconnect', () => {});
            socketRef.current.on('error', () => {});
            
            // Attempt connection silently
            socketRef.current.connect();
          }
        } catch (e) {
          // Silently ignore - polling is the primary method
        }
      })();
    }
    */

    // Fallback polling check
    let timer: any;
    const poll = async () => {
      try {
        // Check if this is a fresh registration (within last 10 seconds)
        // Skip session check for fresh registrations to avoid premature logout
        const freshRegistrationTime = localStorage.getItem('_freshRegistration');
        if (freshRegistrationTime) {
          const registrationTime = parseInt(freshRegistrationTime, 10);
          const timeSinceRegistration = Date.now() - registrationTime;
          if (timeSinceRegistration < 10000) { // 10 seconds grace period
            // Clear the flag after grace period
            if (timeSinceRegistration >= 5001) {
              localStorage.removeItem('_freshRegistration');
            }
            // Schedule next check after grace period
            timer = setTimeout(poll, 10000 - timeSinceRegistration);
            return;
          } else {
            // Grace period passed, clear flag
            localStorage.removeItem('_freshRegistration');
          }
        }

        const res = await fetch(`${backendApiUrl}/session/check-valid`, {
          credentials: 'include',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          // Handle network errors (server down) gracefully
          console.warn('[Session Check] Backend unreachable:', err.message);
          return null;
        });

        if (!res) {
          // Network error - retry later
          timer = setTimeout(poll, 30000);
          return;
        }

        if (res.status === 401 || res.status === 403) {
          handleLogout('expired');
          return;
        }

        timer = setTimeout(poll, 30000); // Poll every 30 seconds
      } catch (e) {
        // On other errors, retry after delay
        timer = setTimeout(poll, 30000);
      }
    };

    // Start polling after a short delay (longer for fresh registrations)
    const freshRegistrationTime = localStorage.getItem('_freshRegistration');
    const initialDelay = freshRegistrationTime ? 10000 : 5001; // 10s for fresh reg, 5s otherwise
    timer = setTimeout(poll, initialDelay);

    // Cleanup
    return () => {
      if (timer) clearTimeout(timer);
      // Cleanup socket if it was created
      if (socketRef.current) {
        try {
          socketRef.current.off('account-deleted');
          socketRef.current.disconnect();
          socketRef.current = null;
        } catch { }
      }
    };
  }, [dispatch]);
}
