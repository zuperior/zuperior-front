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

      // Observer to watch for Tawk iframe injection
      const observer = new MutationObserver(() => {
        classifyTawkIframes();
      });

      observer.observe(document.body, { childList: true, subtree: true });
      // Also run periodically to catch updates
      const interval = setInterval(classifyTawkIframes, 1000);

      // Wait for Tawk.to API to be ready
      const checkTawkAPI = setInterval(() => {
        if (window.Tawk_API && typeof window.Tawk_API.hideWidget === "function") {
          clearInterval(checkTawkAPI);

          // Show the widget initially
          window.Tawk_API.showWidget();

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

            // Set user data immediately if API is ready, or wait for onLoad
            if (window.Tawk_API.onLoad) {
              window.Tawk_API.onLoad = setUserData;
            } else {
              setUserData();
            }
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
      };
    }
  }, [user]);

  return null; // This component doesn't render anything
}
