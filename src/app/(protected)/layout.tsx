"use client";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useEffect, useState } from "react";
import { fetchKycStatus } from "@/store/slices/kycSlice";
import { useSessionCheck } from "@/hooks/useSessionCheck";
import { getUser } from "@/store/slices/getUserSlice";


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
      dispatch(fetchKycStatus(false)).catch((error) => {
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
          <main className="flex-1 overflow-y-auto pb-0">
            <div className="lg:px-8 md:px-4 px-1 py-6">{children}</div>
          </main>

        </div>
      </div>
    </div>
  );
}
