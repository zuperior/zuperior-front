"use client";

import type React from "react";
import type { JSX } from "react";
import { useState } from "react";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Image, { StaticImageData } from "next/image";

import desktop from "@/assets/meta-trader5.png";
import mobile from "@/assets/zuperior-mobile.png";
import mobile2 from "@/assets/trading-view.png";
import { memo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { TextAnimate } from "@/components/ui/text-animate";

export default function TradingPlatformsPage() {
  const [activeTab, setActiveTab] = useState("all");

  const Description = [
    {
      name: "Meta Traders Desktop App",
      image: desktop,
      category: "metatraders",
      links: [
        {
          label: "Download",
          url: "https://download.mql5.com/cdn/web/zuperior.fx.limited/mt5/zuperiorfx5setup.exe",
          icon: "download",
        },
      ],
    },
    {
      name: "Meta Trader Mobile App ios/Android",
      image: desktop,
      category: "metatraders",
      links: [
        {
          label: "IOS",
          url: "https://download.mql5.com/cdn/mobile/mt5/ios?server=ZuperiorFX-Server",
          icon: "apple",
        },
        {
          label: "Android",
          url: "https://download.mql5.com/cdn/mobile/mt5/android?server=ZuperiorFX-Server",
          icon: "android",
        },
      ],
    },
    {
      name: "Zuperior Web Terminal",
      image: mobile2,
      category: "zuperior",
      // Remove links, add a flag for web terminal
      isWebTerminal: true,
    },
    {
      name: "Zuperior Mobile App",
      image: mobile,
      category: "zuperior",
      isComingSoon: true,
    },
  ];

  const Icons: Record<IconName, JSX.Element> = {
    apple: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
        <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
      </svg>
    ),
    android: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path d="M14.222 9.374c1.037-.61 1.037-2.137 0-2.748L11.528 5.04 8.32 8l3.207 2.96zm-3.595 2.116L7.583 8.68 1.03 14.73c.201 1.029 1.36 1.61 2.303 1.055zM1 13.396V2.603L6.846 8zM1.03 1.27l6.553 6.05 3.044-2.81L3.333.215C2.39-.341 1.231.24 1.03 1.27" />
      </svg>
    ),
    download: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
      </svg>
    ),
    doc: <span>Doc Icon Placeholder</span>,
    support: <span>Support Icon Placeholder</span>,
    info: <span>Info Icon Placeholder</span>,
  };

  // 🔹 Spinning animation (reused, memoized)
  const SpinningBorder = memo(() => (
    <div className="absolute inset-0 z-1 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "linear",
          type: "tween",
        }}
        style={{
          background:
            "conic-gradient(from 957deg at 45.6% 46.7%, rgba(0, 0, 0, 0.07) 306deg, #a35ca2 340deg, rgba(0, 0, 0, 0.36) 9deg)",
          willChange: "transform",
        }}
        className="w-150 h-150 p-10 rounded-full"
      />
    </div>
  ));
  SpinningBorder.displayName = "SpinningBorder";

  // Define interface for PlatformCard props
  interface PlatformCardProps {
    item: {
      image: string | StaticImageData;
      name: string;
      category?: string;
      links?: Array<{
        label: string;
        url: string;
        icon?: string;
      }>;
      title?: string;
      isWebTerminal?: boolean;
      isComingSoon?: boolean;
    };
    index: number;
    icon?: string;
  }

  type IconName = "download" | "apple" | "android" | "doc" | "support" | "info";

  // Handle Web Terminal click
  const handleWebTerminalClick = () => {
    const token = localStorage.getItem('userToken');
    const clientId = localStorage.getItem('clientId');

    if (!token || !clientId) {
      console.error('No authentication credentials found');
      return;
    }

    // Get terminal URL from environment variable
    const terminalBaseUrl = process.env.NEXT_PUBLIC_TERMINAL_URL || 'https://trade.zuperior.com';
    const terminalUrl = `${terminalBaseUrl}/terminal?token=${encodeURIComponent(token)}&clientId=${encodeURIComponent(clientId)}&autoLogin=true`;
    window.open(terminalUrl, '_blank');
  };

  // Platform Card (reused)
  const PlatformCard = memo(({ item, index }: PlatformCardProps) => (
    <div className="flex flex-col gap-5">
      <div className="relative w-full aspect-348/325 rounded-[15px] shadow-md overflow-hidden flex items-center justify-center">
        <div className="relative z-2 w-full h-full p-px">
          {(index === 1 || index === 3) && <SpinningBorder />}
          <Image
            src={item.image}
            alt={item.name}
            width={348}
            height={325}
            className="w-full h-full object-cover rounded-xl relative z-2"
            loading={index === 0 ? "eager" : "lazy"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            quality={85}
          />
        </div>
      </div>

      {/* Name + Buttons or Web Terminal Info */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg sm:text-xl font-semibold dark:text-white/75 text-black/75 leading-[1.3em]">
          {item.name}
        </h3>

        {/* If web terminal, show button to open terminal */}
        {"isWebTerminal" in item && item.isWebTerminal ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleWebTerminalClick}
              className="rounded-[10px] text-center py-2 px-4 text-white bg-linear-to-r from-[#9f8bcf] to-[#6242a5] dark:bg-linear-to-r dark:from-[#6242a5] dark:to-[#9f8bcf] text-xs leading-3.5 cursor-pointer hover:bg-transparent flex items-center justify-center gap-1"
            >
              <span>Open Web Terminal</span>
            </button>
          </div>
        ) : "isComingSoon" in item && item.isComingSoon ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#a35ca2] bg-[#a35ca2]/10 py-1.5 px-3 rounded-[10px] w-fit">
              Coming soon
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 flex-wrap">
              {item.links?.slice(0, 2).map((link, i) => (
                <Link
                  key={`${item.name}-btn-${i}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-20 rounded-[10px] text-center py-2 px-4 text-white bg-linear-to-r from-[#9f8bcf] to-[#6242a5] dark:bg-linear-to-r dark:from-[#6242a5] dark:to-[#9f8bcf] text-xs leading-3.5 cursor-pointer hover:bg-transparent flex items-center justify-center gap-1"
                >
                  {link.icon && Icons[link.icon as IconName]}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  ));

  PlatformCard.displayName = "PlatformCard";

  return (
    <div className="flex flex-col dark:bg-[#01040D]">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto dark:bg-[#01040D]">
          {/* <TickerTape /> */}
          <TextAnimate
            as={"h1"}
            duration={0.4}
            className="text-[34px] font-bold dark:text-white/75 px-2.5 md:px-0"
          >
            Platforms
          </TextAnimate>

          {/* Tabs and Content */}
          <div className="pt-3 space-y-4 px-4 md:px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center mt-3">
                <ToggleGroup
                  type="single"
                  value={activeTab}
                  onValueChange={(value) => {
                    if (value && ["all", "metatraders", "zuperior"].includes(value)) {
                      setActiveTab(value);
                    }
                  }}
                  className="p-2 relative rounded-[15px] border border-[#222222]/15"
                >
                  <ToggleGroupItem value="all" className="z-10 cursor-pointer">
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem value="metatraders" className="z-10 cursor-pointer">
                    MT5
                  </ToggleGroupItem>
                  <ToggleGroupItem value="zuperior" className="z-10 cursor-pointer">
                    Zuperior
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </Tabs>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="all" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                  {Description.map((item, index) => (
                    <PlatformCard key={item.name} item={item} index={index} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="metatraders" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                  {Description.filter((item) => item.category === "metatraders").map((item, index) => (
                    <PlatformCard key={item.name} item={item} index={index} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="zuperior" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                  {Description.filter((item) => item.category === "zuperior").map((item, index) => (
                    <PlatformCard key={item.name} item={item} index={index} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
