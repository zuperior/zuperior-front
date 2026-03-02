"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import {
  Check,
  Clock,
  X,
  AlertTriangle,
  RefreshCw,
  Copy as CopyIcon,
} from "lucide-react";
import { PaymentStatusData, PaymentStatus } from "./types";
import { useAppDispatch } from "@/store/hooks";
import { toast } from "sonner";
import { mt5Service } from "@/services/api.service";
import { useRouter } from "next/navigation";

type StatusConfigType = {
  [key in PaymentStatus]: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    bgColor: string;
  };
};

const statusConfig: StatusConfigType = {
  paid: {
    icon: <Check className="h-8 w-8 text-green-500" />,
    title: "Payment Successful",
    description: "Your payment has been processed successfully",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  expired: {
    icon: <X className="h-8 w-8 text-red-500" />,
    title: "Payment Expired",
    description: "The payment window has closed",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  partial_paid: {
    icon: <Check className="h-8 w-8 text-green-500" />,
    title: "Payment Successful",
    description: "Your partial payment has been processed and credited to your account",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  overpaid: {
    icon: <Check className="h-8 w-8 text-green-500" />,
    title: "Payment Successful",
    description: "Your payment has been processed successfully (overpaid amount credited)",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  paid_over: {
    icon: <Check className="h-8 w-8 text-green-500" />,
    title: "Payment Successful",
    description: "Your payment has been processed successfully (overpaid amount credited)",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  refunded: {
    icon: <Check className="h-8 w-8 text-blue-500" />,
    title: "Payment Refunded",
    description: "Your payment has been refunded",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  paid_remain: {
    icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
    title: "Additional Payment Needed",
    description: "Please pay the remaining amount",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  pending: {
    icon: <Clock className="h-8 w-8 text-blue-500" />,
    title: "Payment Processing",
    description: "Waiting for payment confirmation",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  new: {
    icon: <Clock className="h-8 w-8 text-gray-500" />,
    title: "New Payment",
    description: "A new payment has been initiated",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
  },
  paid_partial: {
    icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
    title: "Partial Payment",
    description: "Part of the payment has been received",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  complete: {
    icon: <Check className="h-8 w-8 text-green-500" />,
    title: "Payment Complete",
    description: "Your payment is complete",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  success: {
    icon: <Check className="h-8 w-8 text-green-500" />,
    title: "Payment Successful",
    description: "Your payment was successful",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  confirmed: {
    icon: <Check className="h-8 w-8 text-green-500" />,
    title: "Payment Confirmed",
    description: "Your payment has been confirmed",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
};

export function Step4Status({
  statusData,
  onRetry,
  onClose,
  accountNumber,
}: {
  statusData: PaymentStatusData & { invoice_id?: string }; // Add invoice_id for Unipayment
  onRetry: () => void;
  onClose: () => void;
  amount: string;
  accountNumber: string;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositCompleted, setDepositCompleted] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [orderAmount, setOrderAmount] = useState("");
  const [hasFetchedCheckoutInfo, setHasFetchedCheckoutInfo] = useState(false);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  // ✅ ADD: Processing stage state for better UX
  const [processingStage, setProcessingStage] = useState<'payment_received' | 'updating_mt5' | 'completed' | null>(null);

  const dispatch = useAppDispatch();
  const hasCalledDeposit = useRef(false);
  const hasShownStatusToast = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Don't show success toast immediately for "paid" status
    // Wait until deposit is actually processed
    if (!hasShownStatusToast.current) {
      const config =
        statusConfig[statusData.event_type] || statusConfig.pending;

      // Only show toast for non-paid statuses immediately
      // For "paid" and "partial_paid", we'll show success after processing completes
      const isPaidStatus = statusData.event_type === "paid" ||
        statusData.event_type === "partial_paid" ||
        statusData.event_type === "paid_partial" ||
        statusData.event_type === "paid_over" ||
        statusData.event_type === "overpaid" ||
        statusData.event_type === "complete";
      if (!isPaidStatus) {
        toast[statusData.event_type === "expired" ? "error" : "info"](
          config.title,
          {
            description: config.description,
            duration: 5000,
          }
        );
        hasShownStatusToast.current = true;
      }
    }
  }, [statusData.event_type]);

  // Fetch checkout info with payment amount
  useEffect(() => {
    const fetchCheckoutInfo = async () => {
      try {
        console.log('🔍 [STEP4] Fetching checkout info for cregis_id:', statusData.cregis_id);
        const response = await fetch("/api/checkout-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cregis_id: statusData.cregis_id }),
        });

        console.log('📥 [STEP4] Checkout info response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [STEP4] Checkout info error:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 [STEP4] Full checkout info response:', JSON.stringify(data, null, 2));

        // Check if status is "paid" or "paid_partial" and trigger callback processing
        const checkoutStatus = data?.data?.status || data?.status;
        console.log('📊 [STEP4] Checkout status:', checkoutStatus);

        const isPaidStatus = checkoutStatus === 'paid' ||
          checkoutStatus === 'paid_partial' ||
          checkoutStatus === 'paid_over' ||
          checkoutStatus === 'paid-over' ||
          checkoutStatus === 'overpaid' ||
          checkoutStatus === 'complete' ||
          checkoutStatus === 'success' ||
          checkoutStatus === 'paid-partial';

        if (isPaidStatus) {
          const isPartial = checkoutStatus === 'paid_partial' || checkoutStatus === 'paid-partial';
          const isOverpaid = checkoutStatus === 'paid_over' || checkoutStatus === 'paid-over' || checkoutStatus === 'overpaid';
          console.log(`✅ [STEP4] Payment status is "${checkoutStatus}" (${isPartial ? 'PARTIAL' : isOverpaid ? 'OVERPAID' : 'FULL'}) - processing deposit...`);

          // ✅ STEP 1: Show "Payment Received"
          setProcessingStage('payment_received');
          setIsProcessingDeposit(true);

          // Extract receive_amount from payment_detail
          // ✅ PRIORITY: Use pay_amount from ROOT level first (authoritative for partial/over payments)
          // Then fallback to payment_detail, then received_amount, then order_amount
          const receiveAmount =
            data?.data?.pay_amount ||  // PRIORITY 1: Root level pay_amount (most authoritative)
            data?.pay_amount ||        // Alternative root path
            data?.data?.payment_detail?.[0]?.pay_amount ||  // PRIORITY 2: payment_detail[0].pay_amount
            data?.data?.payment_detail?.[0]?.receive_amount ||  // PRIORITY 3: payment_detail[0].receive_amount
            data?.data?.received_amount ||  // PRIORITY 4: Root received_amount
            data?.data?.order_amount;  // PRIORITY 5: Fallback to order_amount

          const originalOrderAmount = data?.data?.order_amount || statusData.order_amount;

          // Store both amounts for display
          if (receiveAmount) {
            setReceivedAmount(receiveAmount);
          }
          if (originalOrderAmount) {
            setOrderAmount(originalOrderAmount);
          }

          // Show "Payment Received" message
          toast.success("Payment Received", {
            description: isPartial
              ? `Payment of ${receiveAmount} ${data?.data?.order_currency || 'USDT'} received (partial payment)`
              : isOverpaid
                ? `Payment of ${receiveAmount} ${data?.data?.order_currency || 'USDT'} received (overpaid - full amount credited)`
                : `Payment of ${receiveAmount} ${data?.data?.order_currency || 'USDT'} received`,
            duration: 3000,
          });

          // Wait a moment before showing next stage
          await new Promise(resolve => setTimeout(resolve, 1500));

          // ✅ STEP 2: Show "Updating MT5 Account"
          setProcessingStage('updating_mt5');
          toast.loading("Updating MT5 Account", {
            description: "Crediting your MT5 account. Please wait...",
            duration: 30000,
            id: "updating-mt5",
          });

          // Manually trigger callback to process the payment
          try {

            const callbackResponse = await fetch("/api/cregis/payment-callback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cregis_id: statusData.cregis_id,
                status: checkoutStatus, // Use actual status (paid, paid_partial, or paid_over)
                event_type: checkoutStatus,
                order_amount: originalOrderAmount,
                order_currency: data?.data?.order_currency || statusData.order_currency || "USDT",
                received_amount: receiveAmount || originalOrderAmount,
                pay_amount: receiveAmount || originalOrderAmount,  // Use pay_amount as receive_amount (they should be the same)
                payment_detail: data?.data?.payment_detail || [],
              }),
            });

            if (callbackResponse.ok) {
              const callbackData = await callbackResponse.json();
              console.log('✅ [STEP4] Callback processed successfully:', callbackData);

              // Wait a moment for backend to complete processing
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Poll backend to verify deposit is completed (MT5 credited + DB updated)
              console.log('⏳ [STEP4] Verifying deposit processing completion...');
              let verified = false;

              for (let attempt = 0; attempt < 10; attempt++) {
                try {
                  const token = localStorage.getItem('userToken');
                  const verifyResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api'}/deposit/by-cregis-id/${statusData.cregis_id}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      },
                    }
                  );

                  if (verifyResponse.ok) {
                    const verifyData = await verifyResponse.json();
                    console.log(`📊 [STEP4] Verification attempt ${attempt + 1}:`, verifyData);

                    if (verifyData.success && verifyData.data?.status === 'completed') {
                      console.log('✅ [STEP4] Deposit confirmed as completed in database');
                      verified = true;

                      // ✅ STEP 3: Show "Successful Payment"
                      setProcessingStage('completed');
                      setDepositCompleted(true);
                      toast.dismiss("updating-mt5");

                      const isPartial = verifyData.data?.isPartialPayment || verifyData.data?.cregisStatus === 'paid_partial';
                      const isOverpaid = verifyData.data?.cregisStatus === 'paid_over' || verifyData.data?.cregisStatus === 'overpaid';
                      const partialAmt = verifyData.data?.partialAmount || verifyData.data?.amount;
                      const origAmt = orderAmount || statusData.order_amount;
                      let successMessage = "Your payment has been processed and credited to your MT5 account.";

                      if (isPartial && partialAmt && origAmt) {
                        successMessage = `Your partial payment of ${partialAmt} ${verifyData.data?.currency || statusData.order_currency || 'USD'} (of ${origAmt} ${verifyData.data?.currency || statusData.order_currency || 'USD'} requested) has been processed and credited to your MT5 account.`;
                      } else if (isOverpaid && partialAmt && origAmt) {
                        successMessage = `Your payment of ${partialAmt} ${verifyData.data?.currency || statusData.order_currency || 'USD'} (overpaid - full amount credited) has been processed and credited to your MT5 account.`;
                      }

                      toast.success("Successful Payment", {
                        description: successMessage,
                        duration: 5000,
                      });
                      hasShownStatusToast.current = true;
                      break;
                    } else if (verifyData.success && verifyData.data?.status === 'approved') {
                      // Still processing, keep showing "Updating MT5 Account"
                      console.log(`⏳ [STEP4] Deposit status: ${verifyData.data.status}, waiting...`);
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      continue;
                    }
                  }
                } catch (verifyError) {
                  console.warn(`⚠️ [STEP4] Verification attempt ${attempt + 1} failed:`, verifyError);
                }

                // Wait before next attempt (except on last attempt)
                if (attempt < 9) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }

              if (!verified) {
                console.warn('⚠️ [STEP4] Could not verify deposit completion after 10 attempts');
                // Assume success if callback succeeded (backend might still be processing)
                setProcessingStage('completed');
                setDepositCompleted(true);
                toast.dismiss("updating-mt5");
                const origAmt = orderAmount || statusData.order_amount;
                const successMessage = isPartial && receiveAmount && origAmt
                  ? `Your partial payment of ${receiveAmount} ${statusData.order_currency || 'USD'} (of ${origAmt} ${statusData.order_currency || 'USD'} requested) has been processed. Please check your account balance.`
                  : "Your payment has been processed. Please check your account balance.";
                toast.success("Successful Payment", {
                  description: successMessage,
                  duration: 5000,
                });
                hasShownStatusToast.current = true;
              }
            } else {
              const errorText = await callbackResponse.text();
              console.error('❌ [STEP4] Callback processing failed:', errorText);
              toast.dismiss("updating-mt5");
              toast.error("Deposit Processing Failed", {
                description: "Payment was successful but deposit processing failed. Please contact support.",
                duration: 6000,
              });
              setError("Deposit processing failed");
              setProcessingStage(null);
            }
          } catch (callbackError) {
            console.error('❌ [STEP4] Error triggering callback:', callbackError);
            toast.dismiss("updating-mt5");
            toast.error("Deposit Processing Error", {
              description: "An error occurred while processing your deposit. Please contact support.",
              duration: 6000,
            });
            setError("Callback processing error");
            setProcessingStage(null);
          } finally {
            setIsProcessingDeposit(false);
          }
        }

        // ✅ PRIORITY: Use pay_amount from ROOT level first (authoritative for partial/over payments)
        // Try multiple paths for receive_amount (partial amount paid)
        const payAmount =
          data?.data?.pay_amount ||  // PRIORITY 1: Root level pay_amount (most authoritative)
          data?.pay_amount ||        // Alternative root path
          data?.data?.payment_detail?.[0]?.pay_amount ||  // PRIORITY 2: payment_detail[0].pay_amount
          data?.data?.payment_detail?.[0]?.receive_amount ||  // PRIORITY 3: payment_detail[0].receive_amount
          data?.data?.payment_info?.[0]?.receive_amount ||
          data?.data?.payment_info?.[0]?.amount ||
          data?.data?.received_amount ||  // PRIORITY 4: Root received_amount
          data?.received_amount ||
          data?.data?.order_amount;  // PRIORITY 5: Fallback to order_amount

        // Get original order amount
        const originalOrderAmount = data?.data?.order_amount || statusData.order_amount;

        console.log('💰 [STEP4] Extracted amounts:', {
          receive_amount: payAmount,
          order_amount: originalOrderAmount,
          is_partial: payAmount && originalOrderAmount && parseFloat(payAmount) < parseFloat(originalOrderAmount),
        });

        if (payAmount) {
          setReceivedAmount(payAmount);
        } else {
          console.warn('⚠️ [STEP4] No receive_amount found in response. Available keys:', Object.keys(data?.data || {}));
          // Don't show error toast - the callback will handle the deposit
        }
      } catch (err) {
        console.error("❌ [STEP4] Error fetching checkout info:", err);
        // Don't show error toast - the callback will handle the deposit automatically
      } finally {
        setHasFetchedCheckoutInfo(true);
      }
    };

    // ✅ FIX: Handle both Cregis and Unipayment
    const paymentId = statusData.cregis_id || statusData.invoice_id;
    const isUnipayment = !!statusData.invoice_id && !statusData.cregis_id;

    if (paymentId && !hasFetchedCheckoutInfo) {
      if (isUnipayment) {
        // For Unipayment, trigger webhook processing directly
        console.log('🔔 [STEP4] Unipayment payment detected, triggering webhook processing...');
        setHasFetchedCheckoutInfo(true);
        // Unipayment webhook should already be processed, but we can trigger status check
      } else {
        // For Cregis, fetch checkout info
        fetchCheckoutInfo();
      }
    } else if (!paymentId) {
      setHasFetchedCheckoutInfo(true);
    }
  }, [statusData.cregis_id, statusData.invoice_id, hasFetchedCheckoutInfo]);

  const handleDeposit = useCallback(async () => {
    if (!receivedAmount || receivedAmount === "0") {
      toast.error("Invalid Amount", {
        description: "Cannot process deposit with zero amount.",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      toast.loading("Processing MT5 deposit...", {
        description: "Please wait while we process your transaction.",
      });

      // Use the new MT5 deposit API
      const result = await mt5Service.depositToMt5({
        login: parseInt(accountNumber),
        balance: parseFloat(receivedAmount),
        comment: `Deposit via crypto payment - ${statusData.cregis_id}`
      });

      if (result.success) {
        setDepositCompleted(true);
        toast.success("MT5 Deposit Completed", {
          description:
            "Your funds have been successfully deposited to your MT5 account.",
          duration: 4000,
        });

        setTimeout(() => {
          toast.info("Closing", {
            description: "Returning to dashboard...",
            duration: 2000,
          });
          onClose();
        }, 2000);
      } else {
        throw new Error(result.message || "MT5 deposit processing failed");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "MT5 deposit failed";
      setError(errorMessage);
      toast.error("MT5 Deposit Failed", {
        description: errorMessage,
        duration: 6000,
      });
    } finally {
      setIsProcessing(false);
      toast.dismiss();
    }
  }, [accountNumber, receivedAmount, statusData.cregis_id, onClose]);

  // ✅ FIX: Manually trigger callback processing for both Cregis and Unipayment
  useEffect(() => {
    const triggerCallback = async () => {
      const isPaidStatus =
        statusData.event_type === "paid" ||
        statusData.event_type === "partial_paid" ||
        statusData.event_type === "paid_partial" ||
        statusData.event_type === "paid_over" ||
        statusData.event_type === "overpaid" ||
        statusData.event_type === "complete" ||
        statusData.event_type === "success" ||
        statusData.event_type === "confirmed";

      const paymentId = statusData.cregis_id || statusData.invoice_id;
      const isUnipayment = !!statusData.invoice_id && !statusData.cregis_id;

      if (
        isPaidStatus &&
        !depositCompleted &&
        paymentId &&
        hasFetchedCheckoutInfo
      ) {
        const isPartial = statusData.event_type === "partial_paid" || statusData.event_type === "paid_partial";
        const isOverpaid = statusData.event_type === "paid_over" || statusData.event_type === "overpaid";
        console.log(`✅ [STEP4] Payment successful (${isPartial ? 'PARTIAL' : isOverpaid ? 'OVERPAID' : 'FULL'}) - ${isUnipayment ? 'Unipayment' : 'Cregis'}. Triggering callback processing...`);
        console.log('📊 [STEP4] Payment details:', {
          paymentId,
          isUnipayment,
          event_type: statusData.event_type,
          received_amount: receivedAmount,
          order_amount: statusData.order_amount,
          account_number: accountNumber
        });

        try {
          if (isUnipayment) {
            // ✅ STEP 1: Show "Payment Received" for Unipayment
            setProcessingStage('payment_received');
            setIsProcessingDeposit(true);

            toast.success("Payment Received", {
              description: isPartial
                ? `Payment of ${receivedAmount || statusData.paid_amount} ${statusData.order_currency || 'USD'} received (partial payment)`
                : `Payment of ${receivedAmount || statusData.paid_amount} ${statusData.order_currency || 'USD'} received`,
              duration: 3000,
            });

            await new Promise(resolve => setTimeout(resolve, 1500));

            // ✅ STEP 2: Show "Updating MT5 Account" for Unipayment
            setProcessingStage('updating_mt5');
            toast.loading("Updating MT5 Account", {
              description: "Crediting your MT5 account. Please wait...",
              duration: 30000,
              id: "updating-mt5-unipayment",
            });

            // For Unipayment, webhook should already be processed, but verify deposit status
            const token = localStorage.getItem('userToken');
            let verified = false;

            for (let attempt = 0; attempt < 10; attempt++) {
              try {
                const verifyResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api'}/deposit/by-invoice-id/${statusData.invoice_id}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                  }
                );

                if (verifyResponse.ok) {
                  const verifyData = await verifyResponse.json();
                  console.log(`📊 [STEP4] Unipayment verification attempt ${attempt + 1}:`, verifyData);

                  if (verifyData.success && verifyData.data?.status === 'completed') {
                    console.log('✅ [STEP4] Unipayment deposit confirmed as completed in database');
                    verified = true;
                    setProcessingStage('completed');
                    setDepositCompleted(true);
                    toast.dismiss("updating-mt5-unipayment");

                    toast.success("Successful Payment", {
                      description: "Your payment has been processed and credited to your MT5 account.",
                      duration: 5000,
                    });
                    hasShownStatusToast.current = true;
                    break;
                  } else if (verifyData.success && verifyData.data?.status === 'approved') {
                    // Still processing, wait and retry
                    console.log(`⏳ [STEP4] Unipayment deposit status: ${verifyData.data.status}, waiting...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                  }
                }
              } catch (verifyError) {
                console.warn(`⚠️ [STEP4] Unipayment verification attempt ${attempt + 1} failed:`, verifyError);
              }

              if (attempt < 9) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            if (!verified) {
              console.warn('⚠️ [STEP4] Could not verify Unipayment deposit completion after 10 attempts');
              setProcessingStage('completed');
              setDepositCompleted(true);
              toast.dismiss("updating-mt5-unipayment");
              toast.success("Successful Payment", {
                description: "Your payment has been processed. Please check your account balance.",
                duration: 5000,
              });
              hasShownStatusToast.current = true;
            }
          } else {
            // Cregis callback processing (existing code)
            const callbackResponse = await fetch("/api/cregis/payment-callback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cregis_id: statusData.cregis_id,
                status: statusData.event_type,
                event_type: statusData.event_type,
                order_amount: statusData.order_amount || receivedAmount,
                order_currency: statusData.order_currency || "USDT",
                received_amount: receivedAmount || statusData.order_amount,
                pay_amount: receivedAmount || statusData.order_amount,
                payment_detail: (statusData as any).payment_detail || [],
              }),
            });

            if (callbackResponse.ok) {
              const callbackData = await callbackResponse.json();
              console.log('✅ [STEP4] Cregis callback processed successfully:', callbackData);

              setTimeout(() => {
                console.log('✅ [STEP4] Callback webhook should have processed the deposit. Please check your account balance.');
              }, 2000);
            } else {
              const errorText = await callbackResponse.text();
              console.error('❌ [STEP4] Cregis callback processing failed:', errorText);
            }
          }
        } catch (callbackError) {
          console.error('❌ [STEP4] Error triggering callback:', callbackError);
          if (isUnipayment) {
            toast.dismiss("updating-mt5-unipayment");
            setProcessingStage(null);
          }
        } finally {
          if (isUnipayment) {
            setIsProcessingDeposit(false);
          }
        }
      }
    };

    triggerCallback();
  }, [
    statusData.event_type,
    statusData.cregis_id,
    statusData.invoice_id,
    depositCompleted,
    receivedAmount,
    accountNumber,
    hasFetchedCheckoutInfo,
  ]);

  const handleRetry = () => {
    toast.info("Retrying Payment", {
      description: "Preparing a new payment session...",
    });
    onRetry();
  };

  const handleCopyDetails = () => {
    const details = `Amount: ${receivedAmount} ${statusData.order_currency}
Account: ${accountNumber}
Status: ${statusData.event_type}
Time: ${new Date(statusData.timestamp * 1000).toLocaleString()}`;

    navigator.clipboard
      .writeText(details)
      .then(() => {
        toast.success("Details Copied", {
          description: `Account ${accountNumber} copied to clipboard.`,
        });
      })
      .catch(() => {
        toast.error("Copy Failed", {
          description: "Could not copy details to clipboard.",
        });
      });
  };

  // ✅ FIX: Use processing stage config for better UX
  const getProcessingConfig = () => {
    const isUnipayment = !!statusData.invoice_id && !statusData.cregis_id;
    const paymentProvider = isUnipayment ? 'Unipayment' : 'Cregis';

    if (processingStage === 'payment_received') {
      return {
        icon: <Check className="h-8 w-8 text-green-500 animate-pulse" />,
        title: "Payment Received",
        description: `Payment confirmed by ${paymentProvider}. Processing deposit...`,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
      };
    } else if (processingStage === 'updating_mt5') {
      return {
        icon: <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />,
        title: "Updating MT5 Account",
        description: "Crediting your MT5 account. Please wait...",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      };
    } else if (processingStage === 'completed') {
      return {
        icon: <Check className="h-8 w-8 text-green-500" />,
        title: "Successful Payment",
        description: "Your payment has been processed and credited to your MT5 account.",
        color: "text-green-500",
        bgColor: "bg-green-500/10",
      };
    }
    return null;
  };

  const processingConfig = getProcessingConfig();
  const config = processingConfig || (statusConfig[statusData.event_type] || statusConfig.pending);

  const formattedDate = statusData.timestamp
    ? new Date(statusData.timestamp * 1000).toLocaleString()
    : "N/A";

  // Determine current step for progress indicator
  const getCurrentStep = () => {
    if (processingStage === 'payment_received') return 1;
    if (processingStage === 'updating_mt5') return 2;
    if (processingStage === 'completed' || depositCompleted) return 3;
    // Default: if payment is detected but no processing stage set yet
    if (statusData.event_type === 'paid' ||
      statusData.event_type === 'paid_partial' ||
      statusData.event_type === 'paid_over' ||
      statusData.event_type === 'overpaid' ||
      statusData.event_type === 'partial_paid' ||
      statusData.event_type === 'complete') return 1;
    return 0;
  };

  const currentStep = getCurrentStep();
  const isUnipayment = !!statusData.invoice_id && !statusData.cregis_id;

  // Show step indicator if payment is in progress or completed
  const shouldShowSteps = processingStage || depositCompleted ||
    statusData.event_type === 'paid' ||
    statusData.event_type === 'paid_partial' ||
    statusData.event_type === 'paid_over' ||
    statusData.event_type === 'overpaid' ||
    statusData.event_type === 'partial_paid' ||
    statusData.event_type === 'complete';

  return (
    <div className="w-full px-6 text-center">
      {/* Progress Steps Indicator */}
      {shouldShowSteps && (
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2 w-full max-w-md mx-auto">
            {[
              { num: 1, label: "Payment Received" },
              { num: 2, label: "Updating MT5" },
              { num: 3, label: "Completed" }
            ].map((step, index) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep >= step.num
                      ? "bg-[#9F8BCF]"
                      : "bg-[#594B7A]"
                      }`}
                  >
                    {currentStep > step.num ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-sm font-medium text-white">{step.num}</span>
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${currentStep >= step.num
                    ? "text-[#9F8BCF]"
                    : "text-gray-500"
                    }`}>
                    {step.label}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`h-[4px] flex-1 mx-2 ${currentStep > step.num
                      ? "bg-[#6B5993]"
                      : "bg-[#392F4F]"
                      }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div
        className={`mx-auto w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mb-4`}
      >
        {config.icon}
      </div>
      <h2 className={`text-2xl font-bold mb-2 ${config.color}`}>
        {config.title}
      </h2>
      <p
        className={`mb-6 ${depositCompleted || processingStage === 'completed'
          ? "text-green-500"
          : processingStage === 'updating_mt5'
            ? "text-blue-500"
            : processingStage === 'payment_received'
              ? "text-green-500"
              : "text-gray-300"
          }`}
      >
        {processingStage === 'payment_received'
          ? (() => {
            const isUnipayment = !!statusData.invoice_id && !statusData.cregis_id;
            const paymentProvider = isUnipayment ? 'Unipayment' : 'Cregis';
            return `Payment confirmed by ${paymentProvider}. Processing deposit...`;
          })()
          : processingStage === 'updating_mt5'
            ? "Crediting your MT5 account. Please wait..."
            : processingStage === 'completed' || depositCompleted
              ? "Your payment has been processed and credited to your MT5 account."
              : isProcessing && !depositCompleted
                ? "Processing your deposit..."
                : config.description}
      </p>

      <div className="bg-[#070307] rounded-lg p-4 mb-6 text-left">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="dark:text-white/75 text-black text-sm">Amount</p>
            <p className="text-white">
              {(() => {
                const isPartial = statusData.event_type === 'partial_paid' || statusData.event_type === 'paid_partial';
                const isOverpaid = statusData.event_type === 'paid_over' || statusData.event_type === 'overpaid';
                const partialAmount = receivedAmount || statusData.paid_amount || statusData.order_amount;
                const originalAmount = statusData.order_amount;

                if (isPartial && partialAmount && originalAmount && parseFloat(partialAmount) < parseFloat(originalAmount)) {
                  return `${partialAmount} ${statusData.order_currency} (of ${originalAmount} ${statusData.order_currency} requested)`;
                }
                if (isOverpaid && partialAmount && originalAmount && parseFloat(partialAmount) > parseFloat(originalAmount)) {
                  return `${partialAmount} ${statusData.order_currency} (overpaid - full amount credited)`;
                }
                return `${receivedAmount || statusData.paid_amount || statusData.order_amount} ${statusData.order_currency}`;
              })()}
            </p>
          </div>
          <div>
            <p className="dark:text-white/75 text-black text-sm">Account Number</p>
            <div className="flex items-center gap-2">
              <p className="text-white">{accountNumber}</p>
              <button
                onClick={handleCopyDetails}
                className="dark:text-white/75 text-black dark:hover:text-white text-xs"
                title="Copy all details"
              >
                <CopyIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <p className="dark:text-white/75 text-black text-sm">Status</p>
            <p className={`capitalize ${config.color}`}>
              {statusData.event_type.replace("_", " ")}
            </p>
          </div>
          <div>
            <p className="dark:text-white/75 text-black text-sm">Time</p>
            <p className="dark:text-white/75 text-black">{formattedDate}</p>
          </div>
        </div>
      </div>

      {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

      <div className="flex gap-3 justify-center">
        {statusData.event_type === "expired" && (
          <Button
            onClick={handleRetry}
            disabled={isProcessing}
            className="bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] dark:text-white/75 text-black font-semibold"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>

      <div className="flex justify-center mt-4">
        <Button
          onClick={() => { onClose(); router.push('/transactions'); }}
          className="hover:bg-green-700 bg-green-600 dark:text-white/75 text-black font-semibold px-6 py-2 rounded-lg"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
