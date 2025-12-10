"use client";

import { cn } from "@/lib/utils";
import { useSidebarState } from "@/hooks/useSidebarState";
import { getMenuItems } from "@/lib/sidebar-config";
import { SidebarHeader } from "@/components/sidebar/sidebar-header";
import { SidebarMenu } from "@/components/sidebar/sidebar-menu";
import { SidebarToggle } from "@/components/sidebar/sidebar-toggle";
import { ReferralBanner } from "@/components/sidebar/referral-banner";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

export function Sidebar({ mobileOpen = false, setMobileOpen = () => { } }: { mobileOpen?: boolean; setMobileOpen?: (open: boolean) => void }) {
  const theme = useTheme();
  const { collapsed, toggleSidebar } = useSidebarState();

  const menuItems = getMenuItems({ theme: theme.theme === "light" ? "light" : "dark" })
  const primaryItems = menuItems.slice(0, 7);
  const secondaryItems = menuItems.slice(7);

  // On mobile: always show icons only (no text), on desktop: use collapsed state
  const [isMobileView, setIsMobileView] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // For display purposes, on mobile we always want icons-only view
  const displayCollapsed = isMobileView ? true : collapsed;

  return (
    <>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative top-0 left-0 h-dvh flex flex-col justify-between border-r border-transparent lg:border-gray-200 lg:dark:border-[#1a2032] bg-white dark:bg-[#01040D] text-black dark:text-white transition-all duration-300 ease-in-out z-60",
          // On mobile/tablet: w-0 when closed, completely hidden
          // On desktop (lg): collapsed ? w-22.5 : w-[280px]
          "lg:w-auto",
          mobileOpen ? "w-[90px] lg:w-auto" : "w-0 overflow-hidden border-0 lg:w-auto lg:border-r",
          collapsed && "lg:w-22.5",
          !collapsed && "lg:w-[280px]",
          mobileOpen ? "translate-x-0 lg:translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Show logo on mobile, full header on desktop */}
        <div className={cn("block")}>
          <SidebarHeader collapsed={displayCollapsed} />
        </div>
        {/* Toggle only visible on desktop */}
        <div className={cn("lg:block", isMobileView && "hidden")}>
          <SidebarToggle collapsed={collapsed} onToggle={toggleSidebar} />
        </div>

        {/* Mobile/Tablet Cross Button */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.button
              key="cross"
              className="absolute top-7 -right-15 lg:hidden p-1.5 rounded-full bg-gray-800 dark:bg-gray-800 text-white z-50"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0, x: 20, rotate: 90, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
              exit={{
                opacity: 0,
                x: 40,
                rotate: 120,
                scale: 0.7,
                transition: { type: "spring", stiffness: 150, damping: 20 },
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <X size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Show menu icons on mobile, full menu on desktop */}
        <div className={cn("flex-1 overflow-hidden")}>
          <nav
            className={cn(
              "flex flex-col gap-2.5 hide-scrollbar overflow-y-auto h-full pb-10 md:pt-10",
              "px-3 lg:px-4.5"
            )}
          >
            {/* On mobile: always show icons only, on desktop: use collapsed state */}
            <SidebarMenu items={primaryItems} collapsed={displayCollapsed} onLinkClick={() => setMobileOpen(false)} />
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-[#9F8ACF]/50 to-transparent" />
            <SidebarMenu items={secondaryItems} collapsed={displayCollapsed} onLinkClick={() => setMobileOpen(false)} />
          </nav>
        </div>

        {/* Hide referral banner on mobile */}
        <div className={cn("lg:block", isMobileView && "hidden")}>
          <ReferralBanner collapsed={displayCollapsed} />
        </div>
      </div>

      {/* Dark overlay for mobile/tablet when sidebar is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}