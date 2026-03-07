"use client";
import { useTheme } from "next-themes";
import TickerTape from "@/components/ticker-tape";
import Calender from "@/components/charts/calendar";
import { TextAnimate } from "@/components/ui/text-animate";
import ToolNavbar from "../toolsNavbar";

const Page = () => {
  const { theme } = useTheme();
  return (
    <div>
      <div className="flex flex-row items-center justify-between py-6">
        <ToolNavbar />
        <TextAnimate className="text-4xl font-semibold dark:text-white/75">
          Calender
        </TextAnimate>
        <div className="flex-1" />
      </div>

      <TickerTape />
      <div className="flex gap-6 justify-center items-center px-15">
        <Calender
        />
      </div>
    </div>
  );
};

export default Page;
