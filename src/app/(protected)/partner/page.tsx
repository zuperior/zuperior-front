"use client";

import Image from "next/image";
import broker from "@/assets/broker.png";
import { TextAnimate } from "@/components/ui/text-animate";
import Link from "next/link";

export default function PartnerPage() {
  return (
    <div className="flex flex-col dark:bg-[#01040D] px-2.5 md:px-0">
      <main className="flex-1 overflow-y-auto">
        {/* Heading */}
        <TextAnimate
          as={"h1"}
          animation="slideUp"
          className="text-[34px] tracking[0.5] leading-[30px] font-semibold dark:text-white/75 text-black"
        >
          Zuperior Partnership Program
        </TextAnimate>

        {/* Cards */}
        <div className="mt-8">
          <IBCard />
        </div>
      </main>
    </div>
  );
}


const IBCard = () => {
  return (
    <div className="group relative h-[400px] w-full rounded-lg border bg-gradient-to-br  from-white  dark:from-black dark:to-[#18091E] p-6 overflow-hidden">
      <div className="flex flex-col items-center justify-center h-full text-center">
        {/* Title */}
        <div className="flex items-center mb-6">
          <Image src={broker} alt="IB Program" className="h-8 w-8 mr-2 mt-2" />
          <h3 className="mt-2 text-3xl font-medium dark:text-white/75 text-black">
            Introducing Broker (IB)
          </h3>
        </div>

        {/* Description */}
        <div className="mx-auto w-[250px] text-sm text-zinc-400">
          <p className="mb-4 dark:text-white/75 text-black text-[15px]">
            Earn upto 40% of our revenue on every traders activity you refer
          </p>
          <div className="  h-px w-full mb-4 bg-gradient-to-r from-transparent to-transparent via-[#9985cc] dark:via-[#413555]" />
          <p className="dark:text-white/75 text-black text-[15px]">
            With fast daily payouts and a fully transparent no surprises commission structure
          </p>
        </div>

        {/* Partner's Portal Button */}
        <div className="mt-8 z-10">
          <Link
            href="https://partner.zuperior.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 dark:bg-[#0E0511] bg-white border-2 border-[#aa97d2] dark:border-[#413555] rounded-xl dark:text-white/75 text-black hover:scale-105 transition-transform"
          >
            Launch IB Portal
          </Link>
        </div>
      </div>

      {/* Hover border glow */}
      <div
        className="absolute inset-0 rounded-lg border-2 border-transparent opacity-0 transition-opacity duration-200
        group-hover:opacity-100 group-hover:border-[#8046c9]/25"
      />
    </div>
  );
};
