"use client";

import tick from "@/assets/icons/tick.png";
import userImage from "@/assets/icons/user.png";
import userImageDark from "@/assets/icons/userDark.png";
import Image from "next/image";
import { useTheme } from "next-themes";
import { TextAnimate } from "@/components/ui/text-animate";
import { CopyButton } from "@/components/CopyButton";
import { memo, useMemo, useCallback, useState } from "react";
import type { ReactNode } from "react";
import { EmailVerificationDialog } from "./EmailVerificationDialog";
import { useAppSelector } from "@/store/hooks";
import type { UserProfile } from "@/types/user-profile";

interface ProfileComponentProps {
  profile: UserProfile | null;
  loading: boolean;
  onProfileRefresh?: () => void;
}

function ProfileComponent({ profile, loading, onProfileRefresh }: ProfileComponentProps) {
  const { passwordMask } = useAppSelector((state) => state.auth);
  const { theme } = useTheme();
  const [verifyDialogOpen, setVerifyDialogOpen] = useState<boolean>(false);

  const handleEmailVerified = () => {
    // Refresh profile after email verification
    if (onProfileRefresh) {
      onProfileRefresh();
    }
  };

  const formatPhoneNumber = useCallback((phone: string) => {
    if (!phone) return "";
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length === 12) {
      return `+${digitsOnly.substring(0, 2)} ${digitsOnly.substring(2)}`;
    }
    return phone;
  }, []);

  const userDetails = useMemo(() => {
    const fallbackName = profile?.name ?? "";
    const firstName =
      profile?.firstName ?? fallbackName.split(" ")[0] ?? "";
    const lastName =
      profile?.lastName ?? fallbackName.split(" ").slice(1).join(" ") ?? "";
    const phone = formatPhoneNumber(profile?.phone || "");

    const emailValue: ReactNode = profile?.email ? (
      <div key="email" className="flex items-center gap-2 flex-wrap">
        <span>{profile.email}</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center opacity-80">
            <Image
              className="h-4 w-4"
              src={tick}
              alt="Verification status"
              width={16}
              height={16}
            />
            <span
              className={`text-xs ml-1 font-medium ${
                profile.emailVerified
                  ? "text-green-600 dark:text-green-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {profile.emailVerified ? "Verified" : "Not Verified"}
            </span>
          </div>
          {!profile.emailVerified && (
            <button
              type="button"
              onClick={() => setVerifyDialogOpen(true)}
              className="text-xs px-3 py-1 rounded-md bg-[#fac573] hover:bg-[#f5b85a] text-black font-medium transition-colors"
            >
              Verify Now
            </button>
          )}
        </div>
      </div>
    ) : null;

    return [
      ["First Name", firstName.trim() || null],
      ["Last Name", lastName.trim() || null],
      ["Email", emailValue],
      ["Phone No.", phone.trim() || null],
      ["Password", passwordMask || null],
      ["Language", "English"],
      ["Country of Residence", profile?.country?.trim() || null],
      ["Time Region", "Asia"],
    ];
  }, [profile, passwordMask, formatPhoneNumber]);

  const resolveValue = useCallback(
    (value: ReactNode | null) => {
      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      ) {
        return loading ? (
          <span className="opacity-70">Loading...</span>
        ) : (
          "Not provided"
        );
      }
      return value;
    },
    [loading]
  );

  const displayName =
    profile?.name ||
    (profile?.firstName
      ? `${profile.firstName} ${profile.lastName ?? ""}`.trim()
      : null);
  const userId = profile?.clientId || profile?.id || "";

  return (
    <div className="dark:bg-[#01040D] dark:text-[#FFFFFF] text-[#000000]">
      <div className="flex rounded-xl mb-4 items-center justify-between bg-white dark:bg-gradient-to-r from-[#FFFFFF] dark:from-[#110F17] to-[#f4e7f6] dark:to-[#1E1429] border-2 dark:border-[#1D1825] border-gray-300">
        <div className="py-6 px-8 flex items-center w-full">
          <div className="rounded-full flex items-center justify-center mr-4">
            <Image
              className="dark:h-16 w-full h-full dark:w-16"
              src={theme === "dark" ? userImage : userImageDark}
              alt="User profile"
              width={64}
              height={64}
            />
          </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {displayName && (
                      <TextAnimate className="text-2xl font-semibold">
                        {displayName}
                      </TextAnimate>
                    )}
                  </div>       
                </div>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-3 w-full mb-4">
        {userDetails.map(([label, value], index) => {
          const resolved = resolveValue(value);
          return (
            <div
              key={index}
              className="flex justify-between items-center border-b-2 border-gray-300 dark:border-[#090B17] pb-2 last:border-b-0"
            >
              <span className="dark:text-white/75 text-[13px] font-semibold leading-[18px] tracking-[-0.02em] text-gray-800">
                {label}
              </span>
              <div className="flex items-center gap-2 dark:text-white/75 text-[13px] font-semibold leading-[18px] tracking-[-0.02em] text-gray-800">
                {typeof resolved === "string" ? <span>{resolved}</span> : resolved}
              </div>
            </div>
          );
        })}
      </section>

      <EmailVerificationDialog
        open={verifyDialogOpen}
        onOpenChange={setVerifyDialogOpen}
        email={profile?.email ?? ""}
        onVerified={handleEmailVerified}
      />
    </div>
  );
}

export default memo(ProfileComponent);
