"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResetMainPasswordDialog } from "./ResetPasswordDialog";
import LoginActivity from "./LoginActivity";
import ActiveDevices from "./ActiveDevices";
import { userService } from "@/services/api.service";
import { authService } from "@/services/api.service";
import { Loader2, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SecurityTabProps {
  email?: string;
}

export default function SecurityTab({ email }: SecurityTabProps) {
  const maskedEmail = email ?? "Not provided";
  // dialog toggle state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [logoutAllDialogOpen, setLogoutAllDialogOpen] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const handleLogoutAllDevices = async () => {
    try {
      setIsLoggingOutAll(true);
      
      // Call server to logout from all devices
      await userService.logoutAllDevices();
      
      // Clear all client-side storage
      authService.clearAuthData();
      
      toast.success("Logged out from all devices successfully");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }, 1000);
    } catch (error: any) {
      console.error("Error logging out from all devices:", error);
      toast.error(error?.response?.data?.message || "Failed to logout from all devices");
    } finally {
      setIsLoggingOutAll(false);
      setLogoutAllDialogOpen(false);
    }
  };

  return (
    <div className="space-y-10 mt-4 text-white">
      {/* Authorization Section */}
      <section>
        <h2 className="text-[34px] font-semibold mb-1 dark:text-white/75 text-black">Authorization</h2>
        <p className="text-sm  dark:text-white/75 text-black mb-4">
          Change your password whenever you think it might have been
          compromised.
        </p>
        <div className="border dark:border-white/10 border-black/10 rounded-xl overflow-hidden dark:bg-[#191a22]">
          <div className="flex items-center justify-between p-5 border-b dark:border-white/10 border-black/10">
            <div>
              <div className="text-sm font-medium dark:text-white/75 text-black">Login</div>
              <div className="font-semibold dark:text-white/75 text-black mt-1">{maskedEmail}</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm font-medium dark:text-white/75 text-black">Password</div>
              <div className="tracking-widest text-[34px] font-semibold dark:text-white/75 text-black mt-1">
                ••••••••
              </div>
            </div>
            <Button
              variant="secondary"
              className="min-w-[110px] bg-gradient-to-tr to-[#9F8BCF] from-[#6242A5] 
                         dark:bg-gradient-to-tr dark:from-[#232438] dark:to-[#141414] 
                        dark:text-white text-white border-none"
              onClick={() => setChangePasswordOpen(true)}
            >
              Change
            </Button>
          </div>
        </div>
      </section>

      {/* Reset Main Account Password Dialog */}
      <ResetMainPasswordDialog
        email={email ?? ""}
        open={changePasswordOpen}
        onOpen={setChangePasswordOpen}
      />

      {/* Currently Logged in Devices Section */}
      <section>
        <h2 className="text-[34px] font-semibold mb-1 dark:text-white/75 text-black">Currently Logged in Devices</h2>
        <p className="text-sm dark:text-white/75 text-black mb-4">
          View all devices that are currently logged into your account.
        </p>
        <div className="border dark:border-white/10 border-black/10 rounded-xl overflow-hidden dark:bg-[#191a22]">
          <div className="p-5">
            <ActiveDevices />
          </div>
        </div>
      </section>

      {/* Login Activity Section */}
      <section>
        <h2 className="text-[34px] font-semibold mb-1 dark:text-white/75 text-black">Login Activity</h2>
        <p className="text-sm dark:text-white/75 text-black mb-4">
          View your recent login activity and the devices used to access your account.
        </p>
        <div className="border dark:border-white/10 border-black/10 rounded-xl overflow-hidden dark:bg-[#191a22]">
          <div className="p-5">
            <LoginActivity />
          </div>
        </div>
      </section>

      {/* Logout from All Devices Section */}
      <section>
        <h2 className="text-[34px] font-semibold mb-1 dark:text-white/75 text-black">Account Security</h2>
        <p className="text-sm dark:text-white/75 text-black mb-4">
          Log out from all devices to secure your account. This will clear all sessions and cache.
        </p>
        <div className="border dark:border-white/10 border-black/10 rounded-xl overflow-hidden dark:bg-[#191a22]">
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="font-medium dark:text-white/75 text-black mb-2">
                Log out from all devices
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                This will log you out from all devices and clear all stored cache. You will need to log in again.
              </div>
            </div>
            <Button
              variant="destructive"
              className="bg-red-600/20 text-red-400 border-red-600/30 min-w-[180px] hover:bg-red-600/30"
              onClick={() => setLogoutAllDialogOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout from All Devices
            </Button>
          </div>
        </div>
      </section>

      {/* Logout All Devices Confirmation Dialog */}
      <Dialog open={logoutAllDialogOpen} onOpenChange={setLogoutAllDialogOpen}>
        <DialogContent className="border-2 border-transparent p-6 text-black dark:text-white rounded-[18px] w-full max-w-md [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold dark:text-white/75 text-black mb-2">
              Logout from All Devices
            </DialogTitle>
            <DialogDescription className="text-sm dark:text-gray-400 text-gray-600 mb-4">
              Are you sure you want to log out from all devices? This will:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <ul className="list-disc list-inside space-y-2 text-sm dark:text-gray-300 text-gray-700 ml-2">
              <li>Log you out from all devices and browsers</li>
              <li>Clear all stored cache and cookies</li>
              <li>Require you to log in again on all devices</li>
            </ul>
            <p className="text-sm font-semibold text-red-400 dark:text-red-400 mt-4">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="mt-6 gap-2">
            <Button
              variant="outline"
              onClick={() => setLogoutAllDialogOpen(false)}
              disabled={isLoggingOutAll}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutAllDevices}
              disabled={isLoggingOutAll}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 min-w-[180px]"
            >
              {isLoggingOutAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout from All Devices
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2-Step Verification Section */}
      {/* <section>
        <h2 className="text-2xl font-bold mb-1 text-white">
          2-Step verification
        </h2>
        <p className="text-gray-400 mb-4 text-sm">
          2-step verification ensures that all sensitive transactions are
          authorized by you.
          <br />
          We encourage you to enter verification codes to confirm these
          transactions.
        </p>
        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#191a22]">
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm font-medium text-gray-300">
                Security type
              </div>
              <div className="font-semibold text-white mt-1">{maskedEmail}</div>
            </div>
            <Button
              variant="secondary"
              className="min-w-[110px] bg-[#232438] text-white border-none"
            >
              Change
            </Button>
          </div>
        </div>
      </section> */}
      {/* Account security and termination Section */}

      {/* <section>
        <h2 className="text-2xl font-bold mb-1 text-white">
          Account security and termination
        </h2>
        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#191a22]">
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div>
              <div className="font-medium text-white mb-2">
                Log out from all other devices except this one to secure your
                account.
              </div>
            </div>
            <Button
              variant="destructive"
              className="bg-[#2a1c1c] text-red-400 border-none min-w-[220px]"
            >
              Log out from other devices
            </Button>
          </div>
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="font-medium text-white">
                This action cannot be reversed.
              </div>
            </div>
            <Button
              variant="destructive"
              className="bg-[#2a1c1c] text-red-400 border-none min-w-[220px] flex items-center gap-1"
            >
              Terminate Zuperior Personal Area
            </Button>
          </div>
        </div>
      </section> */}
    </div>
  );
}
