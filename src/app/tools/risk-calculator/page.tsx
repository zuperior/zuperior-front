"use client";
import { useTheme } from "next-themes";
import RiskCalculator from "@/components/charts/risk-calculator";
import TickerTape from "@/components/ticker-tape";
import { TextAnimate } from "@/components/ui/text-animate";
import ToolNavbar from "../toolsNavbar";

const Page = () => {
  const { theme } = useTheme();
  return (
    <>
      <div className="flex items-center justify-between py-6">
        <ToolNavbar />
        <TextAnimate className="text-4xl text-center font-semibold dark:text-white/75">
          Risk Calculator
        </TextAnimate>
        <div className="flex-1" />
      </div>
      <TickerTape />
      <div className="flex gap-6 justify-center items-center px-15">
        <RiskCalculator />
      </div>
    </>
  );
};

export default Page;
