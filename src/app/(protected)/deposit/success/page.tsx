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
  const [message, setMessage] = useState("Payment Successful! Verifying details...");
  const [mt5Id, setMt5Id] = useState<string | null>(null);
  const [depositData, setDepositData] = useState<any>(null);

  // DigiPay sends 'tr' (merchant_txn_id)
  const merchantTxnId = searchParams.get("tr") || searchParams.get("id");

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 40; // Poll for 120 seconds (3s * 40)

    const checkStatus = async () => {
      try {
        attempts++;
        const token = localStorage.getItem('userToken');
        if (!token) {
          setStatus('failed');
          setMessage("Authentication required. Please login.");
          return;
        }

        const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';
        let depositId = depositData?.id;

        // Step 1: Lookup Deposit ID if using merchantTxnId (tr) and we don't have it yet
        if (merchantTxnId && !depositId) {
          try {
            // Try treating it as merchantTxnId first
            const lookupRes = await fetch(`${backendBaseUrl}/deposit/digipay247/lookup/${merchantTxnId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (lookupRes.ok) {
              const data = await lookupRes.json();
              if (data.success && data.depositId) {
                depositId = data.depositId;
                setMt5Id(data.mt5AccountId);
                setMessage(`Payment Successful for Account ${data.mt5AccountId}! Verifying...`);
              }
            } else {
              console.error("Lookup failed with status:", lookupRes.status);
            }
          } catch (e) {
            console.error("Lookup error", e);
          }
        }

        // If lookup failed, maybe the user passed ID directly?
        if (!depositId) {
          // Keep trying for a bit in case of lag
          if (attempts > 10) {
            setStatus('failed');
            setMessage("Could not find transaction details.");
            clearInterval(pollingInterval);
          }
          return;
        }

        // Step 2: Poll Status
        const res = await fetch(`${backendBaseUrl}/deposit/digipay247/status/${depositId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const depStatus = data.data?.deposit?.status;
          const depAmount = data.data?.deposit?.amount;
          const depCurrency = data.data?.deposit?.currency || 'USD';
          const currentMt5Id = data.data?.deposit?.mt5Account?.accountId ||
            data.data?.deposit?.mt5AccountId ||
            mt5Id;

          if (currentMt5Id) setMt5Id(currentMt5Id);
          setDepositData(data.data?.deposit);

          if (depStatus === 'completed') {
            setMessage(`Crediting ${depCurrency} ${depAmount} into account ${currentMt5Id}...`);
            // Show crediting message for a short time before final success
            setTimeout(() => {
              setStatus('success');
              clearInterval(pollingInterval);
            }, 500);
          } else if (depStatus === 'approved') {
            setMessage(`Approved for ${currentMt5Id}! Processing credit...`);
          } else if (depStatus === 'rejected' || depStatus === 'failed') {
            setStatus('failed');
            setMessage("Payment failed or rejected.");
            clearInterval(pollingInterval);
          } else {
            // Still pending
            const displayId = currentMt5Id ? `for account ${currentMt5Id}` : '';
            setMessage(`Payment Successful ${displayId}! Awaiting approval...`);
          }
        }
      } catch (err) {
        console.error("Status check error:", err);
      }

      if (attempts >= maxAttempts && status === 'loading') {
        setStatus('failed');
        setMessage("Verification timed out. Please check your transaction history.");
        clearInterval(pollingInterval);
      }
    };

    if (merchantTxnId) {
      checkStatus(); // Initial check
      pollingInterval = setInterval(checkStatus, 2000);
    } else {
      setStatus('failed');
      setMessage("Invalid transaction parameters.");
    }

    return () => clearInterval(pollingInterval);
  }, [merchantTxnId, depositData?.id]);

  if (status === 'loading') {
    const displayId = mt5Id || depositData?.mt5Account?.accountId || depositData?.mt5AccountId || '';
    const displayMessage = message.includes('Approved for') || message.includes('Crediting') || message.includes('Successful for Account')
      ? message.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, displayId)
      : message;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <TradingLoader />
        <h2 className="text-2xl font-bold dark:text-white mt-4">{displayMessage}</h2>
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
