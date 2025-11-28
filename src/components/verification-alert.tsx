import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Warning from "@/assets/icons/warning.png";
import LearnMoreDialogBox from "@/components/learnmore-dialogbox";

export default function VerificationAlert({
  name,
  verificationStatus,
}: {
  name?: string;
  verificationStatus?: "unverified" | "partial" | "verified";
}) {
  const [isVisible] = useState(true);
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);

  const maskStyle = {
    WebkitMaskImage:
      "linear-gradient(277deg, rgba(255, 255, 255, 0.1) 10%, rgba(255, 255, 255, 0.5) 100%)",
    maskImage:
      "linear-gradient(277deg, rgba(255, 255, 255, 0.1) 10%, rgba(255, 255, 255, 0.5) 100%)",
    borderRadius: "15px",
    opacity: 0.3,
    inset: 0,
    overflow: "visible",
    position: "absolute",
    zIndex: 0,
  };

  if (!isVisible || verificationStatus === "verified") {
    return null;
  }

  const messages = {
    unverified: {
      title: "Verification Needed",
      message: `${name || "Hi"}, please confirm your identity to make your first deposit.`,
      cta: "Verify Now",
    },
    partial: {
      title: "Verification Incomplete",
      message: `${name || "Hi"
        }, your verification is partially complete. Please finish the process to unlock all features.`,
      cta: "Verify Now",
    },
  };

  const { title, message, cta } = messages[verificationStatus || "unverified"];

  return (
    <div className="px-2.5 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 bg-white dark:bg-gradient-to-l dark:to-[#110F17] dark:from-[#1E1429] text-black dark:text-white p-[15px] rounded-[15px] w-full relative">

        {/* Left content */}
        <div className="flex items-start md:items-center gap-[15px] z-10">
          <div className="bg-linear-210 from-[#311B47] to-[#141118] p-2.5 rounded-full shrink-0">
            <Image
              className="pointer-events-none"
              src={Warning}
              alt="warning"
              height={18}
              width={18}
            />
          </div>
          <div>
            <h2 className="text-sm font-bold text-black/75 dark:text-white/75 leading-4 -tracking-[0.02em]">
              {title}
            </h2>
            <p className="text-xs font-semibold text-black/50 dark:text-white/50 mt-[5px]">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-center sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 z-20 relative">
          <button
            className="text-black/50 dark:text-white/50 cursor-pointer text-xs leading-[14px] font-semibold py-2 px-[15px] border border-[#9F8BCF]/25 rounded-[10px] bg-transparent w-[120px] sm:w-auto"
            onClick={() => setLearnMoreOpen(true)}
          >
            Learn More
          </button>
          {cta && (
            <Link
              href="/kyc"
              className="bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9] font-semibold text-xs leading-[14px] px-6 py-2 rounded-[10px] transition-colors text-center w-[120px] sm:w-auto"
            >
              {cta}
            </Link>
          )}
        </div>


        {/* Gradient mask */}
        <div
          style={maskStyle as React.CSSProperties}
          className="border-2 border-black/25 dark:border-white/25 pointer-events-none"
        />
      </div>
      <LearnMoreDialogBox open={learnMoreOpen} onOpenChange={setLearnMoreOpen} />
    </div>
  );
}
