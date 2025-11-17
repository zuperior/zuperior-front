"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { fetchUserAccountsFromDb } from "@/store/slices/mt5AccountSlice";
import { toast } from "sonner";

type Direction = "MT5_TO_WALLET" | "WALLET_TO_MT5";

export function WalletMoveDialog({ open, onOpenChange, direction }: { open: boolean; onOpenChange: (v:boolean)=>void; direction: Direction; }) {
  const dispatch = useAppDispatch();
  const accounts = useSelector((s: RootState) => s.mt5.accounts);
  const filtered = (() => {
    const seen = new Set<string>();
    return (accounts||[]).filter((a:any)=>{
      const type = a?.accountType || 'Live';
      const id = String(a?.accountId ?? '').trim();
      if (type !== 'Live') return false; if (!id || id==='0' || seen.has(id)) return false; seen.add(id); return true;
    });
  })();

  const [mt5, setMt5] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form"|"review"|"done">("form");
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(()=>{ if (open) { dispatch(fetchUserAccountsFromDb() as any); } }, [open, dispatch]);

  // Fetch wallet balance when dialog opens (for WALLET_TO_MT5 direction)
  useEffect(() => {
    if (!open || direction !== 'WALLET_TO_MT5') return;
    (async () => {
      try {
        const token = localStorage.getItem('userToken');
        const r = await fetch('/api/wallet', { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const j = await r.json();
        const bal = Number(j?.data?.balance ?? j?.balance ?? 0);
        setWalletBalance(isNaN(bal) ? 0 : bal);
      } catch { /* ignore */ }
    })();
  }, [open, direction]);

  // Fetch MT5 balances for each account when dialog opens
  useEffect(() => {
    if (!open || !filtered.length) return;
    (async () => {
      const token = localStorage.getItem('userToken');
      const map: Record<string, number> = {};
      await Promise.all(filtered.map(async (acc: any) => {
        try {
          const login = String(acc.accountId);
          const r = await fetch(`/api/mt5/user-profile/${login}`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
          const j = await r.json();
          const data = j?.data || j;
          const bal = Number(data?.Balance ?? data?.balance ?? acc.balance ?? 0);
          map[login] = isNaN(bal) ? 0 : bal;
        } catch { /* ignore */ }
      }));
      setBalances(map);
    })();
  }, [open, filtered.length]);

  const handleClose = (v:boolean) => {
    if (!v) {
      setStep("form"); setMt5(""); setAmount("");
    }
    onOpenChange(v);
  };

  // Calculate available balance based on direction and selected account
  const availableBalance = (() => {
    if (direction === 'MT5_TO_WALLET') {
      if (!mt5) return 0;
      return balances[mt5] ?? 0;
    } else {
      // WALLET_TO_MT5
      return walletBalance;
    }
  })();

  // Format available balance for placeholder
  const placeholderText = availableBalance > 0 
    ? `0 - $${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "Enter amount";

  // Fill amount with max available balance on click
  const handleAmountClick = () => {
    if (availableBalance > 0 && !amount) {
      setAmount(availableBalance.toFixed(2));
    }
  };

  async function submit() {
    const a = parseFloat(amount);
    if (!mt5 || !a || a<=0) { toast.error("Enter valid amount and account"); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const body = JSON.stringify({ mt5AccountId: mt5, amount: a });
      const headers: any = { 'Content-Type': 'application/json' }; if (token) headers.Authorization = `Bearer ${token}`;
      const path = direction === 'MT5_TO_WALLET' ? '/api/wallet/mt5-to-wallet' : '/api/wallet/wallet-to-mt5';
      const r = await fetch(path, { method: 'POST', headers, body });
      const j = await r.json();
      if (j?.success) {
        toast.success('Transfer requested');
        setStep('done');
        // Let the navbar update immediately; final accurate value will be sent by wallet page load()
        try { window.dispatchEvent(new CustomEvent('wallet:refresh')); } catch {}
      }
      else { toast.error(j?.message || 'Transfer failed'); }
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = step === 'form' ? 1 : step === 'review' ? 2 : 3;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-2 border-transparent p-6 text-black dark:text-white rounded-[18px] w-full max-w-lg [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border gap-6">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {direction === 'MT5_TO_WALLET' ? 'Transfer from MT5 to Wallet' : 'Transfer from Wallet to MT5'}
          </DialogTitle>
          {/* Stepper 1-2-3 */}
          <div className="relative w-full mt-3">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-[#392F4F] rounded-full" />
            <div className="absolute top-1/2 -translate-y-1/2 left-0">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ring-1 ${stepIndex>=1? 'bg-[#9F8BCF] text-black ring-[#9F8BCF]/40' : 'bg-[#2F2642] text-white/60 ring-[#594B7A]'}`}>1</div>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ring-1 ${stepIndex>=2? 'bg-[#9F8BCF] text-black ring-[#9F8BCF]/40' : 'bg-[#2F2642] text-white/60 ring-[#594B7A]'}`}>2</div>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-0">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ring-1 ${stepIndex>=3? 'bg-[#9F8BCF] text-black ring-[#9F8BCF]/40' : 'bg-[#2F2642] text-white/60 ring-[#594B7A]'}`}>3</div>
            </div>
          </div>
        </DialogHeader>
        {step === 'form' && (
          <div className="space-y-4">
            <Label className="block text-sm">MT5 Account</Label>
            <Select value={mt5} onValueChange={(val) => {
              setMt5(val);
              // Clear amount when account changes so placeholder updates
              if (direction === 'MT5_TO_WALLET') {
                setAmount("");
              }
            }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {filtered.map((a:any)=> {
                  const bal = balances[String(a.accountId)] ?? a.balance ?? 0;
                  return (
                    <SelectItem key={a.accountId} value={String(a.accountId)}>
                      {a.accountId} (${Number(bal).toFixed(2)})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <div>
              <Label className="block text-sm mb-1">Amount</Label>
              <Input 
                value={amount} 
                onChange={(e)=>setAmount(e.target.value.replace(/[^0-9.]/g,''))} 
                placeholder="Enter amount"
                onClick={handleAmountClick}
                className="cursor-pointer"
              />
              {availableBalance > 0 && (
                <p 
                  onClick={() => {
                    if (availableBalance > 0) {
                      setAmount(availableBalance.toFixed(2));
                    }
                  }}
                  className="text-xs text-[#9F8BCF] mt-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  Available: 0 - ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={()=>handleClose(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-[#6242a5] to-[#9f8bcf]" onClick={()=>setStep('review')} disabled={!mt5 || !amount}>Continue</Button>
            </div>
          </div>
        )}
        {step === 'review' && (
          <div className="space-y-4">
            <DialogDescription>Confirm your transfer details.</DialogDescription>
            <div className="text-sm">MT5 Account: <b>{mt5}</b></div>
            <div className="text-sm">Amount: <b>${amount}</b></div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={()=>setStep('form')}>Back</Button>
              <Button onClick={submit} disabled={loading} className="bg-gradient-to-r from-[#6242a5] to-[#9f8bcf]">{loading? 'Processing...' : 'Confirm'}</Button>
            </div>
          </div>
        )}
        {step === 'done' && (
          <div className="text-center space-y-4">
            <DialogTitle>Request Submitted</DialogTitle>
            <DialogDescription>Your transfer request has been submitted. You will see it reflected shortly.</DialogDescription>
            <Button onClick={()=>handleClose(false)} className="bg-gradient-to-r from-[#6242a5] to-[#9f8bcf]">Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
