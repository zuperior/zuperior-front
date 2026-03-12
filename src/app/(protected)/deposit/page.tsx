"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { CreditCard, Building2 } from "lucide-react";
import { TextAnimate } from "@/components/ui/text-animate";
import { DepositDialog } from "@/components/deposit/DepositDialog";
import { BankDepositDialog } from "@/components/deposit/BankDepositDialog";
import { UnipaymentDialog } from "@/components/deposit/UnipaymentDialog";
import { DigiPay247Dialog } from "@/components/deposit/DigiPay247Dialog";
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
  const [unipaymentDisplayNames, setUnipaymentDisplayNames] = useState<Record<string, string>>({});
  const [manualDepositDialogs, setManualDepositDialogs] = useState<Record<string, boolean>>({});
  const [digipay247UpiOpen, setDigipay247UpiOpen] = useState(false);

  // Debug: Monitor DigiPay247 dialog state
  useEffect(() => {
    console.log('[Deposit Page] digipay247UpiOpen state changed:', digipay247UpiOpen);
  }, [digipay247UpiOpen]);
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

          // Store display names for Unipayment methods
          const displayNames: Record<string, string> = {};
          j.methods.forEach((m: any) => {
            if (m.method_key === 'unipayment_crypto') displayNames.crypto = m.display_name || 'Crypto';
            if (m.method_key === 'unipayment_card') displayNames.card = m.display_name || 'Credit/Debit Cards';
            if (m.method_key === 'unipayment_google_apple_pay') displayNames.google_apple_pay = m.display_name || 'Google/Apple Pay';
            if (m.method_key === 'unipayment_upi') displayNames.upi = m.display_name || 'UPI';
          });
          setUnipaymentDisplayNames(displayNames);
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

  // Helper function to resolve image paths
  const resolveImagePath = (iconPath: string | null | undefined, fallback: string): string => {
    // If no icon path provided, use fallback
    if (!iconPath || iconPath.trim() === '') {
      return fallback;
    }

    const trimmedPath = iconPath.trim();

    // If it's already a full URL, return as is
    if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
      return trimmedPath;
    }

    // If it starts with /payment_method_images/, it's from admin backend, not server
    if (trimmedPath.startsWith('/payment_method_images/')) {
      // Payment method images are ALWAYS served from admin backend
      // Use explicit admin backend URL from environment variable
      const adminBackendUrl = process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL ||
        process.env.NEXT_PUBLIC_ADMIN_API_URL ||
        'http://localhost:5003';
      console.log('[resolveImagePath] Payment method image:', { trimmedPath, adminBackendUrl, fullUrl: `${adminBackendUrl}${trimmedPath}` });
      return `${adminBackendUrl}${trimmedPath}`;
    }

    // If it's a relative path starting with /, check if it's a backend path or frontend public path
    if (trimmedPath.startsWith('/')) {
      // Check if it's a known backend path
      if (trimmedPath.startsWith('/kyc_proofs/') || trimmedPath.startsWith('/uploads/')) {
        // These are from server backend (port 5001)
        const serverBackendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace('/api', '') || 'http://localhost:5001';
        return `${serverBackendUrl}${trimmedPath}`;
      }
      // Otherwise, assume it's a frontend public path (Next.js serves from /public folder)
      return trimmedPath;
    }

    // Relative path without leading slash - treat as backend path (server, not admin)
    const serverBackendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace('/api', '') || 'http://localhost:5001';
    return `${serverBackendUrl}/${trimmedPath}`;
  };

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
      const method = enabledPaymentMethods.find(m => m.method_key === 'unipayment_crypto');
      const icon = method?.icon_path
        ? resolveImagePath(method.icon_path, '/payment_method_images/crypto.png')
        : resolveImagePath('/payment_method_images/crypto.png', '/payment_method_images/crypto.png');
      const displayName = method?.display_name || 'Crypto';
      console.log('[Deposit Page] Unipayment Crypto:', { method_key: 'unipayment_crypto', display_name: method?.display_name, icon_path: method?.icon_path, resolved_icon: icon });
      items.push({ type: 'unipayment', method: 'crypto', data: { id: 'UNIPAYMENT_CRYPTO', name: displayName, icon }, paymentMethod: method });
    }
    if (isMethodEnabled('unipayment_card')) {
      const method = enabledPaymentMethods.find(m => m.method_key === 'unipayment_card');
      const icon = method?.icon_path
        ? resolveImagePath(method.icon_path, '/payment_method_images/pm_card.png')
        : resolveImagePath('/payment_method_images/pm_card.png', '/payment_method_images/pm_card.png');
      const displayName = method?.display_name || 'Credit/Debit Cards';
      console.log('[Deposit Page] Unipayment Card:', { method_key: 'unipayment_card', display_name: method?.display_name, icon_path: method?.icon_path, resolved_icon: icon });
      items.push({ type: 'unipayment', method: 'card', data: { id: 'UNIPAYMENT_CARD', name: displayName, icon }, paymentMethod: method });
    }
    if (isMethodEnabled('unipayment_google_apple_pay')) {
      const method = enabledPaymentMethods.find(m => m.method_key === 'unipayment_google_apple_pay');
      const icon = method?.icon_path
        ? resolveImagePath(method.icon_path, '/payment_method_images/pm_googleapple.png')
        : resolveImagePath('/payment_method_images/pm_googleapple.png', '/payment_method_images/pm_googleapple.png');
      const displayName = method?.display_name || 'Google/Apple Pay';
      console.log('[Deposit Page] Unipayment Google/Apple Pay:', { method_key: 'unipayment_google_apple_pay', display_name: method?.display_name, icon_path: method?.icon_path, resolved_icon: icon });
      items.push({ type: 'unipayment', method: 'google_apple_pay', data: { id: 'UNIPAYMENT_GOOGLE_APPLE', name: displayName, icon }, paymentMethod: method });
    }
    if (isMethodEnabled('unipayment_upi')) {
      const method = enabledPaymentMethods.find(m => m.method_key === 'unipayment_upi');
      const icon = method?.icon_path
        ? resolveImagePath(method.icon_path, '/payment_method_images/pm_upi.png')
        : resolveImagePath('/payment_method_images/pm_upi.png', '/payment_method_images/pm_upi.png');
      const displayName = method?.display_name || 'UPI';
      console.log('[Deposit Page] Unipayment UPI:', { method_key: 'unipayment_upi', display_name: method?.display_name, icon_path: method?.icon_path, resolved_icon: icon });
      items.push({ type: 'unipayment', method: 'upi', data: { id: 'UNIPAYMENT_UPI', name: displayName, icon }, paymentMethod: method });
    }
    // Add DigiPay247 UPI if enabled (only once, check for duplicates)
    if (isMethodEnabled('digipay247_upi')) {
      // Check if DigiPay247 UPI is already in items to prevent duplicates
      const alreadyAdded = items.some(item => item.type === 'digipay247' && item.data?.id === 'DIGIPAY247_UPI');
      if (!alreadyAdded) {
        const method = enabledPaymentMethods.find(m => m.method_key === 'digipay247_upi');
        const icon = method?.icon_path
          ? resolveImagePath(method.icon_path, '/payment_method_images/pm_upi.png')
          : resolveImagePath('/payment_method_images/pm_upi.png', '/payment_method_images/pm_upi.png');
        const displayName = method?.display_name || 'SecurePayee UPI';
        console.log('[Deposit Page] DigiPay247 UPI:', { method_key: 'digipay247_upi', display_name: method?.display_name, icon_path: method?.icon_path, resolved_icon: icon });
        items.push({ type: 'digipay247', method: 'upi', data: { id: 'DIGIPAY247_UPI', name: displayName, icon }, paymentMethod: method });
      } else {
        console.log('[Deposit Page] DigiPay247 UPI already added, skipping duplicate');
      }
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
      // Get bank transfer icon from payment methods if available
      const bankTransferMethod = enabledPaymentMethods.find(m =>
        m.method_key === 'bank_transfer' || m.method_key === 'wire_transfer'
      );
      console.log('[Deposit Page] Bank transfer method found:', {
        method: bankTransferMethod,
        icon_path: bankTransferMethod?.icon_path,
        display_name: bankTransferMethod?.display_name
      });
      // Always resolve to an image URL, never use 'bank' string
      const bankIcon = bankTransferMethod?.icon_path
        ? resolveImagePath(bankTransferMethod.icon_path, '/payment_method_images/bank.png')
        : resolveImagePath('/payment_method_images/bank.png', '/payment_method_images/bank.png'); // Fallback to default bank.png
      const displayName = bankTransferMethod?.display_name || 'Bank Transfer';
      console.log('[Deposit Page] Bank transfer icon resolved:', bankIcon, 'display_name:', displayName);
      items.push({ type: 'bank_transfer', data: { id: 'BANK_TRANSFER', name: displayName, icon: bankIcon }, paymentMethod: bankTransferMethod });
    }

    // Add Cregis crypto options only if enabled
    cryptocurrencies.forEach((crypto) => {
      if (crypto.id === 'USDT-TRC20' && isMethodEnabled('cregis_usdt_trc20')) {
        const method = enabledPaymentMethods.find(m => m.method_key === 'cregis_usdt_trc20');
        const icon = method?.icon_path
          ? resolveImagePath(method.icon_path, '/payment_method_images/trc20.png')
          : resolveImagePath('/payment_method_images/trc20.png', '/payment_method_images/trc20.png');
        const displayName = method?.display_name || crypto.name;
        console.log('[Deposit Page] Cregis USDT-TRC20:', { method_key: 'cregis_usdt_trc20', display_name: method?.display_name, icon_path: method?.icon_path, resolved_icon: icon });
        items.push({ type: "crypto", data: { ...crypto, name: displayName, icon }, paymentMethod: method });
      }
      if (crypto.id === 'USDT-BEP20' && isMethodEnabled('cregis_usdt_bep20')) {
        const method = enabledPaymentMethods.find(m => m.method_key === 'cregis_usdt_bep20');
        const icon = method?.icon_path
          ? resolveImagePath(method.icon_path, '/payment_method_images/bep20.png')
          : resolveImagePath('/payment_method_images/bep20.png', '/payment_method_images/bep20.png');
        const displayName = method?.display_name || crypto.name;
        console.log('[Deposit Page] Cregis USDT-BEP20:', { method_key: 'cregis_usdt_bep20', display_name: method?.display_name, icon_path: method?.icon_path, resolved_icon: icon });
        items.push({ type: "crypto", data: { ...crypto, name: displayName, icon }, paymentMethod: method });
      }
    });

    // Add manual gateway methods and generic 'manual' method
    enabledPaymentMethods.forEach((method) => {
      // Check if it's a manual gateway method OR the generic 'manual' method
      const isManualGateway = method.method_key?.startsWith('manual_gateway_');
      const isManualType = method.method_type === 'manual';
      const isManualKey = method.method_key === 'manual';

      if (isManualGateway || isManualType || isManualKey) {
        const metadata = method.metadata || {};
        const gatewayType = metadata.type || method.method_type;
        const displayName = method.display_name || metadata.name || 'Manual Deposit';
        const rawIconPath = method.icon_path || metadata.icon_url;

        console.log('[Deposit Page] Processing manual method:', {
          method_key: method.method_key,
          method_type: method.method_type,
          gatewayType,
          displayName,
          isManualGateway,
          isManualType,
          isManualKey
        });

        // Skip only the main bank_transfer/wire_transfer method keys (not manual gateways with bank_transfer type)
        // Manual gateways with bank_transfer type should still be shown as separate options
        if ((method.method_key === 'bank_transfer' || method.method_key === 'wire_transfer') && !isManualGateway) {
          console.log('[Deposit Page] Skipping main bank_transfer method (already handled above):', method.method_key);
          return;
        }

        // For bank_transfer type manual gateways, add as manual bank transfer option
        if (gatewayType === 'bank_transfer' || gatewayType === 'wire') {
          // Get bank transfer icon from payment methods if available, or use 'bank' for Building2 icon
          const bankTransferMethod = enabledPaymentMethods.find(m =>
            m.method_key === 'bank_transfer' || m.method_key === 'wire_transfer'
          );
          // Always resolve to an image URL, never use 'bank' string
          const bankIcon = rawIconPath
            ? resolveImagePath(rawIconPath, '/payment_method_images/bank.png')
            : (bankTransferMethod?.icon_path
              ? resolveImagePath(bankTransferMethod.icon_path, '/payment_method_images/bank.png')
              : resolveImagePath('/payment_method_images/bank.png', '/payment_method_images/bank.png'));
          items.push({
            type: 'manual_bank_transfer',
            method_key: method.method_key,
            data: {
              id: method.method_key,
              name: displayName,
              icon: bankIcon,
              gateway: manualGateways[method.method_key]
            },
            paymentMethod: method
          });
          console.log('[Deposit Page] Added manual bank transfer method:', method.method_key);
        }
        // For UPI type, add as UPI option
        else if (gatewayType === 'upi') {
          const iconPath = rawIconPath
            ? resolveImagePath(rawIconPath, '/payment_method_images/pm_upi.png')
            : resolveImagePath('/payment_method_images/pm_upi.png', '/pm_upi.png');
          items.push({
            type: 'manual_upi',
            method_key: method.method_key,
            data: {
              id: method.method_key,
              name: displayName,
              icon: iconPath,
              gateway: manualGateways[method.method_key]
            },
            paymentMethod: method
          });
          console.log('[Deposit Page] Added manual UPI method:', method.method_key);
        }
        // For crypto type, add as crypto option
        else if (gatewayType === 'crypto') {
          const iconPath = rawIconPath
            ? resolveImagePath(rawIconPath, '/payment_method_images/crypto.png')
            : resolveImagePath('/payment_method_images/crypto.png', '/crypto.png');
          items.push({
            type: 'manual_crypto',
            method_key: method.method_key,
            data: {
              id: method.method_key,
              name: displayName,
              icon: iconPath,
              gateway: manualGateways[method.method_key]
            },
            paymentMethod: method
          });
          console.log('[Deposit Page] Added manual crypto method:', method.method_key);
        }
        // For other types (including generic 'manual'), add as generic manual deposit
        else {
          const iconPath = rawIconPath
            ? resolveImagePath(rawIconPath, '/payment_method_images/manual.png')
            : resolveImagePath('/payment_method_images/manual.png', '/manual.png');
          items.push({
            type: 'manual',
            method_key: method.method_key,
            data: {
              id: method.method_key,
              name: displayName,
              icon: iconPath,
              gateway: manualGateways[method.method_key]
            },
            paymentMethod: method
          });
          console.log('[Deposit Page] Added generic manual method:', method.method_key);
        }
      } else {
        // Log methods that don't match manual criteria but might be enabled
        console.log('[Deposit Page] Method not processed as manual:', {
          method_key: method.method_key,
          method_type: method.method_type,
          is_enabled: method.is_enabled
        });
      }
    });

    // Check for any enabled methods that weren't processed above
    const processedMethodKeys = new Set(items.map(item => {
      if (item.type === 'unipayment') return `unipayment_${item.method}`;
      if (item.type === 'bank_transfer') return 'bank_transfer';
      if (item.type === 'crypto' && item.data?.id === 'USDT-TRC20') return 'cregis_usdt_trc20';
      if (item.type === 'crypto' && item.data?.id === 'USDT-BEP20') return 'cregis_usdt_bep20';
      if (item.type === 'digipay247') return 'digipay247_upi';
      return item.method_key || item.data?.id;
    }));

    const unprocessedMethods = enabledPaymentMethods.filter(m => {
      const key = m.method_key;
      // Skip if already processed
      if (processedMethodKeys.has(key)) return false;
      // Skip if it's a method we explicitly handle above
      if (['unipayment_crypto', 'unipayment_card', 'unipayment_google_apple_pay', 'unipayment_upi',
        'bank_transfer', 'wire_transfer', 'cregis_usdt_trc20', 'cregis_usdt_bep20', 'digipay247_upi'].includes(key)) {
        return false;
      }
      // Skip if it's a manual gateway (should have been processed above)
      if (key?.startsWith('manual_gateway_') || m.method_type === 'manual' || key === 'manual') {
        return false;
      }
      return true;
    });

    if (unprocessedMethods.length > 0) {
      console.warn('[Deposit Page] Found unprocessed enabled methods:', unprocessedMethods.map(m => ({
        method_key: m.method_key,
        method_type: m.method_type,
        display_name: m.display_name
      })));

      // Add unprocessed methods as generic manual deposits
      unprocessedMethods.forEach((method) => {
        const displayName = method.display_name || method.method_key || 'Deposit';
        const iconPath = method.icon_path
          ? resolveImagePath(method.icon_path, '/payment_method_images/manual.png')
          : resolveImagePath('/payment_method_images/manual.png', '/payment_method_images/manual.png');
        items.push({
          type: 'manual',
          method_key: method.method_key,
          data: {
            id: method.method_key,
            name: displayName,
            icon: iconPath,
            gateway: manualGateways[method.method_key]
          },
          paymentMethod: method
        });
        console.log('[Deposit Page] Added unprocessed method as generic manual:', method.method_key);
      });
    }

    console.log('[Deposit Page] Final filtered items count:', items.length);
    // Remove duplicates - keep only the first occurrence of each unique item
    const uniqueItems = items.filter((item, index, self) => {
      // For DigiPay247, check by type and data.id
      if (item.type === 'digipay247') {
        return index === self.findIndex(i => i.type === 'digipay247' && i.data?.id === item.data?.id);
      }
      // For other items, check by type and method
      return index === self.findIndex(i => i.type === item.type && i.method === item.method && i.data?.id === item.data?.id);
    });

    console.log('[Deposit Page] Final filtered items (after deduplication):', uniqueItems.map(i => ({
      type: i.type,
      method: i.method,
      method_key: i.method_key,
      name: i.data?.name
    })));

    return uniqueItems;
  }, [cryptocurrencies, bankTransferAvailable, enabledPaymentMethods, manualGateways]);

  // Show loading state while fetching crypto data and payment methods
  if (isLoadingCrypto || isLoadingPaymentMethods) {
    return <CardLoader message="" />;
  }

  // Helper function to format limits from min/max values
  const formatLimits = (minLimit: number | null | undefined, maxLimit: number | null | undefined): string => {
    if (minLimit !== null && minLimit !== undefined && maxLimit !== null && maxLimit !== undefined) {
      // Format with commas for thousands
      const formattedMin = minLimit.toLocaleString('en-US', { maximumFractionDigits: 0 });
      const formattedMax = maxLimit.toLocaleString('en-US', { maximumFractionDigits: 0 });
      return `$${formattedMin}-$${formattedMax}`;
    }
    if (minLimit !== null && minLimit !== undefined) {
      const formattedMin = minLimit.toLocaleString('en-US', { maximumFractionDigits: 0 });
      return `$${formattedMin}+`;
    }
    if (maxLimit !== null && maxLimit !== undefined) {
      const formattedMax = maxLimit.toLocaleString('en-US', { maximumFractionDigits: 0 });
      return `Up to $${formattedMax}`;
    }
    return "Not set";
  };

  // Helper to get metadata for payment methods
  // First checks database limits (min_limit/max_limit), then metadata, then falls back to hardcoded values
  const getPaymentMethodMetadata = (id: string, type: string, paymentMethod?: any) => {
    // First priority: Check if paymentMethod has min_limit and max_limit from database
    let limitsFromDb: string | null = null;
    if (paymentMethod && ((paymentMethod.min_limit !== null && paymentMethod.min_limit !== undefined) ||
      (paymentMethod.max_limit !== null && paymentMethod.max_limit !== undefined))) {
      limitsFromDb = formatLimits(paymentMethod.min_limit, paymentMethod.max_limit);
    }

    // Second priority: Check if metadata exists in the payment method object
    let metadataFromJson: any = {};
    if (paymentMethod?.metadata) {
      let metadata = paymentMethod.metadata;

      // Handle string metadata (should be parsed, but just in case)
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch {
          metadata = {};
        }
      }

      metadataFromJson = metadata;
    }

    // Build result object, prioritizing database limits over metadata limits
    const result: any = {};
    if (metadataFromJson.processingTime !== undefined) {
      result.processingTime = metadataFromJson.processingTime;
    }
    if (metadataFromJson.fee !== undefined) {
      result.fee = metadataFromJson.fee;
    }
    // Use database limits if available, otherwise use metadata limits, otherwise fallback
    if (limitsFromDb && limitsFromDb !== "Not set") {
      result.limits = limitsFromDb;
    } else if (metadataFromJson.limits !== undefined) {
      result.limits = metadataFromJson.limits;
    }
    if (metadataFromJson.recommended !== undefined) {
      result.recommended = metadataFromJson.recommended;
    }

    // If we have at least one metadata field, use it and fill in defaults for missing ones
    if (Object.keys(result).length > 0 || limitsFromDb) {
      return {
        processingTime: result.processingTime || "Instant",
        fee: result.fee || "0%",
        limits: result.limits || limitsFromDb || "Not set",
        // Handle recommended: use explicit false if set, otherwise default to false
        recommended: result.recommended === true || result.recommended === 'true' || result.recommended === 1
      };
    }

    // Fallback to hardcoded values based on ID and type (only if no database limits)
    const normalizedId = (id || '').toUpperCase();
    const normalizedType = (type || '').toLowerCase();

    if (normalizedId.includes('USDT') || normalizedId.includes('TRC20') || normalizedId.includes('ERC20') || normalizedId.includes('BEP20')) {
      return {
        processingTime: "Instant - 15 minutes",
        fee: "0%",
        limits: "10 - 200,000 USD",
        recommended: false
      };
    }

    if (normalizedId === 'BTC' || normalizedId === 'BITCOIN') {
      return {
        processingTime: "Instant - 1 hour",
        fee: "0%",
        limits: "10 - 200,000 USD",
        recommended: false
      };
    }

    if (normalizedId === 'ETH' || normalizedId === 'ETHEREUM') {
      return {
        processingTime: "Instant - 15 minutes",
        fee: "0%",
        limits: "10 - 200,000 USD",
        recommended: false
      };
    }

    if (normalizedId === 'TRX' || normalizedId === 'TRON') {
      return {
        processingTime: "Instant - 15 minutes",
        fee: "0%",
        limits: "10 - 200,000 USD",
        recommended: false
      };
    }

    if (normalizedType === 'bank_transfer' || normalizedId.includes('BANK')) {
      return {
        processingTime: "1 - 3 business days",
        fee: "0%",
        limits: "100 - 50,000 USD",
        recommended: false
      };
    }

    if (normalizedId.includes('BINANCE') || normalizedId.includes('PAY')) {
      return {
        processingTime: "Instant - 30 minutes",
        fee: "0%",
        limits: "100 - 20,000 USD",
        recommended: false
      };
    }

    // Default for others
    return {
      processingTime: "Instant",
      fee: "0%",
      limits: "50 - 10,000 USD",
      recommended: false
    };
  };

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
            className="text-[26px] md:text-[34px] leading-[30px] font-bold text-black dark:text-white/85"
          >
            Deposit Funds
          </TextAnimate>
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
                const metadata = getPaymentMethodMetadata(item.data.id, item.type, item.paymentMethod);
                return (
                  <MemoizedPaymentMethodCard
                    key="BANK_TRANSFER"
                    onOpenNewAccount={() => setBankDialogOpen(true)}
                    icon={item.data.icon}
                    name={item.data.name}
                    {...metadata}
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
                const metadata = getPaymentMethodMetadata(item.data.id, item.type, item.paymentMethod);
                return (
                  <MemoizedPaymentMethodCard
                    key={item.data.id}
                    onOpenNewAccount={handlers[method] || (() => { })}
                    icon={item.data.icon}
                    name={item.data.name}
                    {...metadata}
                  />
                );
              }
              if (item.type === 'digipay247') {
                const metadata = getPaymentMethodMetadata(item.data.id, item.type, item.paymentMethod);
                const handleClick = () => {
                  console.log('[Deposit Page] DigiPay247 card clicked, opening dialog');
                  console.log('[Deposit Page] Current digipay247UpiOpen state:', digipay247UpiOpen);
                  setDigipay247UpiOpen(true);
                  console.log('[Deposit Page] Set digipay247UpiOpen to true');
                };
                return (
                  <MemoizedPaymentMethodCard
                    key={item.data.id}
                    onOpenNewAccount={handleClick}
                    icon={item.data.icon}
                    name={item.data.name}
                    {...metadata}
                  />
                );
              }
              // Handle manual gateway methods
              if (item.type === 'manual' || item.type === 'manual_upi' || item.type === 'manual_crypto' || item.type === 'manual_bank_transfer') {
                const metadata = getPaymentMethodMetadata(item.data.id, item.type, item.paymentMethod);
                return (
                  <MemoizedPaymentMethodCard
                    key={item.data.id}
                    onOpenNewAccount={() => {
                      setManualDepositDialogs(prev => ({ ...prev, [item.data.id]: true }));
                    }}
                    icon={item.data.icon}
                    name={item.data.name}
                    {...metadata}
                  />
                );
              }
              const crypto = item.data as Cryptocurrency;
              const metadata = getPaymentMethodMetadata(crypto.id, 'crypto', item.paymentMethod);
              return (
                <MemoizedPaymentMethodCard
                  key={crypto.id}
                  onOpenNewAccount={() => handleCryptoSelect(crypto)}
                  icon={crypto.icon}
                  name={crypto.name}
                  {...metadata}
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
        <BankDepositDialog
          open={bankDialogOpen}
          onOpenChange={setBankDialogOpen}
          lifetimeDeposit={lifetimeDeposit}
          displayName={(() => {
            const bankMethod = enabledPaymentMethods.find(m =>
              m.method_key === 'bank_transfer' || m.method_key === 'wire_transfer'
            );
            return bankMethod?.display_name || 'Bank Transfer';
          })()}
        />

        {/* Unipayment Dialogs */}
        {/* DigiPay247 Dialog */}
        <DigiPay247Dialog
          open={digipay247UpiOpen}
          onOpenChange={setDigipay247UpiOpen}
          lifetimeDeposit={lifetimeDeposit}
          displayName={(() => {
            const digipay247Method = enabledPaymentMethods.find(m => m.method_key === 'digipay247_upi');
            return digipay247Method?.display_name || 'SecurePayee UPI';
          })()}
        />

        <UnipaymentDialog
          open={unipaymentCryptoOpen}
          onOpenChange={setUnipaymentCryptoOpen}
          paymentMethod="crypto"
          availableCryptos={cryptocurrencies}
          lifetimeDeposit={lifetimeDeposit}
          displayName={unipaymentDisplayNames.crypto}
        />
        <UnipaymentDialog
          open={unipaymentCardOpen}
          onOpenChange={setUnipaymentCardOpen}
          paymentMethod="card"
          lifetimeDeposit={lifetimeDeposit}
          displayName={unipaymentDisplayNames.card}
        />
        <UnipaymentDialog
          open={unipaymentGoogleAppleOpen}
          onOpenChange={setUnipaymentGoogleAppleOpen}
          paymentMethod="google_apple_pay"
          lifetimeDeposit={lifetimeDeposit}
          displayName={unipaymentDisplayNames.google_apple_pay}
        />
        <UnipaymentDialog
          open={unipaymentUpiOpen}
          onOpenChange={setUnipaymentUpiOpen}
          paymentMethod="upi"
          lifetimeDeposit={lifetimeDeposit}
          displayName={unipaymentDisplayNames.upi}
        />

        {/* Manual Gateway Dialogs */}
        {enabledPaymentMethods
          .filter(m => {
            const isManualGateway = m.method_key?.startsWith('manual_gateway_');
            const isManualType = m.method_type === 'manual';
            const isManualKey = m.method_key === 'manual';
            // Include manual gateways, but skip the main bank_transfer/wire_transfer method keys
            return (isManualGateway || isManualType || isManualKey) &&
              m.method_key !== 'bank_transfer' &&
              m.method_key !== 'wire_transfer';
          })
          .map((method) => {
            // Determine gateway type from method metadata or method_type
            const metadata = method.metadata || {};
            const gatewayType = metadata.type || method.method_type || 'bank_transfer';

            return (
              <BankDepositDialog
                key={method.method_key}
                open={manualDepositDialogs[method.method_key] || false}
                onOpenChange={(open) => {
                  setManualDepositDialogs(prev => ({ ...prev, [method.method_key]: open }));
                }}
                lifetimeDeposit={lifetimeDeposit}
                gatewayType={gatewayType}
                methodKey={method.method_key}
                displayName={method.display_name}
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
  processingTime = "Instant - 15 minutes",
  fee = "0%",
  limits = "10 - 200,000 USD",
  recommended = false,
}: {
  icon: string;
  name: string;
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
    console.error(`[PaymentMethodCard] Failed to load image: ${imageSrc}`);
    console.error(`[PaymentMethodCard] Image URL was: ${imageSrc}`);

    // Don't try fallback - just show placeholder icon
    // This prevents all methods from showing the same fallback image
    setImageError(true);
    target.style.display = 'none';
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('[PaymentMethodCard] Card clicked, calling onOpenNewAccount');
    onOpenNewAccount();
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between rounded-xl bg-white dark:bg-[#0d0414] border border-gray-200 dark:border-gray-800 p-6 cursor-pointer transition-all hover:shadow-lg hover:border-purple-500/50 dark:hover:border-purple-500/50"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            {imageError ? (
              <div className="h-full w-full flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <CreditCard className="h-5 w-5 text-gray-400" />
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
            {/* Small secondary icon overlay if needed (like the ETH icon on Tether in the screenshot) - skipping for now as we don't have secondary icon data */}
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
            {name}
          </h3>
        </div>
        {recommended && (
          <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
            Recommended
          </span>
        )}
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
      </div>
    </div>
  );
}

const MemoizedPaymentMethodCard = React.memo(PaymentMethodCard);
