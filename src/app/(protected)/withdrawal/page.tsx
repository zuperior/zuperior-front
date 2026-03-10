"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image, { StaticImageData } from "next/image";
import { TextAnimate } from "@/components/ui/text-animate";
import { store } from "@/store";
// import mobileInHand from "@/assets/deposit/mobile-in-hand.png";
// import multiUser from "@/assets/icons/multi-user.png";
import arrowSideways from "@/assets/icons/arrow-sideways.png";
import TransferFundsDialog from "@/components/withdraw/TransferFundsDialog";
import { WithdrawPayoutDialog } from "@/components/withdraw/WithdrawPayoutDialog";
import { Lock } from "lucide-react"; // Import lock icon
import { toast } from "sonner";
import Link from "next/link";
import { Tabs } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFetchUserData } from "@/hooks/useFetchUserData";

type CryptoData = {
  symbol: string;
  name: string;
  exchangeRate: number;
  network: string;
  blockchain: string;
  logoUrl: string;
  decimals: string;
};

type Cryptocurrency = {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  network: string;
  networks: { blockchain: string; logoUrl: string }[];
};

export default function WithdrawalDepositPage() {
  const [cryptocurrencies, setCryptocurrencies] = useState<Cryptocurrency[]>([]);
  const [transferMethod, setTransferMethod] = useState<
    "between_accounts" | "to_another_user"
  >("between_accounts");
  const [selectedCrypto, setSelectedCrypto] = useState<Cryptocurrency | null>(
    null
  );

  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const isUnverified = store.getState().kyc.verificationStatus === "unverified";

  const [internalTransferDialogOpen, setInternalTransferDialogOpen] =
    useState(false);
  const [bankTransferIcon, setBankTransferIcon] = useState<string>('/bank.png');

  // To Do: add tabs back again when bank transfer methods are added
  const [activeTab, setActiveTab] = useState<"all" | "crypto" | "bank">("all");

  // Account details states
  useEffect(() => {
    if (isUnverified) {
      toast.error(
        "Please complete the Document verification process to enable withdrawals."
      );
    }
  }, [isUnverified]);

  // Ensure latest MT5 balances are fetched on page open
  const { fetchAllData } = useFetchUserData();
  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // Fetch bank transfer payment method icon from withdrawal payment methods
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/withdrawal-payment-methods', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok && Array.isArray(j.methods)) {
          const bankTransfer = j.methods.find((m: any) =>
            m.method_key === 'bank_transfer' ||
            m.method_key === 'wire_transfer' ||
            (m.method_type === 'bank_transfer' && m.is_enabled)
          );
          if (bankTransfer?.icon_path) {
            // Use the icon_path from API, prepend admin backend URL if it's a relative path
            // Payment method images are served from admin backend (port 5003), not server (port 5001)
            const adminBackendUrl = process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL ||
              process.env.NEXT_PUBLIC_ADMIN_API_URL ||
              'http://localhost:5003';
            const iconPath = bankTransfer.icon_path.startsWith('http')
              ? bankTransfer.icon_path
              : bankTransfer.icon_path.startsWith('/')
                ? `${adminBackendUrl}${bankTransfer.icon_path}`
                : `${adminBackendUrl}/${bankTransfer.icon_path}`;
            console.log('[Withdrawal Page] Bank transfer icon path:', { icon_path: bankTransfer.icon_path, adminBackendUrl, iconPath });
            setBankTransferIcon(iconPath);
          }
        }
      } catch (err) {
        console.error('[Withdrawal Page] Failed to fetch bank transfer icon:', err);
        // Keep default /bank.png on error
      }
    })();
  }, []);

  // Use only USDT-TRC20 for withdrawals
  useEffect(() => {
    setCryptocurrencies([
      {
        id: 'USDT-TRC20',
        name: 'USDT-TRC20',
        symbol: 'USDT',
        icon: '/trc20.png',
        network: 'TRC20',
        networks: [{ blockchain: 'TRC20', logoUrl: '/trc20.png' }],
      },
    ]);
  }, []);

  const handleCryptoSelect = (crypto: Cryptocurrency) => {
    setSelectedCrypto(crypto);
    // Refresh balances just before opening dialog
    fetchAllData(true);
    setDepositDialogOpen(true);
  };

  const handleTransferSelect = () => {
    setInternalTransferDialogOpen(true);
  };

  const cardMaskStyle: React.CSSProperties = {
    WebkitMaskImage:
      "linear-gradient(212deg, rgb(49,27,71) 0%, rgb(20,17,24) 100%)",
    maskImage:
      "linear-gradient(100deg, rgba(0,0,0,0.1) 10%, rgba(0,0,0,0.4) 100%)",
    borderRadius: "15px",
    opacity: 0.25,
    position: "absolute",
    padding: "1px",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    pointerEvents: "none",
  };

  // Helper to get metadata for payment methods
  const getPaymentMethodMetadata = (id: string, type: string) => {
    const normalizedId = (id || '').toUpperCase();
    const normalizedType = (type || '').toLowerCase();

    if (normalizedId.includes('USDT') || normalizedId.includes('TRC20')) {
      return {
        processingTime: "Instant - 15 minutes",
        fee: "0 USD",
        limits: "10 - 200,000 USD",
        recommended: true
      };
    }

    if (normalizedType === 'bank_transfer' || normalizedId.includes('BANK')) {
      return {
        processingTime: "1 - 3 business days",
        fee: "0 USD",
        limits: "10 - 10,000 USD",
        recommended: false
      };
    }

    // Default for others
    return {
      processingTime: "Instant",
      fee: "0 USD",
      limits: "50 - 10,000 USD",
      recommended: false
    };
  };

  return (
    <div className="flex flex-col dark:bg-[#01040D] px-3 ">
      <main className="flex-1 overflow-y-auto">
        <div className="w-full">
          {/* Title */}

          <div className="flex flex-col md:flex-row md:relative md:items-center md:justify-between">
            <TextAnimate
              duration={0.2}
              animation="slideUp"
              once
              by="word"
              as="h1"
              className="text-[26px] md:text-[34px] font-bold text-black dark:text-white/85">
              Withdraw Funds
            </TextAnimate>

            <div className="mt-1 md:mt-0 md:absolute md:right-0">
              <Link
                href={isUnverified ? "#" : "/transactions"}
                className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] py-2 px-2.5 text-[13px] md:text-[16px] md:py-3 md:px-3 leading-[14px] w-auto border-2 border-gray-300 dark:border-[#1D1825] bg-white text-black dark:bg-gradient-to-r from-[#FFFFFF] dark:from-[#110F17] to-[#f4e7f6] dark:to-[#1E1429] dark:text-white/75
                ${isUnverified
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:brightness-95 cursor-pointer"
                  }`}>
                Pending Withdrawals
                {isUnverified && <Lock className="w-5 h-5 dark:text-white" />}
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={(value) => {
              if (value && ["all", "crypto", "bank"].includes(value)) {
                setActiveTab(value as never);
              }
            }}
            className="mb-[16px]">
            <div className="flex items-center mt-3">
              <ToggleGroup
                type="single"
                value={activeTab}
                onValueChange={(value) => {
                  if (value && ["all", "crypto", "bank"].includes(value)) {
                    setActiveTab(value as never);
                  }
                }}
                className="p-2 relative rounded-[10px]">
                <div
                  style={cardMaskStyle}
                  className="border border-[#6545a7] dark:border-white/45"
                />
                <ToggleGroupItem value="all" className="z-10 cursor-pointer">
                  All
                </ToggleGroupItem>
                <ToggleGroupItem value="crypto" className="z-10 cursor-pointer">
                  Crypto
                </ToggleGroupItem>
                {/* <ToggleGroupItem value="bank" className="z-10 cursor-pointer">
                  Bank Transfers
                </ToggleGroupItem> */}
              </ToggleGroup>
            </div>
          </Tabs>

          {/* Payment Method Tiles */}
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* {(activeTab === "all" || activeTab === "bank") &&
              bankMethods.map((method) => (
                <PaymentTile
                  key={method.id}
                  icon={method.icon}
                  name={method.name}
                  onOpenNewAccount={pageMode === "withdraw" ? handleOpenWithdraw : () => {}}
                />
              ))} */}

            {(activeTab === "all" || activeTab === "crypto") &&
              cryptocurrencies.map((crypto) => {
                const metadata = getPaymentMethodMetadata(crypto.id, 'crypto');
                return (
                  <PaymentTile
                    key={crypto.id}
                    icon={crypto.icon}
                    name={crypto.name}
                    unverified={isUnverified}
                    onOpenNewAccount={() => handleCryptoSelect(crypto)}
                    {...metadata}
                  />
                );
              })}
            {/* Bank transfer tile */}
            {(activeTab === "all" || activeTab === "bank") && (
              <PaymentTile
                key="BANK"
                icon={bankTransferIcon}
                name={'Bank Transfer'}
                unverified={isUnverified}
                onOpenNewAccount={() => setBankDialogOpen(true)}
                {...getPaymentMethodMetadata('BANK', 'bank_transfer')}
              />
            )}
          </div>

          {activeTab === "all" && (
            <>
              <TextAnimate
                duration={0.2}
                animation="slideUp"
                once
                by="word"
                as="h1"
                className="text-[#000000] dark:text-[#FFFFFFBF]  text-center text-[20px] my-9 font-semibold">
                Transfer between accounts
              </TextAnimate>
              <div className="mt-4 grid gap-3 md:grid-cols-2 grid-cols-1">
                <TransferAmountCard
                  icon={arrowSideways}
                  name="Between your accounts"
                  unverified={false}
                  onOpenNewAccount={() => {
                    setTransferMethod("between_accounts");
                    handleTransferSelect();
                  }}
                />
                {/* <TransferAmountCard
                  icon={multiUser}
                  name="To another user"
                  unverified={isUnverified}
                  onOpenNewAccount={() => {
                    setTransferMethod("to_another_user");
                    handleTransferSelect();
                  }}
                /> */}
              </div>
            </>
          )}

          {/* Bonus section */}
          {/* <div className="mt-[35px] mb-4 rounded-[15px] bg-[#FBFAFC] dark:bg-black border dark:border-[#1D1825] border-gray-300 px-14 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-[22px] font-medium text-black dark:text-white">
                Trade with <span className="text-[#A35CA2]">10%</span> deposit
                bonus
              </h3>
              <Image
                src={mobileInHand}
                alt="Mobile App"
                className="object-contain w-[125px] h-[143px]"
              />
            </div>
          </div> */}

          {/* Deposit Dialog */}
          <WithdrawPayoutDialog
            open={depositDialogOpen}
            onOpenChange={setDepositDialogOpen}
            selectedCrypto={selectedCrypto}
            allowedType="crypto"
          />
          {/* Bank withdraw dialog */}
          <WithdrawPayoutDialog
            open={bankDialogOpen}
            onOpenChange={setBankDialogOpen}
            selectedCrypto={null}
            allowedType="bank"
          />
          <TransferFundsDialog
            open={internalTransferDialogOpen}
            onOpenChange={setInternalTransferDialogOpen}
            method={transferMethod}
          />
        </div>
      </main>
    </div>
  );
}

/* PaymentTile updated to match DepositPage design */
function PaymentTile({
  icon,
  name,
  unverified,
  onOpenNewAccount,
  processingTime = "Instant - 15 minutes",
  fee = "0%",
  limits = "10 - 200,000 USD",
  recommended = false,
}: {
  icon: string;
  name: string;
  unverified: boolean;
  onOpenNewAccount: () => void;
  processingTime?: string;
  fee?: string;
  limits?: string;
  recommended?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(icon);

  // Reset state when icon changes
  useEffect(() => {
    setImageSrc(icon);
    setImageError(false);
  }, [icon]);

  // Handle image load error with fallback
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error(`[PaymentTile] Failed to load image: ${imageSrc}`);

    setImageError(true);
    target.style.display = 'none';
  };

  return (
    <div
      onClick={unverified ? undefined : onOpenNewAccount}
      className={`group relative flex flex-col justify-between rounded-xl bg-white dark:bg-[#0d0414] border border-gray-200 dark:border-gray-800 p-6 cursor-pointer transition-all hover:shadow-lg hover:border-purple-500/50 dark:hover:border-purple-500/50 ${unverified ? "cursor-not-allowed opacity-70" : ""
        }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            {imageError ? (
              <div className="h-full w-full flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-5 w-5 text-gray-400">💰</div>
              </div>
            ) : (
              <img
                className="h-full w-full object-contain"
                src={imageSrc}
                alt={name}
                style={{ imageRendering: 'auto' }}
                onError={handleImageError}
                crossOrigin="anonymous"
              />
            )}
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
            {name}
          </h3>
        </div>
        <div className="flex gap-2">
          {recommended && (
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
              Recommended
            </span>
          )}
          {unverified && <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex flex-row flex-wrap gap-1 text-gray-500 dark:text-gray-400">
          <span>Processing time</span>
          <span className="font-medium text-gray-900 dark:text-gray-200">{processingTime}</span>
        </div>
        <div className="flex flex-row flex-wrap gap-1 text-gray-500 dark:text-gray-400">
          <span>Fee</span>
          <span className="font-medium text-gray-900 dark:text-gray-200">{fee}</span>
        </div>
        <div className="flex flex-row flex-wrap gap-1 text-gray-500 dark:text-gray-400">
          <span>Limits</span>
          <span className="font-medium text-gray-900 dark:text-gray-200">{limits}</span>
        </div>
        {unverified && (
          <div className="pt-2 text-red-500 dark:text-red-400 text-xs font-medium">
            Verification required
          </div>
        )}
      </div>
    </div>
  );
}

/* Updated TransferAmountCard with lock icon */
function TransferAmountCard({
  icon,
  name,
  unverified,
  onOpenNewAccount,
}: {
  icon: string | StaticImageData;
  name: string;
  unverified: boolean;
  onOpenNewAccount: () => void;
}) {
  return (
    <div
      onClick={unverified ? undefined : onOpenNewAccount}
      className={`group relative rounded-lg bg-[#fbfafd] 
                 dark:bg-[#0d0414] p-6 border dark:border-[#1D1825] 
                 border-gray-300 overflow-hidden ${unverified
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer"
        }`}>
      {unverified && (
        <div className="absolute right-5 top-5 flex items-center justify-center z-10 rounded-[15px]">
          <div className="flex flex-col items-center text-white">
            <Lock className="w-6 h-6 mb-2 dark:text-white text-black" />
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        <Image
          className="h-12 w-12 md:h-16 md:w-16 shrink-0"
          src={icon}
          alt={name}
          width={64}
          height={64}
          quality={100}
          unoptimized
          style={{ imageRendering: 'crisp-edges' }}
        />
        <div>
          <h3 className="text-lg font-medium text-[#000000] dark:text-[#FFFFFF]">
            {name}
          </h3>
          {unverified && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">
              Verification required
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
