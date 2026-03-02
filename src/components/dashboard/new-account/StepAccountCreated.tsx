import React from "react";
import { DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import Image from "next/image";
import mt5 from "@/assets/mt5.png";
import globe from "@/assets/globe.svg";
import download from "@/assets/Download.svg";
import web from "@/assets/web.png";
import copy from "@/assets/copy.svg";
import { CopyButton } from "@/components/CopyButton";

interface StepAccountCreatedProps {
  latestAccount: {
    status?: string;
    status_code?: string;
    message?: string;
    _token?: string;
    object?: {
      crm_account_id?: number;
      crm_tp_account_id?: number;
      tp_id?: string;
      tp_creation_error?: string;
    };
    // Real MT5 account data
    accountId?: string;
    name?: string;
    group?: string;
    leverage?: number;
    balance?: number;
    equity?: number;
    credit?: number;
    margin?: number;
    marginFree?: number;
    marginLevel?: number;
    profit?: number;
    isEnabled?: boolean;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  password: string;
  accountType: string;
  onOpenChange: (open: boolean) => void;
}

export const StepAccountCreated: React.FC<StepAccountCreatedProps> = ({
  latestAccount,
  password,
  accountType,
  onOpenChange,
}) => {
  // Handle MT5 Download link
  const handleMt5Download = () => {
    const downloadUrl = "https://download.mql5.com/cdn/web/zuperior.fx.limited/mt5/zuperiorfx5setup.exe";
    window.open(downloadUrl, '_blank');
  };

  // Handle Web Terminal link with auto-login
  const handleWebTerminal = () => {
    const token = localStorage.getItem('userToken');
    const clientId = localStorage.getItem('clientId');

    if (!token || !clientId) {
      console.error('No authentication credentials found');
      return;
    }

    // If we have an accountId for the just-created account, set it as default
    try {
      const accountId = latestAccount?.object?.tp_id || latestAccount?.object?.crm_account_id || latestAccount?.accountId;
      if (accountId) {
        fetch('/api/mt5/set-default-account', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accountId: String(accountId) }),
        }).catch(() => { });
        // Persist for immediate use by terminal launcher
        try {
          localStorage.setItem('defaultMt5Account', String(accountId));
          sessionStorage.setItem('defaultMt5Account', String(accountId));
        } catch (_e) { }
      }
    } catch (_err) { }

    // Get terminal URL from environment variable
    const terminalBaseUrl = process.env.NEXT_PUBLIC_TERMINAL_URL || 'https://trade.zuperior.com';
    const terminalUrl = `${terminalBaseUrl}/terminal?token=${encodeURIComponent(token)}&clientId=${encodeURIComponent(clientId)}&autoLogin=true`;
    window.open(terminalUrl, '_blank');
  };

  return (
    <div className="w-full">
      <DialogTitle className="text-[20px] md:text-[28px] text-center mt-4 font-semibold dark:text-white/75 text-black">
        Account created successfully
      </DialogTitle>
      <DialogTitle className="text-[14px] text-center md:mt-4 font-semibold dark:text-white/75 text-black py-[5.5px]">
        Copy the credentials and enter into MetaTrader 5
      </DialogTitle>
      <div className="md:space-y-6">
        <div className="rounded-[15px] leading-8 bg-white dark:bg-[#050105] px-6 border border-[#251e25] mt-2 md:mt-4 mx-auto w-auto md:w-[396px]">
          <div className="py-2">
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-semibold text-black dark:text-[#8e8c8f] w-[100px]">
                Server:
              </span>
              <span className="text-[14px] font-semibold text-start flex-1 text-black dark:text-white capitalize">
                ZuperiorFX-Limited
              </span>
              <CopyButton text="ZuperiorFX-Limited" className="h-4 w-4 ml-2" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-semibold text-black dark:text-[#8e8c8f] w-[100px]">
                MT5 Login:
              </span>
              <span className="text-[14px] font-semibold text-start flex-1 text-black dark:text-white/74">
                {latestAccount?.object?.tp_id || latestAccount?.object?.crm_account_id || "N/A"}
              </span>
              <CopyButton text={String(latestAccount?.object?.tp_id || latestAccount?.object?.crm_account_id || "")} className="h-4 w-4 ml-2" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-semibold text-black dark:text-[#8e8c8f] w-[100px]">
                Password:
              </span>
              <span className="text-[14px] font-semibold text-start flex-1 text-black dark:text-white/74">
                {password}
              </span>
              <CopyButton text={password} className="h-4 w-4 ml-2" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-semibold text-black dark:text-[#8e8c8f] w-[100px]">
                Account Type:
              </span>
              <span className="text-[14px] font-semibold text-start flex-1 text-black dark:text-white/74">
                {accountType}
              </span>
              <CopyButton text={accountType} className="h-4 w-4 ml-2" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-semibold text-black dark:text-[#8e8c8f] w-[100px]">
                Leverage:
              </span>
              <span className="text-[14px] font-semibold text-start flex-1 text-black dark:text-white/74">
                1:{latestAccount?.leverage ?? "N/A"}
              </span>
              <CopyButton text={`1:${latestAccount?.leverage ?? ""}`} className="h-4 w-4 ml-2" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-semibold text-black dark:text-[#8e8c8f] w-[100px]">
                Balance:
              </span>
              <span className="text-[14px] font-semibold text-start flex-1 text-black dark:text-white/74">
                ${latestAccount?.balance?.toFixed?.(2) ?? "0.00"}
              </span>
              <CopyButton text={`$${latestAccount?.balance?.toFixed?.(2) ?? "0.00"}`} className="h-4 w-4 ml-2" />
            </div>

          </div>
        </div>
        <div className="rounded-[15px] bg-white dark:bg-[#050105] px-6 border border-[#1a131a] mt-2 md:mt-4 mx-auto w-auto md:w-[396px]">
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between mb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleMt5Download}>
              <div className="flex items-center">
                <Image className="h-9 w-9 mr-4 cursor-pointer" src={mt5} alt="" />
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-black dark:text-white">
                    MetaTrader 5
                  </span>
                  <span className="text-[13px] font-semibold text-black dark:text-white/75">
                    Download & Install
                  </span>
                </div>
              </div>
              <Image className="h-4 w-4 cursor-pointer" src={download} alt="" />
            </div>
            <div className="flex items-center justify-between mb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleWebTerminal}>
              <div className="flex items-center">
                <Image className="h-9 w-9 mr-4 cursor-pointer" src={web} alt="" />
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-black dark:text-white">
                    Web Terminal
                  </span>
                  <span className="text-[13px] font-semibold text-black dark:text-white/75">
                    Trade directly from browser
                  </span>
                </div>
              </div>
              <Image className="h-4 w-4 cursor-pointer" src={globe} alt="" />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex justify-center items-center">
            <Button
              className="cursor-pointer mt-3 md:mt-0 w-auto md:w-[400px] bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white"
              onClick={() => onOpenChange(false)}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

