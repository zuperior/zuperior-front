"use client";

import type React from "react";
import type { JSX } from "react";
import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image, { StaticImageData } from "next/image";

import desktop from "@/assets/desktop.avif";
import mobile from "@/assets/mobile.avif";
import mobile2 from "@/assets/mobile2.avif";
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
      image: mobile,
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
      links: [
        {
          label: "Ios",
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
    <div className="absolute inset-0 z-[1] flex items-center justify-center">
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
        className="w-[600px] h-[600px] p-10 rounded-full"
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
    const terminalUrl = `${terminalBaseUrl}/login?token=${encodeURIComponent(token)}&clientId=${encodeURIComponent(clientId)}&autoLogin=true`;
    window.open(terminalUrl, '_blank');
  };

  // Platform Card (reused)
  const PlatformCard = memo(({ item, index }: PlatformCardProps) => (
    <div className="flex flex-col gap-5">
      <div className="relative w-full h-[280px] sm:h-[300px] md:h-[325px] rounded-[15px] shadow-md overflow-hidden flex items-center justify-center">
        <div className="relative z-[2] w-full h-full p-px">
          {(index === 1 || index === 3) && <SpinningBorder />}
          <Image
            src={item.image}
            alt={item.name}
            width={348}
            height={325}
            className="w-full h-full object-cover rounded-xl relative z-[2]"
            loading={index === 0 ? "eager" : "lazy"}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
              className="rounded-[10px] text-center py-2 px-4 text-white dark:bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-xs leading-[14px] cursor-pointer [background:radial-gradient(ellipse_27%_80%_at_0%_0%,rgba(163,92,162,0.5),rgba(0,0,0,1))] hover:bg-transparent flex items-center justify-center gap-1"
            >
              <span>Open Web Terminal</span>
            </button>
            <p className="text-xs text-black/60 dark:text-white/60 text-align justify-center px-0 py-0 tracking-wide">
              Click to open the web trading terminal
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full max-w-[100px]">
            <div className="flex gap-2">
              {item.links?.slice(0, 2).map((link, i) => (
                <Link
                  key={`${item.name}-btn-${i}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-[10px] text-center py-2 px-4 text-white dark:bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-xs leading-[14px] cursor-pointer [background:radial-gradient(ellipse_27%_80%_at_0%_0%,rgba(163,92,162,0.5),rgba(0,0,0,1))] hover:bg-transparent flex items-center justify-center gap-1"
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
          <div className="pt-7 space-y-4 px-4 md:px-6">
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList 
                  className="relative bg-[rgba(20,20,26,0.25)] border-0 rounded-[15px] p-1.5 inline-flex h-auto gap-2"
                  style={{
                    backgroundColor: "rgba(20, 20, 26, 0.25)",
                    borderRadius: "15px",
                  }}
                >
                  <TabsTrigger 
                    value="all" 
                    className="relative rounded-[10px] px-4 py-2 text-sm font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#311B47] data-[state=active]:to-[#1C061C] data-[state=inactive]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-white/75 transition-colors overflow-hidden"
                    style={{
                      borderRadius: "10px",
                      position: "relative",
                    }}
                  >
                    {activeTab === "all" && (
                      <div
                        data-border="true"
                        style={{
                          "--border-bottom-width": "1px",
                          "--border-color": "rgba(255, 255, 255, 0.75)",
                          "--border-left-width": "1px",
                          "--border-right-width": "1px",
                          "--border-style": "solid",
                          "--border-top-width": "1px",
                          mask: "linear-gradient(100deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%)",
                          WebkitMask: "linear-gradient(100deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%)",
                          borderBottomWidth: "var(--border-bottom-width)",
                          borderColor: "var(--border-color)",
                          borderLeftWidth: "var(--border-left-width)",
                          borderRightWidth: "var(--border-right-width)",
                          borderStyle: "var(--border-style)",
                          borderTopWidth: "var(--border-top-width)",
                          borderRadius: "15px",
                          opacity: 0.25,
                          zIndex: 1,
                          position: "absolute",
                          inset: 0,
                          overflow: "visible",
                          flex: "none",
                          pointerEvents: "none",
                        } as React.CSSProperties}
                      />
                    )}
                    <span className="relative z-10">All</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="metatraders" 
                    className="relative rounded-[10px] px-4 py-2 text-sm font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#311B47] data-[state=active]:to-[#1C061C] data-[state=inactive]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-white/75 transition-colors overflow-hidden"
                    style={{
                      borderRadius: "10px",
                      position: "relative",
                    }}
                  >
                    {activeTab === "metatraders" && (
                      <div
                        data-border="true"
                        style={{
                          "--border-bottom-width": "1px",
                          "--border-color": "rgba(255, 255, 255, 0.75)",
                          "--border-left-width": "1px",
                          "--border-right-width": "1px",
                          "--border-style": "solid",
                          "--border-top-width": "1px",
                          mask: "linear-gradient(100deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%)",
                          WebkitMask: "linear-gradient(100deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%)",
                          borderBottomWidth: "var(--border-bottom-width)",
                          borderColor: "var(--border-color)",
                          borderLeftWidth: "var(--border-left-width)",
                          borderRightWidth: "var(--border-right-width)",
                          borderStyle: "var(--border-style)",
                          borderTopWidth: "var(--border-top-width)",
                          borderRadius: "15px",
                          opacity: 0.25,
                          zIndex: 1,
                          position: "absolute",
                          inset: 0,
                          overflow: "visible",
                          flex: "none",
                          pointerEvents: "none",
                        } as React.CSSProperties}
                      />
                    )}
                    <span className="relative z-10">MT5</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="zuperior" 
                    className="relative rounded-[10px] px-4 py-2 text-sm font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#311B47] data-[state=active]:to-[#1C061C] data-[state=inactive]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-white/75 transition-colors overflow-hidden"
                    style={{
                      borderRadius: "10px",
                      position: "relative",
                    }}
                  >
                    {activeTab === "zuperior" && (
                      <div
                        data-border="true"
                        style={{
                          "--border-bottom-width": "1px",
                          "--border-color": "rgba(255, 255, 255, 0.75)",
                          "--border-left-width": "1px",
                          "--border-right-width": "1px",
                          "--border-style": "solid",
                          "--border-top-width": "1px",
                          mask: "linear-gradient(100deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%)",
                          WebkitMask: "linear-gradient(100deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%)",
                          borderBottomWidth: "var(--border-bottom-width)",
                          borderColor: "var(--border-color)",
                          borderLeftWidth: "var(--border-left-width)",
                          borderRightWidth: "var(--border-right-width)",
                          borderStyle: "var(--border-style)",
                          borderTopWidth: "var(--border-top-width)",
                          borderRadius: "15px",
                          opacity: 0.25,
                          zIndex: 1,
                          position: "absolute",
                          inset: 0,
                          overflow: "visible",
                          flex: "none",
                          pointerEvents: "none",
                        } as React.CSSProperties}
                      />
                    )}
                    <span className="relative z-10">Zuperior</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="all" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                  {Description.map((item, index) => (
                    <PlatformCard key={item.name} item={item} index={index} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="metatraders" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                  {Description.filter((item) => item.category === "metatraders").map((item, index) => (
                    <PlatformCard key={item.name} item={item} index={index} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="zuperior" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
