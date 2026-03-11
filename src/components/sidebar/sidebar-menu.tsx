
import { useState } from "react";
// import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
import { MenuItem } from "@/lib/sidebar-config";
// import { useTheme } from "next-themes";
import * as Tooltip from "@radix-ui/react-tooltip";
// import { inactiveBorder } from "@/lib/sidebar-assets";

interface SidebarMenuProps {
  items: MenuItem[];
  collapsed: boolean;
  onLinkClick?: () => void;
}

export function SidebarMenu({ items, collapsed, onLinkClick }: SidebarMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  // const { theme } = useTheme();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  /* const dropdownVariants = {
    hidden: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.3 },
    },
    visible: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  }; */

  const handleItemClick = (item: MenuItem) => {
    if (item.subItems.length > 0) {
      toggleDropdown(item.name);
    } else {
      router.push(item.link);
      onLinkClick?.();
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isActive = pathname === item.link;
        const hasSubItems = item.subItems.length > 0;
        const isSubActive = item.subItems.some(
          (subItem) => pathname === subItem.link
        );
        const isDropdownOpen = openDropdown === item.name;

        // Tooltip wrapper for collapsed sidebar
        const IconWithTooltip = (
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 relative transition-colors duration-200 cursor-pointer",
              collapsed && "rounded-[10px] mx-auto"
            )}
            onClick={() => handleItemClick(item)}
          >
            <IconImage
              className={`${!isActive && !isSubActive ? "opacity-80" : ""}`}
              src={isActive || isSubActive ? item.active : item.icon}
              alt={item.name}
            />
          </div>
        );

        return (
          <div
            key={item.name}
            className={cn(
              "mb-2 w-full flex items-center group rounded-[10px] transition-all duration-200 active:transform-none relative",
              isActive || isSubActive
                ? "bg-gradient-to-tr from-[#6242A5] via-[#FAF7FF]/20 via-75% to-[#9F8BCF] dark:bg-gradient-to-r dark:from-[#2A1F3A] dark:via-[#1A1520] dark:to-[#1A1520]"
                : "bg-transparent",
              collapsed && "rounded-[10px] mx-auto"
            )}
          >
            {/* Subtle highlight on right side for active menu - matching image 1 exactly */}
            {(isActive || isSubActive) && (
              <div 
                className="absolute right-0"
                style={{
                  width: '1px',
                  height: '32px',
                  top: 'calc(51.9231% - 16px)',
                  background: 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(255, 255, 255, 0.7) 50.9009%, rgba(0, 0, 0, 0) 100%)',
                  opacity: 1,
                  overflow: 'visible',
                  zIndex: 1,
                }}
              />
            )}
            {/* Tooltip only when collapsed */}
            {collapsed ? (
              <Tooltip.Provider delayDuration={100}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>{IconWithTooltip}</Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      sideOffset={16}
                      className={cn(
                        "z-50 select-none rounded-[8px] px-4 py-2 text-[12px] font-medium shadow-md",
                        "bg-[#18111A]/90 border border-[#7E3BD9]/40",
                        "text-white",
                        "backdrop-blur-md",
                        "shadow-[#7e3bd9]/20"
                      )}
                    >
                      {item.name}
                      <Tooltip.Arrow className="fill-[#18111A]/90" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            ) : (
              IconWithTooltip
            )}

            {/* Button with text - hidden on mobile/tablet, only show on desktop */}
            {!collapsed && (
              <div className="flex-1 flex">
                <Button
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "relative cursor-pointer flex h-12 z-50 w-full justify-between shadow-none text-start items-center px-4 rounded-r-[10px] rounded-l-none bg-inherit hover:bg-inherit"
                  )}
                >
                  <div className="flex items-center justify-between w-full -ml-1">
                    <span
                      className={cn(
                        "relative z-10 font-semibold text-sm transition-colors",
                        isActive || isSubActive
                          ? "text-[#000000] dark:text-white"
                          : "text-gray-600 dark:text-white/45"
                      )}
                    >
                      {item.name}
                    </span>

                    {hasSubItems && (
                      <span
                        className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleDropdown(item.name);
                        }}
                      >
                        {isDropdownOpen ? (
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isActive || isSubActive
                                ? "text-[#7E3BD9] dark:text-white"
                                : "text-gray-500 dark:text-white/45"
                            )}
                          />
                        ) : (
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isActive || isSubActive
                                ? "text-[#7E3BD9] dark:text-white"
                                : "text-gray-600 dark:text-white/45"
                            )}
                          />
                        )}
                      </span>
                    )}
                  </div>
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}



// gradient background moved from button to parent div.
// Button made transparent -bg-inherit
// hover effect removed
//  thin right-side gradient line (after:) removed
const IconImage = ({ src, alt, className }: { src: any; alt: string; className?: string }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    // Simple inline SVG fallback for light mode when image is missing.
    // Two variants based on name to give some visual variety.
    const isVariantA = (alt || '').toLowerCase().includes('overview') || (alt || '').toLowerCase().includes('wallet');
    return (
      <div className={cn("flex items-center justify-center", className)} aria-label={alt} role="img">
        {isVariantA ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="#7E3BD9" strokeWidth="2" />
            <path d="M8 12h8" stroke="#7E3BD9" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 8v8" stroke="#7E3BD9" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="5" width="18" height="14" rx="3" stroke="#7E3BD9" strokeWidth="2" />
            <path d="M3 10h18" stroke="#7E3BD9" strokeWidth="2" />
            <circle cx="8" cy="15" r="1.5" fill="#7E3BD9" />
            <circle cx="12" cy="15" r="1.5" fill="#7E3BD9" />
          </svg>
        )}
      </div>
    );
  }
  return (
    <Image
      className={className}
      height={25}
      width={25}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
};
