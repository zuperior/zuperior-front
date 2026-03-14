"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, ArrowUpRight, EyeOff, TrendingUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

const WalletBalance = ({ balance }: { balance: string | number }) => {
  const [showBalance, setShowBalance] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletNumber, setWalletNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch wallet balance from API
  const fetchWalletBalance = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      const response = await fetch('/api/wallet', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      });
      const data = await response.json();
      const bal = Number(data?.data?.balance ?? data?.balance ?? 0);
      const wNum = data?.data?.walletNumber ?? data?.walletNumber ?? "";
      if (!Number.isNaN(bal)) {
        setWalletBalance(bal);
      }
      setWalletNumber(wNum);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      setIsLoading(false);
    }
  };

  // Fetch wallet balance on mount and set up refresh
  useEffect(() => {
    fetchWalletBalance();

    // Set up polling every 15 seconds
    const intervalId = setInterval(() => {
      fetchWalletBalance();
    }, 15001);

    // Listen for wallet refresh events
    const handleWalletRefresh = (e: Event) => {
      const customEvent = e as CustomEvent;
      const balance = customEvent?.detail?.balance;
      if (typeof balance === 'number' && !Number.isNaN(balance)) {
        setWalletBalance(balance);
      } else {
        fetchWalletBalance();
      }
    };

    window.addEventListener('wallet:refresh', handleWalletRefresh as EventListener);

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchWalletBalance();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('wallet:refresh', handleWalletRefresh as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const parseAndFormatBalance = (
    balance: string | number
  ): { whole: string; decimal: string } => {
    const cleaned = String(balance).replace(/[^0-9.-]+/g, "");
    const number = Number(cleaned);
    const formatted = number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const [whole, decimal] = formatted.split(".");
    return { whole, decimal };
  };

  // Use walletBalance from API instead of prop
  const { whole, decimal } = parseAndFormatBalance(walletBalance);
  const { theme } = useTheme();

  const arrowMaskStyle = {
    WebkitMaskImage:
      "linear-gradient(299deg, rgba(255, 255, 255, 0) 10%, rgba(255, 255, 255, 0.5) 100%)",
    maskImage:
      "linear-gradient(299deg, rgba(255, 255, 255, 0) 10%, rgba(255, 255, 255, 0.5) 100%)",
    borderRadius: "100px",
    opacity: 1,
    inset: 0,
    overflow: "visible",
    position: "absolute",
    zIndex: 0,
  };

  const cardMaskStyle = {
    WebkitMaskImage:
      "linear-gradient(130deg, rgba(255, 255, 255, 0) 10%, rgba(255, 255, 255, 0.25) 100%)",
    maskImage:
      "linear-gradient(130deg, rgba(255, 255, 255, 0) 10%, rgba(255, 255, 255, 0.25) 100%)",
    borderRadius: "15px",
    opacity: 0.85,
    inset: 0,
    overflow: "visible",
    position: "absolute",
    zIndex: 0,
  };

  return (
    <div
      className="relative w-full h-auto md:h-full text-white rounded-[15px] overflow-hidden xl:pt-6 xl:pr-[30px] xl:pb-[25px] xl:pl-[40px] lg:p-5 p-6 bg-[radial-gradient(124.93%_167.38%_at_0.33%_1.53%,#A35CA2_0%,#000000_34.5%,#000000_100%)]"
    >
      <FloatingDots />
      <div
        style={cardMaskStyle as React.CSSProperties}
        className="border border-black dark:border-white/75 pointer-events-none"
      />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-white/75 font-semibold tracking-tighter leading-[1.1em]">
            {walletNumber ? `Wallet ID: ${walletNumber}` : "Wallet Balance"}
          </p>
          <button onClick={() => setShowBalance(!showBalance)}>
            {showBalance ? (
              <Eye size={12} className="text-white/75 cursor-pointer" />
            ) : (
              <EyeOff size={12} className="text-white/75 cursor-pointer" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-white/75">
          {" "}
          {/* To Do: Replace it with dropdown menu */}
          <p className="text-sm font-semibold tracking-tighter leading-[1.1em]">
            USD
          </p>
          <ChevronDown size={14} className="text-white/75" />
        </div>
      </div>
      <div className="mt-2.5 relative overflow-hidden h-10 sm:h-12 text-white">
        <AnimatePresence mode="wait">
          {showBalance ? (
            <motion.div
              key="wallet-visible"
              className="flex text-3xl sm:text-[42px] tracking-tighter leading-tight sm:leading-[46px] font-bold"
              initial={{ opacity: 0, x: -10 }}
              exit={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
                delay: 0.05,
              }}
            >
              <span>${whole}</span>
              <span className="text-lg sm:text-[26px] text-white/75 leading-normal mt-auto">
                .{decimal}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="wallet-hidden"
              initial={{ opacity: 0, x: 10 }}
              exit={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
                delay: 0,
              }}
              className="flex text-3xl sm:text-[42px] leading-tight sm:leading-[46px] font-bold"
            >
              ****
              <span className="text-lg sm:text-[26px] text-white/75 leading-normal mb-auto ml-px tracking-tighter">
                **
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Last Month Info */}
      <div className="mt-[15px] flex justify-between items-center w-full">
        <div className="flex flex-col items-start">
          <p className="text-sm text-white/75 font-semibold leading-[1.1em] -tracking-[0.03em]"></p>
          {/* <p className="text-sm text-white/75 font-semibold leading-[1.1em] -tracking-[0.03em]">Last Month</p> */}

          {/* <p className="text-[13px] tracking-tighter leading-[1.1em] flex mt-1.5 items-center gap-1.5 text-[#BBFCA2]/75 font-bold ">
            <TrendingUp size={16} className="text-[#8CBD79]" />
            <span className="text-[#8CBD79]">+0.00 (+0%)</span>
          </p> */}
        </div>
        <Link
          href="/deposit"
          className="relative size-9 flex items-center justify-center rounded-full group"
        >
          <ArrowUpRight
            size={18}
            className="text-white z-10 group-hover:rotate-45 transition-all duration-300"
          />
          {/* <div style={arrowMaskStyle as React.CSSProperties} className="border border-white pointer-events-none" /> */}

          {theme === "dark" ? (
            <div
              style={arrowMaskStyle as React.CSSProperties}
              className="border dark:border-white border-black pointer-events-none"
            />
          ) : (
            <div
              style={
                {
                  borderRadius: "50%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 0,
                  pointerEvents: "none",
                } as React.CSSProperties
              }
              className="border border-[#222222]/75"
            />
          )}
        </Link>
      </div>
    </div>
  );
};
export default WalletBalance;

export function FloatingDots({ dotCount = 36 }: { dotCount?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let dots: Array<{
      x: number;
      y: number;
      r: number;
      alpha: number;
      dy: number; // Only vertical movement
    }> = [];

    const initDots = () => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      dots = Array.from({ length: dotCount }).map(() => ({
        x: Math.random() * width, // Random X position
        y: -Math.random() * height * 0.5, // Start above the view (top)
        r: 0.1 + Math.random() * 1.2, // Random radius
        alpha: 0.2 + Math.random() * 0.2, // Random opacity
        dy: 0.1 + Math.random() * 0.5, // Downward speed (no horizontal drift)
      }));
    };

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const animate = () => {
      const container = containerRef.current;
      if (!container || !canvas || !ctx) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      ctx.clearRect(0, 0, width, height);

      for (const dot of dots) {
        // Only move downward (no horizontal movement)
        dot.y += dot.dy;

        // Reset to top if past the bottom
        if (dot.y - dot.r > height) {
          dot.y = -dot.r;
          dot.x = Math.random() * width; // New random X position
        }

        // Draw the dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.alpha})`;
        ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize
    initDots();
    resizeCanvas();
    animate();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      initDots();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [dotCount]);

  return (
    <div
      ref={containerRef}
      className="absolute right-0 w-32 h-full pointer-events-none z-0 rounded-r-[15px]"
    >
      <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />
    </div>
  );
}
