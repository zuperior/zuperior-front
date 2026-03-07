"use client";
import TickerTape from "@/components/ticker-tape";
import MarketNews from "@/components/charts/market-news";
import { TextAnimate } from "@/components/ui/text-animate";
import { useTheme } from "next-themes";
import ToolNavbar from "../toolsNavbar";

const Page = () => {
  const { theme } = useTheme();
  return (
    <div>
      <div className="flex flex-row items-center justify-between py-6">
        <ToolNavbar />
        <TextAnimate className="text-4xl font-semibold dark:text-white/75">
          Market News &amp; Updates
        </TextAnimate>
        <div className="flex-1" />
      </div>
      <TickerTape />
      <div className="flex justify-center items-center px-15">
        <MarketNews/>
      </div>
    </div>
  );
};

export default Page;
