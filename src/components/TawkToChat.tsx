"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function TawkToChat() {
  const user = useSelector((state: RootState) => state.user.data);

  useEffect(() => {
    // Initialize Tawk.to only on client side
    if (typeof window !== "undefined") {
      // Check if script is already loaded
      const existingScript = document.querySelector(
        'script[src="https://embed.tawk.to/690bc64ce10d0719502af37f/1j9avt755"]'
      );

      if (!existingScript) {
        // Initialize Tawk_API
        window.Tawk_API = window.Tawk_API || {} as any;
        window.Tawk_LoadStart = new Date();

        // Minimization handler
        if ((window as any).Tawk_API) {
          (window as any).Tawk_API.onLoad = function () {
            if (window.Tawk_API && typeof window.Tawk_API.minimize === "function") {
              window.Tawk_API.minimize();
            }
          };
        }

        // Create and append the script
        const script = document.createElement("script");
        script.src = "https://embed.tawk.to/690bc64ce10d0719502af37f/1j9avt755";
        script.async = true;
        script.charset = "UTF-8";
        script.setAttribute("crossorigin", "*");

        // Suppress CORS errors in console
        script.onerror = (error) => {
          console.warn('Tawk.to script load error (this is normal in development):', error);
        };

        // Find the first script tag and insert before it
        const firstScript = document.getElementsByTagName("script")[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        }
      }

      // Function to classify Tawk iframes
      const classifyTawkIframes = () => {
        const iframes = document.querySelectorAll('iframe[title*="chat"]');
        iframes.forEach((iframe: any) => {
          // Check if it's the small icon widget (usually ~60x60)
          // Check both offset dimensions and inline style
          const width = iframe.offsetWidth || parseInt(iframe.style.width) || 0;
          const height = iframe.offsetHeight || parseInt(iframe.style.height) || 0;

          if (width > 0 && width < 100 && height < 100) {
            iframe.classList.add('tawk-widget-icon');
          } else {
            iframe.classList.remove('tawk-widget-icon');
          }
        });
      };

      // Function to make Tawk widget draggable
      let dragCleanup: (() => void) | null = null;
      const makeWidgetDraggable = () => {
        // Find the Tawk.to widget container - look for the actual Tawk container div
        const tawkContainer = document.querySelector('#tawkchat-container, [id*="tawkchat"], div[id*="tawk"]') as HTMLElement;

        if (!tawkContainer) return;

        // Check if already initialized
        if (tawkContainer.hasAttribute('data-draggable-initialized')) return;

        // Find the parent container that holds the widget
        let widgetContainer = tawkContainer.parentElement;
        while (widgetContainer && !widgetContainer.id?.includes('tawk') && widgetContainer !== document.body) {
          widgetContainer = widgetContainer.parentElement;
        }

        // Use the Tawk container itself if it's already positioned fixed
        if (tawkContainer && window.getComputedStyle(tawkContainer).position === 'fixed') {
          widgetContainer = tawkContainer;
        } else if (!widgetContainer || widgetContainer === document.body) {
          // If no parent found, wrap the widget
          const wrapper = document.createElement('div');
          wrapper.id = 'tawk-draggable-wrapper';
          wrapper.style.cssText = 'position: fixed !important; z-index: 999999 !important; cursor: move !important; pointer-events: none !important;';
          tawkContainer.parentNode?.insertBefore(wrapper, tawkContainer);
          wrapper.appendChild(tawkContainer);
          wrapper.style.pointerEvents = 'auto';
          widgetContainer = wrapper;
        }

        // Mark as initialized
        tawkContainer.setAttribute('data-draggable-initialized', 'true');

        // Load saved position from localStorage
        const savedPosition = localStorage.getItem('tawk-widget-position');
        if (savedPosition) {
          try {
            const { top, left, right, bottom } = JSON.parse(savedPosition);
            if (top !== undefined) widgetContainer.style.top = top;
            if (left !== undefined) widgetContainer.style.left = left;
            if (right !== undefined) widgetContainer.style.right = right;
            if (bottom !== undefined) widgetContainer.style.bottom = bottom;
          } catch (e) {
            // Invalid saved position, use default
            widgetContainer.style.bottom = '20px';
            widgetContainer.style.right = '20px';
          }
        } else {
          // Default position: bottom right
          widgetContainer.style.bottom = '20px';
          widgetContainer.style.right = '20px';
        }

        // Make sure it's positioned fixed
        widgetContainer.style.position = 'fixed';
        widgetContainer.style.zIndex = '999999';
        widgetContainer.style.cursor = 'move';
        widgetContainer.style.userSelect = 'none';

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialTop = 0;
        let initialLeft = 0;

        const handleMouseDown = (e: MouseEvent) => {
          // Only allow dragging from the widget icon, not the chat window
          const target = e.target as HTMLElement;
          const iframe = target.closest('iframe');
          if (iframe && iframe.offsetWidth > 100) return; // Don't drag if chat is open

          // Don't drag if clicking on interactive elements inside the chat
          if (target.closest('input, textarea, button, a, select')) return;

          isDragging = true;
          const rect = widgetContainer.getBoundingClientRect();

          initialTop = rect.top;
          initialLeft = rect.left;

          startX = e.clientX;
          startY = e.clientY;

          // Remove all position styles to start fresh
          widgetContainer.style.top = '';
          widgetContainer.style.left = '';
          widgetContainer.style.right = '';
          widgetContainer.style.bottom = '';

          // Set initial position based on current position
          widgetContainer.style.top = `${initialTop}px`;
          widgetContainer.style.left = `${initialLeft}px`;

          e.preventDefault();
          e.stopPropagation();
        };

        const handleMouseMove = (e: MouseEvent) => {
          if (!isDragging) return;

          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          const newLeft = initialLeft + deltaX;
          const newTop = initialTop + deltaY;

          widgetContainer.style.left = `${newLeft}px`;
          widgetContainer.style.top = `${newTop}px`;
        };

        const handleMouseUp = () => {
          if (!isDragging) return;
          isDragging = false;

          // Snap to nearest edge
          const rect = widgetContainer.getBoundingClientRect();
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const widgetWidth = rect.width;
          const widgetHeight = rect.height;

          const centerX = rect.left + widgetWidth / 2;
          const centerY = rect.top + widgetHeight / 2;

          // Determine which edge is closest
          const distToLeft = centerX;
          const distToRight = windowWidth - centerX;
          const distToTop = centerY;
          const distToBottom = windowHeight - centerY;

          const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

          // Clear all positions
          widgetContainer.style.top = '';
          widgetContainer.style.left = '';
          widgetContainer.style.right = '';
          widgetContainer.style.bottom = '';

          let position: { top?: string; left?: string; right?: string; bottom?: string } = {};

          if (minDist === distToLeft) {
            // Snap to left
            widgetContainer.style.left = '20px';
            widgetContainer.style.top = `${Math.max(20, Math.min(centerY - widgetHeight / 2, windowHeight - widgetHeight - 20))}px`;
            position = { left: '20px', top: widgetContainer.style.top };
          } else if (minDist === distToRight) {
            // Snap to right
            widgetContainer.style.right = '20px';
            widgetContainer.style.top = `${Math.max(20, Math.min(centerY - widgetHeight / 2, windowHeight - widgetHeight - 20))}px`;
            position = { right: '20px', top: widgetContainer.style.top };
          } else if (minDist === distToTop) {
            // Snap to top
            widgetContainer.style.top = '20px';
            widgetContainer.style.left = `${Math.max(20, Math.min(centerX - widgetWidth / 2, windowWidth - widgetWidth - 20))}px`;
            position = { top: '20px', left: widgetContainer.style.left };
          } else {
            // Snap to bottom
            widgetContainer.style.bottom = '20px';
            widgetContainer.style.left = `${Math.max(20, Math.min(centerX - widgetWidth / 2, windowWidth - widgetWidth - 20))}px`;
            position = { bottom: '20px', left: widgetContainer.style.left };
          }

          // Save position to localStorage
          localStorage.setItem('tawk-widget-position', JSON.stringify(position));
        };

        widgetContainer.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Store cleanup function
        dragCleanup = () => {
          widgetContainer.removeEventListener('mousedown', handleMouseDown);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      };

      // Observer to watch for Tawk iframe injection
      const observer = new MutationObserver(() => {
        classifyTawkIframes();
        makeWidgetDraggable();
      });

      observer.observe(document.body, { childList: true, subtree: true });
      // Also run periodically to catch updates
      const interval = setInterval(() => {
        classifyTawkIframes();
        makeWidgetDraggable();
      }, 1000);

      // Wait for Tawk.to API to be ready
      const checkTawkAPI = setInterval(() => {
        if (window.Tawk_API && typeof window.Tawk_API.hideWidget === "function") {
          clearInterval(checkTawkAPI);

          // Show the widget initially
          window.Tawk_API.showWidget();

          // Prevent auto-opening by ensuring chat starts minimized
          if (window.Tawk_API && typeof window.Tawk_API.minimize === "function") {
            window.Tawk_API.minimize();
          }

          // Set user information if available
          if (user) {
            const setUserData = () => {
              if (window.Tawk_API && typeof window.Tawk_API.setAttributes === "function") {
                // Set user name and email (check both name and accountname fields)
                const userName = (user as any)?.name || user.accountname;
                const userEmail = (user as any)?.email || user.email1 || "";
                if (userName) {
                  window.Tawk_API.setAttributes(
                    {
                      name: userName,
                      email: userEmail,
                      hash: "", // Add hash if you're using secure mode
                    },
                    function (error: any) {
                      if (error) {
                        console.error("Error setting Tawk.to attributes:", error);
                      }
                    }
                  );
                }

                // Add custom attributes
                if (typeof window.Tawk_API.addTags === "function") {
                  window.Tawk_API.addTags(
                    [user.verification_status || "unverified"],
                    function (error: any) {
                      if (error) {
                        console.error("Error adding Tawk.to tags:", error);
                      }
                    }
                  );
                }

                // Add additional user data
                window.Tawk_API.setAttributes({
                  "CRM Account ID": user.crm_account_id?.toString() || (user as any)?.clientId || "N/A",
                  "Account Name": userName || "N/A",
                  "Phone": user.phone || "N/A",
                  "Verification Status": user.verification_status || "N/A",
                });
              }
            };

            // Set user data after a short delay to ensure API is fully ready
            setTimeout(setUserData, 500);
          }
        }
      }, 100);

      // Clear interval after 10 seconds to prevent infinite checking
      const timeout = setTimeout(() => {
        clearInterval(checkTawkAPI);
      }, 10000);

      // Cleanup function
      return () => {
        clearInterval(checkTawkAPI);
        clearTimeout(timeout);
        observer.disconnect();
        clearInterval(interval);
        if (dragCleanup) {
          dragCleanup();
        }
      };
    }
  }, [user]);

  return null; // This component doesn't render anything
}
