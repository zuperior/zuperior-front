"use client";
import { useTheme } from "next-themes";
import TickerTape from "@/components/ticker-tape";
import VolatilityAnalysis from "@/components/charts/volatility-analysis";
import { TextAnimate } from "@/components/ui/text-animate";
import ToolNavbar from "../toolsNavbar";

const Page = () => {
  const { theme } = useTheme();
  return (
    <>
      <div className="flex flex-row items-center justify-between py-6">
        <ToolNavbar />
        <TextAnimate className="text-4xl font-semibold dark:text-white/75">
          Zuper Price Range Volatility
        </TextAnimate>
        <div className="flex-1" />
      </div>
      <TickerTape />
      <div className="flex gap-6 justify-center items-center px-15">
        <VolatilityAnalysis/>
      </div>
    </>
  );
};

export default Page;
