"use client";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useEffect, useState } from "react";
import { fetchKycStatus } from "@/store/slices/kycSlice";
import { useSessionCheck } from "@/hooks/useSessionCheck";
import { getUser } from "@/store/slices/getUserSlice";
import Image from "next/image";
import { FloatingDots } from "@/components/ui/floating-dots";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userData = useAppSelector((state) => state.user.data);

  const [authChecked, setAuthChecked] = useState(false);
  const [userFetched, setUserFetched] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Enable session checking (WebSocket + polling) for account deletion
  useSessionCheck();

  useEffect(() => {
    // Check authentication using localStorage
    const token = localStorage.getItem('userToken');
    const clientId = localStorage.getItem('clientId');
    const storedUser = localStorage.getItem('user');

    if (!token || !clientId) {
      router.push("/login");
    } else {
      setAuthChecked(true); // Mark auth as confirmed

      // Load user data from localStorage first if available and not yet fetched
      if (storedUser && !userData && !userFetched) {
        try {
          const userObj = JSON.parse(storedUser);
          // If we have email and token, fetch fresh user data from API
          if (userObj.email) {
            setUserFetched(true); // Mark as fetched to prevent re-fetching
            dispatch(getUser({ email: userObj.email, access_token: token }))
              .catch((error) => {
                console.error("Failed to fetch user data:", error);
                setUserFetched(false); // Allow retry on error
              });
          }
        } catch (error) {
          console.error("Failed to parse stored user:", error);
        }
      }

      // Fetch KYC status from database (non-blocking)
      // Status should already be loaded during login, but refresh in background
      dispatch(fetchKycStatus()).catch((error) => {
        console.error("Failed to load KYC status:", error);
        // Continue even if KYC fetch fails - don't block the app
      });
    }
  }, [router, dispatch, userData, userFetched]);


  // Don't render layout until auth is confirmed
  if (!authChecked) return null;

  return (
    <div className="flex h-screen flex-col bg-[linear-gradient(180deg,#F7F5FC_0%,#F2EDFF_100%)] dark:bg-[#01040D]">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
        <div className="flex-1 flex flex-col overflow-hidden dark:bg-[#01040D]">
          <Navbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <main className="flex-1 overflow-y-auto pb-0 lg:pb-20">
            <div className="lg:px-8 md:px-4 px-1 py-6">{children}</div>
          </main>
          {/* Footer with Explore Zuper Learn - Hidden on mobile/responsive (< 1061px) */}
          <footer className="hidden lg:block fixed bottom-0 left-0 right-0 z-40 p-3 bg-white dark:bg-[#01040D] border-t border-gray-200 dark:border-[#1a2032]">
            <div className="flex justify-start">
              <Link
                href="https://zuperlearn.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="relative flex items-center gap-3 overflow-hidden rounded-xl h-14 dark:border border-gray-800 bg-gradient-to-r from-[#965795] to-[#070407] p-3 shadow-lg text-white transition-all duration-300 hover:border-fuchsia-400 hover:shadow-[0_0_0_2px_rgba(163,92,162,0.4)] hover:border-1">
                  <div className="absolute inset-0 bg-[radial-gradient(circle,#ffffff22_1px,transparent_1px)] bg-[length:10px_10px] opacity-20 rounded-2xl pointer-events-none"></div>
                  <FloatingDots dotCount={40} />
                  <div className="flex items-center space-x-2 z-20">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#FFFFFF] dark:bg-[#01040D] rounded-full relative ml-0.5">
                      <Image
                        className="w-4 h-4 object-contain"
                        src="/zuplearn-logo.png"
                        alt="Zuper Learn icon"
                        width={16}
                        height={16}
                        quality={100}
                        unoptimized
                      />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-white/80 whitespace-nowrap flex items-center">
                        Explore Zuper Learn
                        <ArrowRight size={14} className="ml-2 -rotate-45 transition-transform duration-300 group-hover:rotate-0" />
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
