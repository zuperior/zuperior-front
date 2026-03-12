"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import { useTheme } from "next-themes";
import { CardLoader } from "../ui/loading";

function TechnicalAnalysis(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const currentTheme = resolvedTheme || theme || 'light';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    // Clear container
    container.innerHTML = "";

    // Create wrapper with theme background
    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.position = "relative";
    wrapper.style.backgroundColor = currentTheme === 'dark' ? '#1D222D' : '#FFFFFF';
    wrapper.style.borderRadius = "inherit";
    wrapper.style.overflow = "hidden";

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    // Fetch the URL
    fetch('/api/token', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme: currentTheme,
        type: 'technical',
        _t: Date.now() // Prevent caching
      })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;

        // Create iframe but keep it hidden
        const iframe = document.createElement("iframe");

        // Add theme parameters to URL
        const urlObj = new URL(data.url);
        urlObj.searchParams.set('theme', currentTheme);
        if (currentTheme === 'dark') {
          urlObj.searchParams.set('style', 'ds');
        }
        urlObj.searchParams.set('_t', Date.now().toString());

        iframe.src = urlObj.toString();
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "0";
        iframe.style.position = "relative";
        iframe.style.zIndex = "10";
        iframe.style.opacity = "0"; // Start hidden
        iframe.style.transition = "opacity 0.3s ease";
        iframe.style.backgroundColor = currentTheme === 'dark' ? '#1D222D' : '#FFFFFF';
        iframe.title = "Autochartist Technical Analysis";
        iframe.sandbox.add("allow-scripts", "allow-same-origin", "allow-popups", "allow-forms");

        // Add a unique ID to check iframe content later
        const iframeId = `iframe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        iframe.id = iframeId;

        // Try to detect when iframe content is fully loaded with dark theme
        let checkCount = 0;
        const maxChecks = 50; // Check for up to 5 seconds (50 * 100ms)

        const checkIframeTheme = setInterval(() => {
          checkCount++;

          try {
            // Try to access iframe content to check if dark theme is applied
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

            if (iframeDoc) {
              // Look for dark theme indicators in the iframe
              const bodyBg = iframeDoc.body?.style?.backgroundColor;
              const hasDarkClass = iframeDoc.body?.classList?.contains('dark') ||
                iframeDoc.documentElement?.classList?.contains('dark') ||
                iframeDoc.querySelector('[data-theme="dark"]') !== null;

              // If we detect dark theme elements or after max checks, show the iframe
              if ((currentTheme === 'dark' && (bodyBg?.includes('22') || hasDarkClass)) ||
                (currentTheme === 'light' && (!bodyBg?.includes('22') || !hasDarkClass)) ||
                checkCount >= maxChecks) {

                clearInterval(checkIframeTheme);

                // Small delay to ensure everything is rendered
                setTimeout(() => {
                  if (isMounted) {
                    iframe.style.opacity = "1";
                    setIsLoading(false);
                  }
                }, 100);
              }
            }
          } catch (e) {
            // Cross-origin restrictions might prevent access
            // Fall back to timer-based approach
            if (checkCount >= maxChecks) {
              clearInterval(checkIframeTheme);
              if (isMounted) {
                iframe.style.opacity = "1";
                setIsLoading(false);
              }
            }
          }
        }, 100);

        // Also set a timeout as backup
        const timeoutId = setTimeout(() => {
          clearInterval(checkIframeTheme);
          if (isMounted) {
            iframe.style.opacity = "1";
            setIsLoading(false);
          }
        }, 5000);

        // Handle iframe error
        iframe.onerror = () => {
          clearInterval(checkIframeTheme);
          clearTimeout(timeoutId);
          if (isMounted) {
            setHasError(true);
            setIsLoading(false);
          }
        };

        wrapper.appendChild(iframe);

        // Store cleanup functions
        return () => {
          clearInterval(checkIframeTheme);
          clearTimeout(timeoutId);
        };
      })
      .catch(error => {
        if (!isMounted) return;

        setHasError(true);
        setIsLoading(false);
      });

    container.appendChild(wrapper);

    return () => {
      isMounted = false;
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [currentTheme]);

  return (
    <>
      <div
        ref={containerRef}
        className="w-full min-h-[800px] h-[65vh] max-h-[800px] rounded-lg overflow-hidden shadow-sm"
      />

      {isLoading && (
        <div className="absolute inset-0 z-[30] flex items-center justify-center bg-background">
          <CardLoader message="" />
        </div>
      )}
    </>
  );
}

export default memo(TechnicalAnalysis);