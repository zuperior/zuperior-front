"use client";
import TickerTape from "@/components/ticker-tape";
import { TextAnimate } from "@/components/ui/text-animate";
import { useTheme } from "next-themes";
import PerformanceStats from "@/components/charts/performance-statistics";
import ToolNavbar from "../toolsNavbar";

const Page = () => {
  const { theme } = useTheme();
  return (
    <div>
      <div className="flex flex-row items-center justify-between py-6">
        <ToolNavbar />
        <TextAnimate className="text-4xl font-semibold dark:text-white/75">
          Performance Statistics
        </TextAnimate>
        <div className="flex-1" />
      </div>
      <TickerTape />
      <div className="flex gap-6 justify-center items-center px-15">
        <PerformanceStats
        />
      </div>
    </div>
  );
};

export default Page;
