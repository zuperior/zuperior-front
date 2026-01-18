"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface Poster {
  id: number;
  title?: string;
  image_path: string;
  link_url?: string;
}

export function PromotionalSlider() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // Always show slider on page load/refresh (don't check localStorage)
    setIsHidden(false);
    fetchPosters();
  }, []);

  const fetchPosters = async () => {
    try {
      const response = await fetch("/api/promotional-posters");
      if (response.ok) {
        const data = await response.json();
        setPosters(data.posters || []);
      }
    } catch (error) {
      console.error("Failed to fetch promotional posters:", error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    // Use admin backend URL for images
    const adminBackendUrl = process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5003";
    return `${adminBackendUrl}${imagePath}`;
  };

  const handleClose = () => {
    // Only hide for current session, not persisted
    setIsHidden(true);
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (posters.length === 0 || isHidden) {
    return null; // Don't render slider if no posters or if hidden
  }

  // Duplicate posters for seamless loop
  const duplicatedPosters = [...posters, ...posters];

  return (
    <div className="w-full h-[60px] md:h-[80px] rounded-[15px] overflow-hidden relative bg-gray-100 dark:bg-gray-900">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-1 right-1 md:top-2 md:right-2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
        aria-label="Close promotional slider"
        title="Hide promotional slider"
      >
        <X className="h-3 w-3 md:h-4 md:w-4" />
      </button>

      {/* Moving ticker container */}
      <div className="relative w-full h-full overflow-hidden">
        <div
          className="flex h-full"
          style={{
            animation: `promotional-scroll ${posters.length * 20}s linear infinite`,
            width: `${duplicatedPosters.length * 100}%`,
          }}
        >
          {duplicatedPosters.map((poster, index) => (
            <div
              key={`${poster.id}-${index}`}
              className="flex-shrink-0 h-full relative"
              style={{ width: `${100 / duplicatedPosters.length}%` }}
            >
              {poster.link_url ? (
                <a
                  href={poster.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full cursor-pointer"
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={getImageUrl(poster.image_path)}
                      alt={poster.title || "Promotional poster"}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        console.error("Failed to load poster image:", poster.image_path);
                      }}
                    />
                    {/* Text overlay */}
                    {poster.title && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <p className="text-white text-sm md:text-base font-semibold px-4 text-center drop-shadow-lg">
                          {poster.title}
                        </p>
                      </div>
                    )}
                  </div>
                </a>
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={getImageUrl(poster.image_path)}
                    alt={poster.title || "Promotional poster"}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      console.error("Failed to load poster image:", poster.image_path);
                    }}
                  />
                  {/* Text overlay */}
                  {poster.title && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <p className="text-white text-sm md:text-base font-semibold px-4 text-center drop-shadow-lg">
                        {poster.title}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
