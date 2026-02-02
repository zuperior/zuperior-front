"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TradingLoader from "@/components/transactions/TradingLoader";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ArrowLeft, Loader2 } from "lucide-react";

function DepositSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState("Verifying payment...");

  // DigiPay sends 'tr' (merchant_txn_id)
  const merchantTxnId = searchParams.get("tr") || searchParams.get("id");

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 30; // Poll for 90 seconds (3s * 30)

    const checkStatus = async () => {
      try {
        attempts++;
        const token = localStorage.getItem('userToken');
        if (!token) {
          setStatus('failed');
          setMessage("Authentication required. Please login.");
          return;
        }

        let depositId = null;

        // Step 1: Lookup Deposit ID if using merchantTxnId (tr)
        if (merchantTxnId) {
          try {
            // Try treating it as merchantTxnId first
            const lookupRes = await fetch(`/api/deposit/digipay247/lookup/${merchantTxnId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (lookupRes.ok) {
              const data = await lookupRes.json();
              if (data.success && data.depositId) {
                depositId = data.depositId;
              }
            }
          } catch (e) {
            console.error("Lookup error", e);
          }
        }

        // If lookup failed, maybe the user passed ID directly?
        if (!depositId) {
          // Can't proceed without ID
          if (attempts > 5) { // Give it a few tries in case backend replication lag
            setStatus('failed');
            setMessage("Could not find transaction details.");
            clearInterval(pollingInterval);
          }
          return;
        }

        // Step 2: Poll Status
        const res = await fetch(`/api/deposit/digipay247/status/${depositId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const depStatus = data.data?.deposit?.status;
          const depAmount = data.data?.deposit?.amount;
          const depCurrency = data.data?.deposit?.currency || 'USD';

          if (depStatus === 'completed') {
            setStatus('success');
            setMessage("Deposit completed and funds credited to MT5!");
            clearInterval(pollingInterval);
          } else if (depStatus === 'rejected' || depStatus === 'failed') {
            setStatus('failed');
            setMessage("Payment failed or rejected.");
            clearInterval(pollingInterval);
          } else if (depStatus === 'approved') {
            // Backend logic will catch this on next poll and upgrade to completed
            if (depAmount) {
              setMessage(`Payment approved. Crediting ${depCurrency} ${depAmount} to MT5 account...`);
            } else {
              setMessage("Payment approved. Crediting MT5 account...");
            }
          } else {
            setMessage("Processing payment status...");
          }
        }
      } catch (err) {
        console.error(err);
      }

      if (attempts >= maxAttempts && status === 'loading') {
        setStatus('failed');
        setMessage("Verification timed out. Please check your transaction history.");
        clearInterval(pollingInterval);
      }
    };

    if (merchantTxnId) {
      checkStatus(); // Initial check
      pollingInterval = setInterval(checkStatus, 3000);
    } else {
      setStatus('failed');
      setMessage("Invalid transaction parameters.");
    }

    return () => clearInterval(pollingInterval);
  }, [merchantTxnId]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <TradingLoader />
        <h2 className="text-2xl font-bold dark:text-white mt-4">{message}</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Please do not close this window. We are verifying your payment with the gateway and crediting your trading account.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-3xl font-bold dark:text-white">Deposit Successful!</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-md">
          Your payment has been verified and the funds have been added to your MT5 account.
        </p>
        <div className="flex gap-4 mt-8">
          <Button onClick={() => router.push('/dashboard')} variant="outline" className="min-w-[140px]">
            Dashboard
          </Button>
          <Button onClick={() => router.push('/transactions')} className="min-w-[140px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            View Transaction
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
        <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-3xl font-bold dark:text-white">Verification Failed</h2>
      <p className="text-gray-600 dark:text-gray-300 max-w-md">
        {message}
      </p>
      <div className="flex gap-4 mt-8">
        <Button onClick={() => router.push('/deposit')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Try Again
        </Button>
        <Button onClick={() => router.push('/dashboard')} variant="default">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

export default function DepositSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>}>
        <DepositSuccessContent />
      </Suspense>
    </div>
  );
}
