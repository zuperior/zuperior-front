"use client";

import type React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TextAnimate } from "@/components/ui/text-animate";
import {
  ArrowRight,
  Calculator,
  Calendar,
  TrendingUp,
  LucideIcon,
  CandlestickChart,
  Bitcoin,
  Map,
  Presentation,
  AreaChart,
  ChartNoAxesCombined,
  LineChart,
  BookHeart,
} from "lucide-react";

import Link from "next/link";

export default function TradingToolsPage() {
  const data = [
    {
      id: 3,
      icon: TrendingUp,
      heading: "Zuper Ai Technical Analysis",
      link: "/tools/ai-technical-analysis",
      category: "Tech Analysis",
    },
    {
      id: 4,
      icon: TrendingUp,
      heading: "Zuper Price Range Volatility",
      link: "/tools/price-range-volatility",
      category: "Tech Analysis",
    },
    {
      id: 5,
      icon: Calendar,
      heading: "Zuper News Sentiment Analysis",
      link: "/tools/news-sentiment-analysis",
      category: "Tech Analysis",
    },
    {
      id: 7,
      icon: TrendingUp,
      heading: "Market News & Updates",
      link: "/tools/market-news-updates",
      category: "Tech Analysis",
    },
    {
      id: 8,
      icon: CandlestickChart,
      heading: "Cross Rates",
      link: "/tools/cross-rates",
      category: "Tech Analysis",
    },
    {
      id: 9,
      icon: Bitcoin,
      heading: "Crypto Market Cap",
      link: "/tools/crypto-market-cap",
      category: "Tech Analysis",
    },
    {
      id: 10,
      icon: Map,
      heading: "Heat Maps",
      link: "/tools/heat-maps",
      category: "Tech Analysis",
    },
    {
      id: 11,
      icon: AreaChart,
      heading: "Zuper Economic Calendar",
      link: "/tools/calendar",
      category: "Tech Analysis",
    },
    {
      id: 12,
      icon: BookHeart,
      heading: "Our Favourites",
      link: "/tools/our-favourites",
      category: "Tech Analysis",
    },
    {
      id: 13,
      icon: ChartNoAxesCombined,
      heading: "Performance Statics",
      link: "/tools/performance-statics",
      category: "Tech Analysis",
    },
    {
      id: 15,
      icon: LineChart,
      heading: "Top Stories",
      link: "/tools/top-stories",
      category: "Tech Analysis",
    },
  ];

  // const cardMaskStyle: React.CSSProperties = {
  //   WebkitMaskImage: "linear-gradient(212deg, rgb(49,27,71) 0%, rgb(20,17,24) 100%)",
  //   maskImage: "linear-gradient(100deg, rgba(0,0,0,0.1) 10%, rgba(0,0,0,0.4) 100%)",
  //   borderRadius: "15px",
  //   opacity: 0.25,
  //   position: "absolute",
  //   inset: 0,
  //   zIndex: 0,
  //   pointerEvents: "none",
  // };

  return (
    <div className="flex flex-col dark:bg-[#01040D]">
      <main className="flex-1 overflow-y-auto px-4 ">
        <TextAnimate
          as="h1"
          className=" text-[28px] md:text-[34px] font-bold dark:text-white/75"
        >
          Zuper Smart Tools and Calculators
        </TextAnimate>

        <Tabs defaultValue="calculators">
          {/* <div className="flex mt-3">
            <ToggleGroup
              type="single"
              value={activeTab}
              onValueChange={(value) => value && setActiveTab(value as typeof activeTab)}
              className="relative p-2 rounded-[10px]"
            >
              <div style={cardMaskStyle} className="border border-[#6545a7] dark:border-white/45" />
              <ToggleGroupItem value="all" className="z-10 cursor-pointer">All</ToggleGroupItem>
              <ToggleGroupItem value="Calculators" className="z-10 cursor-pointer">Calculators</ToggleGroupItem>
              <ToggleGroupItem value="Tech Analysis" className="z-10 cursor-pointer">Tech Analysis</ToggleGroupItem>
            </ToggleGroup>
          </div> */}

          <TabsContent value="calculators" className="mt-4">
            <div className="grid gap-12 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
              {data.map(({ id, icon, heading, link }) => (
                <IBCard
                  key={id}
                  icon={icon}
                  heading={heading}
                  link={link}
                  // showDivider={index % 4 !== 3}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function IBCard({
  icon: Icon,
  heading,
  link,
}: {
  icon: LucideIcon;
  heading: string;
  link: string;
}) {
  return (
    <div className="rounded-xl p-6 bg-[linear-gradient(120deg,#6242a5_0%,rgb(98,66,165)_32.947987049549546%,rgba(120,74,164,0.82826)_42.942944088497676%,rgba(163,91,162,0.4)_67.86787015897734%,rgba(163,91,162,0.4)_100%,rgb(0,0,0)_100%)] dark:bg-[radial-gradient(ellipse_27%_80%_at_0%_0%,rgba(163,92,162,0.5),rgba(0,0,0,1))]">
      <Link
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative cursor-pointer overflow-hidden block"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-4">
            <Icon size={30} className="text-[#A35CA2] mr-2" />
          </div>
          <div className="flex justify-between items-center w-full">
            <p className="text-lg font-medium text-start dark:text-white/75 text-black">
              {heading}
            </p>
            <div className="dark:bg-[#01040D] bg-white/10 border border-gray-600 p-2 rounded-full">
              <ArrowRight className="dark:text-white/75 text-black h-4 w-4 transition-transform duration-300 group-hover:-rotate-45" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
