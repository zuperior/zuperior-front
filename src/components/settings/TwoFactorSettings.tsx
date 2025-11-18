"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, ShieldCheck, ShieldOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface TwoFactorSettingsProps {
  email?: string;
}

export function TwoFactorSettings({ email }: TwoFactorSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);

  // Fetch 2FA status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/two-factor/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setEnabled(data.enabled || false);
      }
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    try {
      setToggling(true);
      const response = await fetch("/api/two-factor/enable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setEnabled(true);
        toast.success("Two-factor authentication enabled successfully");
      } else {
        toast.error(data.message || "Failed to enable two-factor authentication");
      }
    } catch (error: any) {
      console.error("Error enabling 2FA:", error);
      toast.error("Failed to enable two-factor authentication");
    } finally {
      setToggling(false);
    }
  };

  const handleDisable = async () => {
    try {
      setToggling(true);
      const response = await fetch("/api/two-factor/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setEnabled(false);
        setDisableDialogOpen(false);
        toast.success("Two-factor authentication disabled successfully");
      } else {
        toast.error(data.message || "Failed to disable two-factor authentication");
      }
    } catch (error: any) {
      console.error("Error disabling 2FA:", error);
      toast.error("Failed to disable two-factor authentication");
    } finally {
      setToggling(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    if (checked) {
      handleEnable();
    } else {
      setDisableDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#6242a5]" />
      </div>
    );
  }

  return (
    <>
      <section>
        <h2 className="text-[34px] font-semibold mb-1 dark:text-white/75 text-black">
          Two-Factor Authentication
        </h2>
        <p className="text-sm dark:text-white/75 text-black mb-4">
          Add an extra layer of security to your account. When enabled, you'll need to enter a verification code sent to your email each time you log in.
        </p>
        <div className="border dark:border-white/10 border-black/10 rounded-xl overflow-hidden dark:bg-[#191a22]">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              {enabled ? (
                <ShieldCheck className="h-6 w-6 text-green-500" />
              ) : (
                <ShieldOff className="h-6 w-6 text-gray-400" />
              )}
              <div>
                <div className="text-sm font-medium dark:text-white/75 text-black">
                  Email-based 2FA
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {enabled
                    ? "Two-factor authentication is enabled"
                    : "Two-factor authentication is disabled"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm dark:text-white/50 text-black/50">
                {enabled ? "Enabled" : "Disabled"}
              </span>
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={toggling}
                className="data-[state=checked]:bg-[#6242a5]"
              />
            </div>
          </div>
          {enabled && (
            <div className="px-5 pb-5">
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                <strong>Note:</strong> When logging in, you'll receive a 6-digit code via email that you must enter to complete authentication.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Disable Confirmation Dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent className="border-2 border-transparent p-6 text-black dark:text-white rounded-[18px] w-full max-w-md [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold dark:text-white/75 text-black mb-2">
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-sm dark:text-gray-400 text-gray-600 mb-4">
              Are you sure you want to disable two-factor authentication? This will reduce the security of your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm dark:text-gray-300 text-gray-700">
              After disabling 2FA, you will no longer need to enter a verification code when logging in.
            </p>
            <p className="text-sm font-semibold text-orange-400 dark:text-orange-400 mt-4">
              Your account will be less secure.
            </p>
          </div>
          <DialogFooter className="mt-6 gap-2">
            <Button
              variant="outline"
              onClick={() => setDisableDialogOpen(false)}
              disabled={toggling}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={toggling}
              className="min-w-[150px]"
              style={{ 
                backgroundColor: toggling ? '#4a0e0f' : '#82181a', 
                color: 'white',
                opacity: toggling ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!toggling) e.currentTarget.style.backgroundColor = '#6b1315';
              }}
              onMouseLeave={(e) => {
                if (!toggling) e.currentTarget.style.backgroundColor = '#82181a';
              }}
            >
              {toggling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

