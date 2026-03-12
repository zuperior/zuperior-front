// "use client";

// import React, { useEffect, useRef, memo, useState } from "react";
// import { useTheme } from "next-themes";
// import { useAutochartist, AutochartistConfig } from '@/hooks/useChartToken';

// interface OurFavoritesProps {
//   language?: string;
// }

// function OurFavorites({ language = 'en' }: OurFavoritesProps): React.ReactElement {
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const { theme } = useTheme();
//   const [iframeKey, setIframeKey] = useState(0);

//   // Memoize config with theme
//   const config: AutochartistConfig = React.useMemo(() => ({
//     theme: theme === 'dark' ? 'dark' : 'light',
//     type: 'favorites',
//     language
//   }), [theme, language]);

//   const { url, loading, error } = useAutochartist(config);

//   // Handle iframe injection similar to TradingView pattern
//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container || !url) return;

//     // Clear previous content
//     container.innerHTML = "";

//     // Create and configure iframe
//     const iframe = document.createElement("iframe");
//     iframe.src = url;
//     iframe.width = "100%";
//     iframe.height = "100%";
//     iframe.frameBorder = "0";
//     iframe.title = "Autochartist Our Favorites";
//     iframe.sandbox.add("allow-scripts", "allow-same-origin", "allow-forms");

//     // Add loading state
//     iframe.style.opacity = "0";
//     iframe.style.transition = "opacity 0.3s ease";

//     iframe.onload = () => {
//       iframe.style.opacity = "1";
//     };

//     container.appendChild(iframe);

//     // Cleanup
//     return () => {
//       if (container) {
//         container.innerHTML = "";
//       }
//     };
//   }, [url, iframeKey]); // Re-run when URL or key changes

//   // Show themed loading state
//   if (loading) {
//     return (
//       <div 
//         className="w-full min-h-[800px] h-[65vh] max-h-[800px] rounded-lg overflow-hidden shadow-sm flex items-center justify-center transition-colors duration-300"
//         style={{
//           backgroundColor: theme === 'dark' ? '#1D222D' : '#FFFFFF',
//           color: theme === 'dark' ? '#FFFFFF' : '#1D222D'
//         }}
//       >
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-4"></div>
//           <p>Loading Our Favorites...</p>
//         </div>
//       </div>
//     );
//   }

//   // Show error state
//   if (error) {
//     return (
//       <div 
//         className="w-full min-h-[800px] h-[65vh] max-h-[800px] rounded-lg overflow-hidden shadow-sm flex items-center justify-center"
//         style={{
//           backgroundColor: theme === 'dark' ? '#1D222D' : '#FFFFFF'
//         }}
//       >
//         <div className="text-center text-red-500">
//           <p>Failed to load Our Favorites</p>
//           <p className="text-sm mt-2">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   // Return container for iframe injection
//   return (
//     <div 
//       ref={containerRef}
//       className="w-full min-h-[800px] h-[65vh] max-h-[800px] rounded-lg overflow-hidden shadow-sm transition-colors duration-300"
//       style={{
//         backgroundColor: theme === 'dark' ? '#1D222D' : '#FFFFFF'
//       }}
//     />
//   );
// }

// export default memo(OurFavorites);

"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import { useTheme } from "next-themes";
import { CardLoader } from "../ui/loading";

interface OurFavoritesProps {
  language?: string;
}

function OurFavorites({ language = 'en' }: OurFavoritesProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentTheme = resolvedTheme || theme || 'light';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

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
        type: 'favorites',
        language,
        _t: Date.now() // Prevent caching
      })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
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
        iframe.title = "Autochartist Our Favorites";
        iframe.sandbox.add("allow-scripts", "allow-same-origin", "allow-forms", "allow-popups");

        // Try to detect when iframe content is fully loaded with correct theme
        let checkCount = 0;
        const maxChecks = 50; // Check for up to 5 seconds (50 * 100ms)

        const checkIframeTheme = setInterval(() => {
          checkCount++;

          try {
            // Try to access iframe content to check if theme is applied
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

            if (iframeDoc) {
              // Look for theme indicators in the iframe
              const bodyBg = iframeDoc.body?.style?.backgroundColor;
              const hasDarkClass = iframeDoc.body?.classList?.contains('dark') ||
                iframeDoc.documentElement?.classList?.contains('dark') ||
                iframeDoc.querySelector('[data-theme="dark"]') !== null;

              // If we detect theme elements or after max checks, show the iframe
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
            setErrorMessage('Failed to load Our Favorites');
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
        setErrorMessage(error.message || 'Unknown error');
        setIsLoading(false);
      });

    container.appendChild(wrapper);

    return () => {
      isMounted = false;
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [currentTheme, language]);

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

export default memo(OurFavorites);