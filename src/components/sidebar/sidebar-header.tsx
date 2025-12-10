"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import zuperFunded from "@/assets/sidebar/zuperFunded.svg";
import zuperLearn from "@/assets/sidebar/zuperLearn.svg";
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
              className={`object-contain relative ${collapsed ? "w-12 h-12" : "h-16 w-16 pl-0 lg:h-16 lg:w-16"
                }`}
            >
              <Image
                alt="Zuperior Logo"
                src="/logo.png"
                width={collapsed ? 48 : 63}
                height={collapsed ? 48 : 63}
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

            {!collapsed && (
              <div className="hidden lg:flex flex-col">
                <span className="text-[25px] leading-[-0.05em] font-bold text-black dark:text-white/75">
                  Zuperior
                </span>
                <span className="text-sm text-black dark:text-white/45">
                  Trade Superior
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <ChevronDown
              onClick={toggleDropdown}
              size={15}
              className="hidden lg:flex cursor-pointer dark:text-white/75 text-black"
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
                    href="https://zuperior-staging.onrender.com"
                    className="flex items-center px-4 py-2 hover:bg-[#9a86cc] dark:hover:bg-[#1E1429]/40 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                    target="_blank" // Opens in a new tab (optional)
                    rel="noopener noreferrer" // Security for new tabs
                  >
                    <Image
                      src="/logo.png"
                      alt="Website"
                      width={25}
                      height={25}
                      className="w-6 h-6 mr-3 object-contain transition-all duration-300"
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
                    <span className="dark:text-white/75 text-black text-sm flex items-center gap-1">
                      Zuperior Website
                      <ArrowRight size={16} className="ml-12" />
                    </span>
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center px-4 py-2 hover:bg-[#9a86cc] dark:hover:bg-[#1E1429]/40 transition-colors group relative opacity-60 cursor-not-allowed"
                    onClick={(e) => {
                      e.preventDefault(); // disable navigation
                    }}
                  >
                    <Image
                      src={zuperFunded}
                      alt="Funded"
                      width={25}
                      height={25}
                      className="w-6 h-6 mr-3"
                    />
                    <span className="dark:text-white/75 text-black group-hover:text-gray-100 text-sm">
                      Zuper Funded
                    </span>
                    <div className="absolute right-2 bg-[#9F8ACF]/30 px-2 py-[2px] rounded-[5px] font-semibold text-black/75 dark:text-white/75 tracking-tighter text-[10px]">
                      Coming Soon
                    </div>
                  </Link>
                  <Link
                    href="https://zuperlearn.com"
                    className="flex items-center px-4 py-2 hover:bg-[#9a86cc] dark:hover:bg-[#1E1429]/40 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src={zuperLearn}
                      alt="Learn"
                      width={25}
                      height={25}
                      className="w-5 h-5 mr-3"
                    />
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
