"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import VerificationAlert from "@/components/verification-alert";
import Profile from "./_components/profile";
import VerificationProfile from "./_components/VerificationProfile";
import SecurityTab from "./_components/SecurityTab";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { TextAnimate } from "@/components/ui/text-animate";
import { useAppSelector } from "@/store/hooks";
import { fetchUserProfile } from "@/services/userService";
import type { UserProfile } from "@/types/user-profile";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verificationStatus = useAppSelector(
    (state) => state.kyc.verificationStatus
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);

  const profileDisplayName = useMemo(() => {
    if (!profile) return undefined;
    if (profile.name && profile.name.trim().length > 0) {
      return profile.name.trim();
    }
    const nameFromParts = [profile.firstName, profile.lastName]
      .filter((part): part is string => !!part && part.trim().length > 0)
      .join(" ")
      .trim();
    return nameFromParts || undefined;
  }, [profile]);

  const [activeTab, setActiveTab] = useState<
    "profile" | "verification" | "security" | "bank" | "subscriptions"
  >("profile");

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("userToken")
          : null;

      if (!token) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      const response = await fetchUserProfile();
      if (response?.success) {
        setProfile(response.data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      ["profile", "verification", "security", "bank", "subscriptions"].includes(
        tab
      )
    ) {
      setActiveTab(tab as typeof activeTab);
    }
  }, [searchParams]);

  const handleTabChange = useCallback(
    (value: string | undefined) => {
      if (
        value &&
        [
          "profile",
          "verification",
          "security",
          "bank",
          "subscriptions",
        ].includes(value)
      ) {
        router.replace(`/settings?tab=${value}`, { scroll: false });
        setActiveTab(value as typeof activeTab);
      }
    },
    [router]
  );

  const tabs = useMemo(
    () => [
      { value: "profile", label: "Profile" },
      { value: "verification", label: "Verification" },
      { value: "security", label: "Security" },
      // { value: "bank", label: "Bank Accounts" },
      // { value: "subscriptions", label: "My Subscriptions" },
    ],
    []
  );

  const renderContent = useMemo(() => {
    switch (activeTab) {
      case "profile":
        return <Profile profile={profile} loading={profileLoading} onProfileRefresh={loadProfile} />;
      case "verification":
        return (
          <VerificationProfile
            fullName={profileDisplayName}
            verificationStatus={verificationStatus}
          />
        );
      case "security":
        return <SecurityTab email={profile?.email ?? ""} />;
      // Uncomment and add your real components later:
      // case "bank":
      //   return <div>Bank Accounts Content Coming Soon</div>;
      // case "subscriptions":
      //   return <div>My Subscriptions Content Coming Soon</div>;
      default:
        return <Profile profile={profile} loading={profileLoading} />;
    }
  }, [
    activeTab,
    profile,
    profileLoading,
    profileDisplayName,
    verificationStatus,
  ]);

  return (
    <>
      <VerificationAlert
        name={profile?.firstName || profileDisplayName || "User"}
        verificationStatus={verificationStatus}
      />

      <div className="mt-6 mb-4 flex px-2.5 md:px-0">
        <TextAnimate className="text-[34px] tracking-[-0.05em] leading-[44px] font-semibold text-[#000] dark:text-white/85">
          Profile Settings
        </TextAnimate>
      </div>

      <div className="px-2.5 md:px-0">
        <div className="mb-4 max-w-[750px] rounded-xl border border-dashed border-gray-400 dark:border-white/10 md:px-3 px-1 lg:px-4 ">
          <div className="my-3">
            <ToggleGroup
              type="single"
              value={activeTab}
              onValueChange={handleTabChange}
              className="relative gap-1 rounded-[15px] border border-white/10 bg-white dark:bg-black/10 p-2 dark:border-[#0F121A]">
              {tabs.map((tab) => (
                <ToggleGroupItem
                  key={tab.value}
                  value={tab.value}
                  className="z-10 cursor-pointer rounded-[12px] px-[24px] py-[9px] text-[12px] font-semibold leading-[14px] text-white/50 transition-all duration-200 
             data-[state=on]:bg-[#9F8BCF]/15
data-[state=on]:text-black
dark:data-[state=on]:bg-gradient-to-r 
dark:data-[state=on]:from-[#1E1429] 
dark:data-[state=on]:to-[#311B47]/95
dark:data-[state=on]:text-white">
                  {tab.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <div className="w-full mt-2">{renderContent}</div>
          </div>
        </div>
      </div>
    </>
  );
}
