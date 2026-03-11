"use client";

// import { motion, AnimatePresence } from "framer-motion";
// import { useTheme } from "next-themes";
import WalletBalance from "./wallet-balance";
import ForexAdBanner from "./forexAdBanner";

interface BalanceSectionProps {
  balance: string | number;
}

export function BalanceSection({ balance }: BalanceSectionProps) {
  // const { theme } = useTheme();

  return (
    // <div className="flex flex-col w-full gap-2.5">
    //   <AnimatePresence mode="wait">
    //     <motion.h2
    //       key={theme} // re-triggers animation when theme changes
    //       initial={{ opacity: 0, y: 10 }} // start below
    //       animate={{ opacity: 1, y: 0 }} // slide into place
    //       transition={{ ease: "easeInOut" }}
    //       className="text-xl sm:text-2xl font-bold text-black/85 dark:text-white/85 tracking-tighter">
    //       {/* Balancesssss */}
    //     </motion.h2>
    //   </AnimatePresence>

      <div className="flex w-full flex-col lg:flex-row gap-2.5 items-stretch">
        <div className="w-full lg:w-[30%] grow">
          <WalletBalance balance={balance} />
        </div>
        <div className="w-full lg:w-[70%] lg:max-w-200">
          <ForexAdBanner />
        </div>
      </div>
    // </div>
  );
}
