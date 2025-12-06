// import { Button } from "@/components/ui/button";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface SidebarToggleProps {
//   collapsed: boolean;
//   onToggle: () => void;
// }

// export function SidebarToggle({ collapsed, onToggle }: SidebarToggleProps) {
//   return (
//     <Button
//       onClick={onToggle}
//       className={cn(
//         "rounded-full absolute -right-5 top-15 z-100 font-bold mx-auto w-9 cursor-pointer border",
//         "bg-white text-[#A35CA2] hover:bg-gray-100 border-gray-200",
//         "dark:bg-[#01040D] dark:text-white dark:hover:bg-[#01040D] dark:border-[#1a2032]"
//       )}
//     >
//       {collapsed ? (
//         <ChevronRight className="h-12 w-12" />
//       ) : (
//         <ChevronLeft className="h-12 w-12" />
//       )}
//     </Button>
//   );
// }



import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarToggle({ collapsed, onToggle }: SidebarToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "items-center justify-center gap-2 whitespace-nowrap text-sm",
        "transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
        "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "shadow-xs h-9 px-4 py-2 has-[>svg]:px-3",
        "hidden lg:flex rounded-full absolute -right-5 top-15 z-[9999] font-bold mx-auto w-9 cursor-pointer border",
        "bg-white text-[#A35CA2] hover:bg-gray-100 border-gray-200",
        "dark:bg-[#01040D] dark:text-white dark:hover:bg-[#01040D] dark:border-[#1a2032]"
      )}
    >
      {collapsed ? (
        <ChevronRight className="h-12 w-12" aria-hidden="true" />
      ) : (
        <ChevronLeft className="h-12 w-12" aria-hidden="true" />
      )}
    </button>
  );
}