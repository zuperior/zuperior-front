"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { CreditCard, Building2 } from "lucide-react";
import { TextAnimate } from "@/components/ui/text-animate";
import { DepositDialog } from "@/components/deposit/DepositDialog";
import { BankDepositDialog } from "@/components/deposit/BankDepositDialog";
import { UnipaymentDialog } from "@/components/deposit/UnipaymentDialog";
import { store } from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { fetchAccessToken } from "@/store/slices/accessCodeSlice";
import { getLifetimeDeposit } from "@/services/depositLimitService";
import { CardLoader } from "@/components/ui/loading";

type Cryptocurrency = {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  networks: {
    blockchain: string;
    logoUrl: string;
  }[];
};

export default function DepositPage() {
  const [cryptocurrencies, setCryptocurrencies] = useState<Cryptocurrency[]>(
    []
  );
  const [selectedCrypto, setSelectedCrypto] = useState<Cryptocurrency | null>(
    null
  );
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankTransferAvailable, setBankTransferAvailable] = useState(false);
  const [unipaymentCryptoOpen, setUnipaymentCryptoOpen] = useState(false);
  const [unipaymentCardOpen, setUnipaymentCardOpen] = useState(false);
  const [unipaymentGoogleAppleOpen, setUnipaymentGoogleAppleOpen] = useState(false);
  const [unipaymentUpiOpen, setUnipaymentUpiOpen] = useState(false);
  const [manualDepositDialogs, setManualDepositDialogs] = useState<Record<string, boolean>>({});
  const dispatch = useAppDispatch();
  const [lifetimeDeposit, setLifetimeDeposit] = useState<number>(0);
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(true);
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<any[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);
  const [manualGateways, setManualGateways] = useState<Record<string, any>>({});

  useEffect(() => {
    // Comprehensive list of Unipayment-supported cryptocurrencies
    const cryptoList: Cryptocurrency[] = [
      {
        id: "BTC",
        name: "Bitcoin",
        symbol: "BTC",
        icon: "/crypto_icon/btc.webp",
        networks: [
          {
            blockchain: "BTC",
            logoUrl: "/crypto_icon/btc.webp",
          },
        ],
      },
      {
        id: "ETH",
        name: "Ethereum",
        symbol: "ETH",
        icon: "/crypto_icon/ethereum.webp",
        networks: [
          {
            blockchain: "ETH",
            logoUrl: "/crypto_icon/ethereum.webp",
          },
        ],
      },
      {
        id: "USDT-TRC20",
        name: "USDT-TRC20",
        symbol: "USDT",
        icon: "/trc20.png",
        networks: [
          {
            blockchain: "TRC20",
            logoUrl: "/trc20.png",
          },
        ],
      },
      {
        id: "USDT-BEP20",
        name: "USDT-BEP20",
        symbol: "USDT",
        icon: "/bep20.png",
        networks: [
          {
            blockchain: "BEP20",
            logoUrl: "/bep20.png",
          },
        ],
      },
      {
        id: "USDT-ERC20",
        name: "USDT-ERC20",
        symbol: "USDT",
        icon: "/crypto_icon/USDT-ERC20.webp",
        networks: [
          {
            blockchain: "ERC20",
            logoUrl: "/crypto_icon/USDT-ERC20.webp",
          },
        ],
      },
      {
        id: "BNB",
        name: "BNB",
        symbol: "BNB",
        icon: "/crypto_icon/bnb.webp",
        networks: [
          {
            blockchain: "BEP20",
            logoUrl: "/crypto_icon/bnb.webp",
          },
        ],
      },
      {
        id: "USDC",
        name: "USD Coin",
        symbol: "USDC",
        icon: "/crypto_icon/usdc.webp",
        networks: [
          {
            blockchain: "ERC20",
            logoUrl: "/crypto_icon/usdc.webp",
          },
        ],
      },
      {
        id: "EURC",
        name: "EUR Coin",
        symbol: "EURC",
        icon: "/crypto_icon/eurc.webp",
        networks: [
          {
            blockchain: "ERC20",
            logoUrl: "/crypto_icon/eurc.webp",
          },
        ],
      },
    ];

    setCryptocurrencies(cryptoList);
    setIsLoadingCrypto(false);
  }, []);

  useEffect(() => {
    // Fetch enabled payment methods from API
    let isMounted = true;
    
    (async () => {
      try {
        setIsLoadingPaymentMethods(true);
        console.log('[Deposit Page] Fetching payment methods from /api/deposit-payment-methods...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const r = await fetch('/api/deposit-payment-methods', { 
          cache: 'no-store',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!isMounted) return;
        
        const j = await r.json();
        console.log('[Deposit Page] Payment methods API response:', j);
        console.log('[Deposit Page] Response details:', {
          ok: j.ok,
          methodsCount: j.methods?.length || 0,
          methods: j.methods?.map((m: any) => ({ key: m.method_key, type: m.method_type, enabled: true })) || [],
          error: j.error
        });
        
        if (j.ok && Array.isArray(j.methods)) {
          console.log(`[Deposit Page] Setting ${j.methods.length} enabled payment methods:`, 
            j.methods.map((m: any) => m.method_key).join(', '));
          setEnabledPaymentMethods(j.methods);
        } else {
          console.warn('[Deposit Page] Invalid API response format:', j);
          if (j.error) {
            console.error('[Deposit Page] API Error:', j.error);
            // If server error, show user-friendly message
            if (j.serverError) {
              console.error('[Deposit Page] Server is returning an error. Check server logs and database connection.');
            }
          }
          // Still try to use methods if they exist, even if ok is false
          if (Array.isArray(j.methods) && j.methods.length > 0) {
            console.warn('[Deposit Page] Using methods despite error flag');
            setEnabledPaymentMethods(j.methods);
          } else {
            setEnabledPaymentMethods([]);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('[Deposit Page] Failed to fetch payment methods:', err);
        console.error('[Deposit Page] Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setEnabledPaymentMethods([]);
      } finally {
        if (isMounted) {
          setIsLoadingPaymentMethods(false);
          console.log('[Deposit Page] Loading payment methods completed');
        }
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // determine if bank transfer gateway exists
    (async () => {
      try {
        const token = localStorage.getItem('userToken');
        const r = await fetch('/api/manual-gateway?type=bank_transfer', { cache: 'no-store', headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
        const j = await r.json();
        const isAvailable = Boolean(j?.success);
        console.log('[Deposit Page] Bank transfer gateway check:', { response: j, isAvailable });
        setBankTransferAvailable(isAvailable);
      } catch (err) { 
        console.error('[Deposit Page] Bank transfer gateway check failed:', err);
        setBankTransferAvailable(false); 
      }
    })();

    // Note: Manual gateway details will be fetched when user clicks on a method
    // This avoids fetching all gateways upfront
  }, []);

  useEffect(() => {
    const fetchDeposit = async () => {
      try {
        const email = store.getState().user.data?.email1;
        if (!email) {
          console.warn("Email not found in store, skipping lifetime deposit fetch");
          setLifetimeDeposit(0);
          return;
        }

        const freshToken = await dispatch(fetchAccessToken()).unwrap();
        if (!freshToken) {
          console.warn("Access token not available, skipping lifetime deposit fetch");
          setLifetimeDeposit(0);
          return;
        }

        const response = await getLifetimeDeposit({
          email,
          accessToken: freshToken,
        });
        setLifetimeDeposit(response);
        console.log("✅ Lifetime deposit fetched:", response);
      } catch (error) {
        console.error("Error fetching lifetime deposit:", error);
        // Set default value instead of leaving it undefined
        setLifetimeDeposit(0);
      }
    };

    fetchDeposit();
  }, [dispatch]);

  const handleCryptoSelect = useCallback((crypto: Cryptocurrency) => {
    setSelectedCrypto(crypto);
    // Open Cregis deposit dialog for legacy Cregis cryptos
    setDepositDialogOpen(true);
  }, []);

  // Filter items - show only enabled payment methods
  const filteredItems = useMemo(() => {
    const items: any[] = [];
    
    console.log('[Deposit Page] Filtering items. Enabled methods:', enabledPaymentMethods);
    console.log('[Deposit Page] Enabled method keys:', enabledPaymentMethods.map((m: any) => m.method_key));
    
    // Helper to check if a method is enabled
    // Note: The API already returns only enabled methods, so we just check if the method_key exists
    const isMethodEnabled = (methodKey: string) => {
      const found = enabledPaymentMethods.some(m => m.method_key === methodKey);
      console.log(`[Deposit Page] Checking ${methodKey}:`, found);
      return found;
    };

    // Add Unipayment methods only if enabled
    if (isMethodEnabled('unipayment_crypto')) {
      items.push({ type: 'unipayment', method: 'crypto', data: { id: 'UNIPAYMENT_CRYPTO', name: 'Crypto', icon: '/crypto.png' } });
    }
    if (isMethodEnabled('unipayment_card')) {
      items.push({ type: 'unipayment', method: 'card', data: { id: 'UNIPAYMENT_CARD', name: 'Credit/Debit Cards', icon: '/pm_card.png' } });
    }
    if (isMethodEnabled('unipayment_google_apple_pay')) {
      items.push({ type: 'unipayment', method: 'google_apple_pay', data: { id: 'UNIPAYMENT_GOOGLE_APPLE', name: 'Google/Apple Pay', icon: '/pm_googleapple.png' } });
    }
    if (isMethodEnabled('unipayment_upi')) {
      items.push({ type: 'unipayment', method: 'upi', data: { id: 'UNIPAYMENT_UPI', name: 'UPI', icon: '/pm_upi.png' } });
    }
    
    // Add bank transfer if enabled in deposit_payment_methods
    // Note: We show it if enabled, even if manual gateway isn't configured yet
    // The BankDepositDialog will handle the case where no gateway is available
    // Support both 'bank_transfer' and legacy 'wire_transfer' for backward compatibility
    const bankTransferMethodEnabled = isMethodEnabled('bank_transfer') || isMethodEnabled('wire_transfer');
    console.log('[Deposit Page] Bank transfer check:', { 
      bankTransferMethodEnabled, 
      bankTransferAvailable, 
      willShow: bankTransferMethodEnabled, // Show if enabled, regardless of gateway availability
      enabledMethods: enabledPaymentMethods.map(m => m.method_key)
    });
    if (bankTransferMethodEnabled) {
      items.push({ type: 'bank_transfer', data: { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: 'bank' } });
    }
    
    // Add Cregis crypto options only if enabled
    cryptocurrencies.forEach((crypto) => {
      if (crypto.id === 'USDT-TRC20' && isMethodEnabled('cregis_usdt_trc20')) {
        items.push({ type: "crypto", data: crypto });
      }
      if (crypto.id === 'USDT-BEP20' && isMethodEnabled('cregis_usdt_bep20')) {
        items.push({ type: "crypto", data: crypto });
      }
    });
    
    // Add manual gateway methods
    enabledPaymentMethods.forEach((method) => {
      // Check if it's a manual gateway method
      if (method.method_key?.startsWith('manual_gateway_') || method.method_type === 'manual') {
        const metadata = method.metadata || {};
        const gatewayType = metadata.type || method.method_type;
        const displayName = method.display_name || metadata.name || 'Manual Deposit';
        const iconPath = method.icon_path || metadata.icon_url || '/manual.png';
        
        // Skip if it's bank_transfer type (already handled above)
        if (gatewayType === 'bank_transfer' || gatewayType === 'wire') {
          return;
        }
        
        // For UPI type, add as UPI option
        if (gatewayType === 'upi') {
          items.push({ 
            type: 'manual_upi', 
            method_key: method.method_key,
            data: { 
              id: method.method_key, 
              name: displayName, 
              icon: iconPath || '/pm_upi.png',
              gateway: manualGateways[method.method_key]
            } 
          });
        }
        // For crypto type, add as crypto option
        else if (gatewayType === 'crypto') {
          items.push({ 
            type: 'manual_crypto', 
            method_key: method.method_key,
            data: { 
              id: method.method_key, 
              name: displayName, 
              icon: iconPath || '/crypto.png',
              gateway: manualGateways[method.method_key]
            } 
          });
        }
        // For other types, add as generic manual deposit
        else {
          items.push({ 
            type: 'manual', 
            method_key: method.method_key,
            data: { 
              id: method.method_key, 
              name: displayName, 
              icon: iconPath || '/manual.png',
              gateway: manualGateways[method.method_key]
            } 
          });
        }
      }
    });
    
    console.log('[Deposit Page] Final filtered items count:', items.length);
    console.log('[Deposit Page] Final filtered items:', items.map(i => ({ type: i.type, method: i.method, name: i.data?.name })));
    
    return items;
  }, [cryptocurrencies, bankTransferAvailable, enabledPaymentMethods, manualGateways]);

  // Show loading state while fetching crypto data and payment methods
  if (isLoadingCrypto || isLoadingPaymentMethods) {
    return <CardLoader message="Loading deposit options..." />;
  }

  return (
    <div className="flex flex-col dark:bg-[#01040D]">
      <main className="flex-1 overflow-y-auto px-2.5 md:px-0">
        {/* Page Title */}
        <div>
          <TextAnimate
            duration={0.2}
            animation="slideUp"
            once
            by="word"
            as="h1"
            className="text-[34px] leading-[30px] font-bold text-black dark:text-white/85"
          >
            Deposit Funds
          </TextAnimate>
          {/* <TextAnimate
            duration={0.2}
            animation="slideUp"
            once
            as="h2"
            by="word"
            className="mt-[19px] text-[20px] font-bold text-black dark:text-white/75">
            All Payment Methods
          </TextAnimate> */}
        </div>

        {/* Payment Cards - Unipayment, Wire, and Cregis */}
        {filteredItems.length === 0 ? (
          <div className="mt-4 p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Payment Methods Available</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-2">Please contact support if you need assistance with deposits.</p>
            {enabledPaymentMethods.length > 0 && (
              <div className="mt-4 text-xs text-gray-400">
                <p>Enabled methods from API: {enabledPaymentMethods.map((m: any) => m.method_key).join(', ') || 'None'}</p>
                <p className="mt-1">Check admin panel to ensure methods are enabled in Deposit Payment Methods.</p>
              </div>
            )}
            {enabledPaymentMethods.length === 0 && (
              <div className="mt-4 text-xs text-yellow-600">
                ⚠️ No enabled payment methods found in API response. Please enable methods in admin panel.
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
            if (item.type === 'bank_transfer') {
              return (
                <MemoizedPaymentMethodCard
                  key="BANK_TRANSFER"
                  onOpenNewAccount={() => setBankDialogOpen(true)}
                  icon={item.data.icon}
                  name={item.data.name}
                />
              );
            }
            if (item.type === 'unipayment') {
              const method = item.method;
              const handlers: Record<string, () => void> = {
                'crypto': () => setUnipaymentCryptoOpen(true),
                'card': () => setUnipaymentCardOpen(true),
                'google_apple_pay': () => setUnipaymentGoogleAppleOpen(true),
                'upi': () => setUnipaymentUpiOpen(true),
              };
              return (
                <MemoizedPaymentMethodCard
                  key={item.data.id}
                  onOpenNewAccount={handlers[method] || (() => {})}
                  icon={item.data.icon}
                  name={item.data.name}
                />
              );
            }
            // Handle manual gateway methods
            if (item.type === 'manual' || item.type === 'manual_upi' || item.type === 'manual_crypto') {
              return (
                <MemoizedPaymentMethodCard
                  key={item.data.id}
                  onOpenNewAccount={() => {
                    setManualDepositDialogs(prev => ({ ...prev, [item.data.id]: true }));
                  }}
                  icon={item.data.icon}
                  name={item.data.name}
                />
              );
            }
            const crypto = item.data as Cryptocurrency;
            return (
              <MemoizedPaymentMethodCard
                key={crypto.id}
                onOpenNewAccount={() => handleCryptoSelect(crypto)}
                icon={crypto.icon}
                name={crypto.name}
              />
            );
          })}
          </div>
        )}

        {/* Dialogs - USDT TRC20 and BEP20 */}
        <DepositDialog
          open={depositDialogOpen}
          onOpenChange={setDepositDialogOpen}
          selectedCrypto={selectedCrypto}
          lifetimeDeposit={lifetimeDeposit}
        />
        {/* Bank Transfer Dialog */}
        <BankDepositDialog open={bankDialogOpen} onOpenChange={setBankDialogOpen} lifetimeDeposit={lifetimeDeposit} />
        
        {/* Unipayment Dialogs */}
        <UnipaymentDialog
          open={unipaymentCryptoOpen}
          onOpenChange={setUnipaymentCryptoOpen}
          paymentMethod="crypto"
          availableCryptos={cryptocurrencies}
          lifetimeDeposit={lifetimeDeposit}
        />
        <UnipaymentDialog
          open={unipaymentCardOpen}
          onOpenChange={setUnipaymentCardOpen}
          paymentMethod="card"
          lifetimeDeposit={lifetimeDeposit}
        />
        <UnipaymentDialog
          open={unipaymentGoogleAppleOpen}
          onOpenChange={setUnipaymentGoogleAppleOpen}
          paymentMethod="google_apple_pay"
          lifetimeDeposit={lifetimeDeposit}
        />
        <UnipaymentDialog
          open={unipaymentUpiOpen}
          onOpenChange={setUnipaymentUpiOpen}
          paymentMethod="upi"
          lifetimeDeposit={lifetimeDeposit}
        />
        
        {/* Manual Gateway Dialogs */}
        {enabledPaymentMethods
          .filter(m => m.method_key?.startsWith('manual_gateway_') || m.method_type === 'manual')
          .map((method) => {
            const metadata = method.metadata || {};
            const gatewayType = metadata.type || method.method_type;
            // Skip bank_transfer as it has its own dialog
            if (gatewayType === 'bank_transfer' || gatewayType === 'wire') {
              return null;
            }
            
            return (
              <BankDepositDialog
                key={method.method_key}
                open={manualDepositDialogs[method.method_key] || false}
                onOpenChange={(open) => {
                  setManualDepositDialogs(prev => ({ ...prev, [method.method_key]: open }));
                }}
                lifetimeDeposit={lifetimeDeposit}
              />
            );
          })}
      </main>
    </div>
  );
}

function PaymentMethodCard({
  icon,
  name,
  onOpenNewAccount,
}: {
  icon: string;
  name: string;
  onOpenNewAccount: () => void;
}) {
  return (
    <div
      onClick={onOpenNewAccount}
      className="group relative h-auto rounded-[15px] bg-[#fbfafd] dark:bg-[#0d0414] p-6 border dark:border-[#1D1825] border-gray-300 overflow-hidden cursor-pointer hover:bg-gradient-to-r from-white to-[#f4e7f6]
           dark:from-[#330F33] dark:to-[#1C061C]"
    >
      <div className="flex flex-col items-center mt-2 mb-4 text-center">
        {icon === 'bank' ? (
          <Building2 className="h-20 w-20 md:h-24 md:w-24 text-blue-600 dark:text-blue-400" />
        ) : (
          <Image
            className="h-20 w-20 md:h-24 md:w-24 object-contain"
            src={icon}
            alt={name}
            width={126}
            height={126}
            quality={100}
            unoptimized
            style={{ imageRendering: 'auto' }}
          />
        )}
        <h3 className="mt-4 text-[18px] font-bold text-black dark:text-white">
          {name}
        </h3>
      </div>
    </div>
  );
}

const MemoizedPaymentMethodCard = React.memo(PaymentMethodCard);
