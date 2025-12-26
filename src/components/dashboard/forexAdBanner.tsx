import Image from "next/image";
import React from "react";
import bitcoinLoop from "@/assets/home/bitcoin-loop.png";

const ForexAdBanner = () => {
  const maskStyle = {
    WebkitMaskImage:
      "linear-gradient(130deg, rgba(255, 255, 255, 0.1) 10%, rgba(255, 255, 255, 0.25) 100%)",
    maskImage:
      "linear-gradient(130deg, rgba(255, 255, 255, 0.1) 10%, rgba(255, 255, 255, 0.25) 100%)",
    borderRadius: "15px",
    opacity: 0.85,
    inset: 0,
    overflow: "visible",
    position: "absolute",
    zIndex: 0,
  };

  return (
    <div className="relative overflow-hidden w-full rounded-[15px] dark:bg-black bg-[#FBFAFC]  p-6 md:p-[50px] text-black dark:text-white flex-1">
      <h2 className="text-[24px] md:text-[34px] font-medium tracking-tighter leading-9 capitalize z-10 bg-gradient-to-t from-[rgba(0,0,0,0.15)] to-[rgba(98,66,165,1)] text-transparent bg-clip-text dark:text-[#a14da0] ">
        <span className="dark:text-white">
          Your Premium Forex <br></br>Broker
        </span>
      </h2>


      <div className="absolute -top-10 -right-10 md:-top-16 md:-right-20 translate-y-1/4 pointer-events-none">
        <Image
          alt="Bitcoin loop"
          src={bitcoinLoop}
          className="slow-spin h-42 w-42 md:h-60 md:w-60"
        />
      </div>

      <div
        style={maskStyle as React.CSSProperties}
        className="border border-black/50 dark:border-white/75 pointer-events-none"
      />
    </div>
  );
};

export default ForexAdBanner;
