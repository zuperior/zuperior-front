import Image from "next/image";
import { FloatingDots } from "@/components/ui/floating-dots";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ReferralBannerProps {
  collapsed: boolean;
}

export function ReferralBanner({ collapsed }: ReferralBannerProps) {
  return (
    <Link
      href="https://zuperlearn.com"
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <div className="relative flex items-center gap-3 overflow-hidden rounded-xl m-3.5 mb-3 h-16 dark:border border-gray-800 bg-gradient-to-r from-[#965795] to-[#070407] p-3 shadow-lg text-white transition-all duration-300
        hover:border-fuchsia-400 hover:shadow-[0_0_0_2px_rgba(163,92,162,0.4)] hover:border-1">
        <div className="absolute inset-0 bg-[radial-gradient(circle,#ffffff22_1px,transparent_1px)] bg-[length:10px_10px] opacity-20 rounded-2xl pointer-events-none"></div>
        <FloatingDots dotCount={40} />
        <div className="flex items-center space-x-2 z-20">
          <div className="flex items-center justify-center w-8 h-8 bg-[#FFFFFF] dark:bg-[#01040D] rounded-full relative ml-0.5">
            <Image
              className="w-4 h-4 object-contain"
              src="/zuplearn.svg"
              alt="Gift icon"
              width={16}
              height={16}
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-md font-semibold text-white/80 whitespace-nowrap flex items-center">
                Explore Zuper Learn
                <ArrowRight size={16} className="ml-3 -rotate-45 transition-transform duration-300 group-hover:rotate-0" />
              </p>
              <p className="text-xs mt-1 text-white/60 whitespace-nowrap hidden">
                Refer friends & get rewards
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}