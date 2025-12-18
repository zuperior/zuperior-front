"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { TextAnimate } from "@/components/ui/text-animate";
import { DepositDialog } from "@/components/deposit/DepositDialog";
import { BankDepositDialog } from "@/components/deposit/BankDepositDialog";
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
  const [wireAvailable, setWireAvailable] = useState(false);
  const dispatch = useAppDispatch();
  const [lifetimeDeposit, setLifetimeDeposit] = useState<number>(0);
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(true);

  useEffect(() => {
    // Hardcoded USDT crypto options with TRC20 and BEP20 networks
    const cryptoList: Cryptocurrency[] = [
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
    ];

    setCryptocurrencies(cryptoList);
    setIsLoadingCrypto(false);
  }, []);

  useEffect(() => {
    // determine if wire gateway exists
    (async () => {
      try {
        const token = localStorage.getItem('userToken');
        const r = await fetch('/api/manual-gateway?type=wire', { cache: 'no-store', headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
        const j = await r.json();
        setWireAvailable(Boolean(j?.success));
      } catch (_) { setWireAvailable(false); }
    })();
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
    // Always open the regular deposit dialog (QR option removed)
    setDepositDialogOpen(true);
  }, []);

  // Filter items - show USDT TRC20 and BEP20 crypto options
  const filteredItems = useMemo(() => {
    const items: any[] = cryptocurrencies.map((crypto) => ({ type: "crypto", data: crypto }));
    if (wireAvailable) items.unshift({ type: 'wire', data: { id: 'WIRE', name: 'Wire Transfer', icon: '/bank.png' } });
    return items;
  }, [cryptocurrencies, wireAvailable]);

  // Show loading state while fetching crypto data
  if (isLoadingCrypto) {
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

        {/* Payment Cards - USDT TRC20 and BEP20 */}
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            if (item.type === 'wire') {
              return (
                <MemoizedPaymentMethodCard
                  key="WIRE"
                  onOpenNewAccount={() => setBankDialogOpen(true)}
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

        {/* Dialogs - USDT TRC20 and BEP20 */}
        <DepositDialog
          open={depositDialogOpen}
          onOpenChange={setDepositDialogOpen}
          selectedCrypto={selectedCrypto}
          lifetimeDeposit={lifetimeDeposit}
        />
        {/* Wire Transfer Dialog */}
        <BankDepositDialog open={bankDialogOpen} onOpenChange={setBankDialogOpen} lifetimeDeposit={lifetimeDeposit} />
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
        <Image
          className="h-10 w-10"
          src={icon}
          alt={name}
          width={40}
          height={40}
        />
        <h3 className="mt-4 text-[18px] font-bold text-black dark:text-white">
          {name}
        </h3>
      </div>
    </div>
  );
}

const MemoizedPaymentMethodCard = React.memo(PaymentMethodCard);
