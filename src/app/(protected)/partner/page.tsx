"use client";

import Image from "next/image";
// import mobileInHand from "@/assets/deposit/mobile-in-hand.png";
import broker from "@/assets/broker.png";
import { TextAnimate } from "@/components/ui/text-animate";
import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";
import { IBApplicationModal } from "@/components/partner/IBApplicationModal";
// import affiliate from "@/assets/affiliate.png";

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

        {/* Bonus Section */}
        {/* <div
            className="mt-4 flex items-center justify-between 
            rounded-lg bg-white dark:bg-black border dark:border-gray-800 p-2 px-20 overflow-hidden
          "
          >
            <h3 className="text-2xl font-normal dark:text-white/75">
              Trade with <span className="text-[#A35CA2]">10%</span> deposit
              bonus
            </h3>
            <Image
              src={mobileInHand}
              alt="Mobile App"
              className="object-contain w-[90px] h-[120px]"
            />
          </div> */}
      </main>
    </div>
  );
}


const IBCard = () => {
  const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [loading, setLoading] = useState(true);
  const API_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000").replace(/\/api$/, "");

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/ib-request/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStatus(response.data.data.status);
      }
    } catch (error) {
      console.error("Failed to fetch IB status", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

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
            Earn up to 40% of our revenue from every active trader you refer.
          </p>
          <div className="  h-px w-full mb-4 bg-gradient-to-r from-transparent to-transparent via-[#9985cc] dark:via-[#413555]" />
          <p className="dark:text-white/75 text-black text-[15px]">
            Your earnings grow as they trade — straightforward and rewarding!
          </p>
        </div>

        {/* Apply Button / Status */}
        <div className="mt-8 z-10">
          {loading ? (
            <div className="px-5 py-2 rounded-xl border border-transparent text-gray-400">
              Checking status...
            </div>
          ) : status === 'approved' ? (
            <Link
              href="https://partner.zuperior.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 dark:bg-[#0E0511] bg-white border-2 border-emerald-500/50 hover:bg-emerald-500/10 rounded-xl text-emerald-500 font-medium transition-colors"
            >
              Login to IB Portal
            </Link>
          ) : status === 'pending' ? (
            <div className="flex flex-col items-center gap-2">
              <button
                disabled
                className="px-5 py-2 bg-gray-100 dark:bg-[#1a120b] border-2 border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 font-medium cursor-not-allowed"
              >
                Applied
              </button>
              <span className="text-yellow-500 text-sm font-medium animate-pulse">
                Request Is Pending
              </span>
            </div>
          ) : (
            <IBApplicationModal
              onSuccess={() => fetchStatus()}
              trigger={
                <button
                  className="px-5 py-2 dark:bg-[#0E0511] bg-white border-2 border-[#aa97d2] dark:border-[#413555] rounded-xl dark:text-white/75 text-black hover:scale-105 transition-transform"
                >
                  {status === 'rejected' ? 'Re-Apply Now' : 'Apply Now'}
                </button>
              }
            />
          )}
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
