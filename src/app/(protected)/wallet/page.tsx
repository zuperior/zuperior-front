"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/store/hooks';
import { fetchUserAccountsFromDb } from '@/store/slices/mt5AccountSlice';
import type { RootState } from '@/store';
import { toast } from 'sonner';
import { TransactionsTable } from '@/components/transactions/TransactionTable';
import { useRouter } from 'next/navigation';
import WalletBalance from '@/components/dashboard/wallet-balance';
import { WalletMoveDialog } from '@/components/wallet/WalletMoveDialog';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { wallet as walletIcon } from '@/lib/sidebar-assets';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function WalletPage() {
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const [wallet, setWallet] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [mt5Id, setMt5Id] = useState('');
  const [mt5IdOut, setMt5IdOut] = useState('');
  const [loadingIn, setLoadingIn] = useState(false);
  const [loadingOut, setLoadingOut] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [walletTx, setWalletTx] = useState<any[]>([]);
  const accounts = useSelector((s: RootState) => s.mt5.accounts);
  const [openIn, setOpenIn] = useState(false);
  const [openOut, setOpenOut] = useState(false);
  const [mt5Balances, setMt5Balances] = useState<Record<string, number>>({});
  const filteredAccounts = useMemo(() => {
    const seen = new Set<string>();
    return (accounts || []).filter((a: any) => {
      const type = a?.accountType || 'Live';
      const id = String(a?.accountId ?? '').trim();
      if (type !== 'Live') return false; // hide demo
      if (!id || id === '0' || seen.has(id)) return false; // sanitize
      seen.add(id);
      return true;
    });
  }, [accounts]);
  const router = useRouter();

  const load = async () => {
    const token = localStorage.getItem('userToken');
    const r = await fetch('/api/wallet', { headers: token ? { Authorization: `Bearer ${token}` } : undefined, cache: 'no-store' });
    const j = await r.json();
    if (j?.success) {
      setWallet(j.data);
      try {
        const bal = Number(j?.data?.balance ?? 0);
        if (!Number.isNaN(bal)) {
          // Notify header/navbar to refresh without a full reload
          window.dispatchEvent(new CustomEvent('wallet:refresh', { detail: { balance: bal } }));
        }
      } catch { }
    }
  };
  const loadTx = async () => {
    setLoadingTx(true);
    const token = localStorage.getItem('userToken');
    const r = await fetch('/api/wallet/transactions?limit=50', { headers: token ? { Authorization: `Bearer ${token}` } : undefined, cache: 'no-store' });
    const j = await r.json();
    if (j?.success) setWalletTx(j.data || []);
    setLoadingTx(false);
  };
  useEffect(() => {
    dispatch(fetchUserAccountsFromDb() as any);
    load();
    loadTx();
    const id = setInterval(() => { load(); }, 15001); // refresh wallet balance every 15s
    const onVis = () => { if (document.visibilityState === 'visible') { load(); loadTx(); } };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [dispatch]);

  const refreshMt5Balances = async () => {
    try {
      const results: Record<string, number> = {};
      await Promise.all(filteredAccounts.map(async (acc: any) => {
        const login = String(acc.accountId);
        const token = localStorage.getItem('userToken');
        const r = await fetch(`/api/mt5/user-profile/${login}`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const j = await r.json();
        const data = j?.data || j;
        const bal = Number(data?.Balance ?? data?.balance ?? acc.balance ?? 0);
        results[login] = isNaN(bal) ? 0 : bal;
      }));
      setMt5Balances(results);
    } catch (e) {
      console.warn('Failed to refresh MT5 balances:', e);
    }
  };

  useEffect(() => { if (filteredAccounts.length) refreshMt5Balances(); }, [filteredAccounts.length]);

  const submit = async () => {
    const a = parseFloat(amount);
    if (!mt5Id || !a || a <= 0) { toast.error('Enter amount and account'); return; }
    setLoadingIn(true);
    const token = localStorage.getItem('userToken');
    const r = await fetch('/api/wallet/mt5-to-wallet', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ mt5AccountId: mt5Id, amount: a }) });
    const j = await r.json();
    if (j?.success) {
      toast.success('Transferred to wallet');
      setAmount('');
      await load();
      await loadTx();
    } else { toast.error(j?.message || 'Transfer failed'); }
    setLoadingIn(false);
  };

  const submitOut = async () => {
    const a = parseFloat(amountOut);
    if (!mt5IdOut || !a || a <= 0) { toast.error('Enter amount and account'); return; }
    setLoadingOut(true);
    const token = localStorage.getItem('userToken');
    const r = await fetch('/api/wallet/wallet-to-mt5', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ mt5AccountId: mt5IdOut, amount: a }) });
    const j = await r.json();
    if (j?.success) {
      toast.success('Transferred to MT5');
      setAmountOut('');
      await load();
      await loadTx();
    } else { toast.error(j?.message || 'Transfer failed'); }
    setLoadingOut(false);
  };

  const maskStyle = {
    WebkitMaskImage:
      "linear-gradient(130deg, rgba(255, 255, 255, 0.1) 10%, rgba(255, 255, 255, 0.25) 100%)",
    maskImage:
      "linear-gradient(130deg, rgba(255, 255, 255, 0.1) 10%, rgba(255, 255, 255, 0.25) 100%)",
    borderRadius: "15px",
    opacity: 0.85,
    inset: 0,
    overflow: "visible",
    position: "absolute",
    zIndex: 0,
  };

  return (
    <div className="p-4 mx-auto w-full max-w-full space-y-6">
      {/* Balance section - 3 cards in a row */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Wallet</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Wallet Balance Card */}
          <div>
            <WalletBalance balance={wallet?.balance ?? 0} />
          </div>

          {/* Wallet Number Card with Icon */}
          <div className="rounded-[15px] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/40 p-6 flex flex-col items-center justify-center text-center min-h-[140px]">
            <div className="mb-3">
              <Image
                src={walletIcon}
                alt="Wallet"
                width={32}
                height={32}
                className="w-8 h-8 opacity-80"
              />
            </div>
            <div className="text-sm opacity-70 mb-1">Wallet Number</div>
            <div className="text-lg font-semibold tracking-tight">{wallet?.walletNumber || '-'}</div>
          </div>

          {/* Graphics Card */}
          <div className="rounded-[15px] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/40 p-6 flex flex-col items-center justify-center text-center min-h-[140px] relative overflow-visible">

            <video
              className="absolute h-20 w-20 opacity-40 left-1/2 -translate-x-1/2 top-8 md:top-12"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="/rotatingCoins.webm" type="video/webm" />
              Your browser does not support the video tag.
            </video>
            <div className="relative z-10 text-sm opacity-70">Integrated</div>
            <div className="relative z-10 text-lg font-semibold tracking-tight">Wallet System</div>
          </div>
        </div>
      </div>

      {/* Marketing Banner */}
      <div className="relative overflow-hidden w-full rounded-[15px] dark:bg-black bg-[#FBFAFC] p-6 md:p-[50px] text-black dark:text-white">
        <h2 className="text-[16px] md:text-[24px] font-medium tracking-tighter leading-6 md:leading-7 capitalize z-10 bg-gradient-to-t from-[rgba(0,0,0,0.15)] to-[rgba(98,66,165,1)] text-transparent bg-clip-text dark:text-[#a14da0] max-w-[55%] md:max-w-full">
          <span className="dark:text-white">
            Powerful Integrated Wallet <br />
            for Seamless Transfer Between Wallet and MT5
          </span>
        </h2>

        <div className="absolute top-1/2 -translate-y-1/2 right-1 md:-top-16 md:-right-15 md:translate-y-16 pointer-events-none">
          <video
            className="h-32 w-32 md:h-60 md:w-60 opacity-90"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/rotatingCoins.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div
          style={maskStyle as React.CSSProperties}
          className="border border-black/50 dark:border-white/75 pointer-events-none"
        />
      </div>

      {/* Transfer chooser cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => setOpenIn(true)} className="rounded-xl p-6 text-left bg-gradient-to-br from-[#1b1426] to-[#221a30] border border-[#2a2139] hover:opacity-90 relative group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm text-white/70 mb-1">Transfer</div>
              <div className="text-lg font-semibold text-white">MT5 to Wallet</div>
              <div className="text-xs text-white/50 mt-2">Move funds into your wallet</div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <ArrowRight className="h-6 w-6 text-white/60 group-hover:text-white/90 transition-colors" />
            </div>
          </div>
        </button>
        <button onClick={() => setOpenOut(true)} className="rounded-xl p-6 text-left bg-gradient-to-br from-[#1b1426] to-[#221a30] border border-[#2a2139] hover:opacity-90 relative group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm text-white/70 mb-1">Transfer</div>
              <div className="text-lg font-semibold text-white">Wallet to MT5</div>
              <div className="text-xs text-white/50 mt-2">Move funds to your trading account</div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <ArrowRight className="h-6 w-6 text-white/60 group-hover:text-white/90 transition-colors" />
            </div>
          </div>
        </button>
      </div>

      <WalletMoveDialog open={openIn} onOpenChange={(v) => { setOpenIn(v); if (!v) { load(); loadTx(); } }} direction="MT5_TO_WALLET" />
      <WalletMoveDialog open={openOut} onOpenChange={(v) => { setOpenOut(v); if (!v) { load(); loadTx(); } }} direction="WALLET_TO_MT5" />

      <div className="rounded-[15px] bg-white dark:bg-gradient-to-r dark:from-[#15101d] dark:to-[#181422] border border-black/10 dark:border-none p-3">
        <h3 className="text-lg font-medium mb-3 text-center md:text-left">Wallet Transactions</h3>
        <TransactionsTable
          loadingTx={loadingTx}
          selectedAccountId={'WALLET'}
          tableData={walletTx.map((tx) => ({
            amount: tx.amount,
            profit: tx.amount,
            comment: tx.description,
            type: tx.type === 'MT5_TO_WALLET' ? 'Internal Transfer In' : tx.type === 'WALLET_TO_MT5' ? 'Internal Transfer Out' : tx.type || 'Transaction',
            status: tx.status,
            open_time: tx.createdAt,
          }))}
        />
      </div>
    </div>
  );
}
