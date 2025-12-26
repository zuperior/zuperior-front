"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";

interface SidebarHeaderProps {
  collapsed: boolean;
}

export function SidebarHeader({ collapsed }: SidebarHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark' || theme === 'dark';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div
      className="relative flex items-center mt-4 mb-5"
      ref={dropdownRef}
    >
      <div
        className={`flex w-full items-center justify-center ${collapsed ? "justify-center" : ""
          }`}
      >
        {/* This is the new parent container for the dropdown */}
        <div className="relative flex items-center gap-4">
          <Link href="/" className={`flex items-center ${collapsed ? "" : ""}`}>
            <div
              className={`object-contain relative flex items-center justify-center ${collapsed ? "w-12 h-12" : "w-56 h-12"
                }`}
            >
              <Image
                alt="Zuperior Logo"
                src={collapsed ? "/logo_icon.png" : "/logo.webp"}
                width={collapsed ? 48 : 224}
                height={collapsed ? 48 : 48}
                quality={100}
                unoptimized
                priority
                className="object-contain transition-all duration-300"
                style={!isDark ? {
                  // Light mode: Enhanced brightness, contrast, and saturation for better visibility on light backgrounds
                  filter: 'brightness(1.15) contrast(1.3) saturate(1.4) drop-shadow(0 2px 8px rgba(124, 58, 237, 0.3))',
                  opacity: 1,
                } : {
                  // Dark mode: Original logo appearance
                  filter: 'none',
                  opacity: 1,
                }}
              />
            </div>
          </Link>

          {!collapsed && (
            <ChevronDown
              onClick={toggleDropdown}
              size={15}
              className="cursor-pointer dark:text-white/75 text-black"
            />
          )}

          {/* Dropdown Menu - Now correctly nested inside the relative parent */}
          {isDropdownOpen && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute mt-1.5 justify-center top-full overflow-hidden left-0 w-[250px] dark:bg-[#000000] bg-white rounded-b-[10px] border-l border-r border-b border-[#3b334f] z-[99]"
              >
                {/* Menu Items */}
                <div>
                  <Link
                    href="https://zuperior.com/"
                    className="flex items-center px-4 py-2 hover:bg-[#9a86cc] dark:hover:bg-[#1E1429]/40 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                    target="_blank" // Opens in a new tab (optional)
                    rel="noopener noreferrer" // Security for new tabs
                  >
                    <div className="w-6 h-6 mr-3 flex items-center justify-center shrink-0">
                      <Image
                        src="/logo_icon.png"
                        alt="Website"
                        width={24}
                        height={24}
                        quality={100}
                        unoptimized
                        className="object-contain transition-all duration-300"
                        style={!isDark ? {
                          // Light mode: Enhanced visibility
                          filter: 'brightness(1.15) contrast(1.3) saturate(1.4) drop-shadow(0 2px 8px rgba(124, 58, 237, 0.3))',
                          opacity: 1,
                        } : {
                          // Dark mode: Original appearance
                          filter: 'none',
                          opacity: 1,
                        }}
                      />
                    </div>
                    <span className="dark:text-white/75 text-black text-sm flex items-center gap-1">
                      Zuperior Website
                      <ArrowRight size={16} className="ml-12" />
                    </span>
                  </Link>
                  <Link
                    href="https://zuperlearn.com"
                    className="flex items-center px-4 py-2 hover:bg-[#9a86cc] dark:hover:bg-[#1E1429]/40 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="w-5 h-5 mr-3 flex items-center justify-center shrink-0">
                      <Image
                        src="/zuplearn-logo.png"
                        alt="Learn"
                        width={20}
                        height={20}
                        quality={100}
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                    <span className="dark:text-white/75 text-black text-sm flex items-center gap-1">
                      Zuper Learn
                      <ArrowRight size={16} className="ml-21" />
                    </span>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
