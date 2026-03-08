// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import QRCode from "react-qr-code";
// import { Button } from "../ui/button";
// import { AlertTriangle, Copy } from "lucide-react";
// import { Step3PaymentProps } from "./types";
// import { toast } from "sonner";

// export function Step3Payment({
//   amount,
//   countdown,
//   selectedCrypto,
//   selectedNetwork,
//   checkoutData,
//   selectedAccount,
// }: Step3PaymentProps & { selectedAccount: string }) {
//   const isCritical = countdown <= 60;
//   const [isPulsing, setIsPulsing] = useState(isCritical);
//   const hasShownCriticalWarning = useRef(false);
//   const hasShownInitialToast = useRef(false);
//   const previousCountdown = useRef(countdown);

//   const accountDetails = selectedAccount
//     ? {
//         accountNumber: selectedAccount.split("|")[0],
//         accountType: selectedAccount.split("|")[1],
//       }
//     : null;

//   // Show initial payment instruction toast
//   useEffect(() => {
//     if (!hasShownInitialToast.current) {
//       const timer = setTimeout(() => {
//         toast.success("Payment Instructions", {
//           description: "Please send the exact amount to the provided address.",
//           duration: 5001,
//         });
//         hasShownInitialToast.current = true;
//       }, 2000);
//       return () => clearTimeout(timer);
//     }
//   }, []);

//   useEffect(() => {
//     if (
//       isCritical &&
//       !hasShownCriticalWarning.current &&
//       previousCountdown.current > 60
//     ) {
//       toast.warning("Time Running Out!", {
//         description:
//           "Complete your payment before expiration to avoid cancellation.",
//         duration: 6000,
//       });
//       hasShownCriticalWarning.current = true;
//     }

//     let pulseInterval: ReturnType<typeof setInterval> | null = null;

//     if (isCritical) {
//       setIsPulsing(true);
//       pulseInterval = setInterval(() => setIsPulsing((p) => !p), 1000);
//     } else {
//       setIsPulsing(false);
//     }

//     previousCountdown.current = countdown;

//     return () => {
//       if (pulseInterval) clearInterval(pulseInterval);
//     };
//   }, [countdown, isCritical]);

//   useEffect(() => {
//     if (countdown > 60) {
//       if (countdown === 300 && previousCountdown.current !== 300) {
//         toast.info("5 Minutes Remaining", {
//           description: "Please complete your payment soon.",
//           duration: 4000,
//         });
//       } else if (countdown === 120 && previousCountdown.current !== 120) {
//         toast.warning("2 Minutes Remaining", {
//           description: "Time is running out. Complete your payment soon.",
//           duration: 5001,
//         });
//       }
//     }
//     previousCountdown.current = countdown;
//   }, [countdown]);

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins} min ${secs} sec`;
//   };

//   const handleCopy = (value: string, label: string) => {
//     navigator.clipboard
//       .writeText(value)
//       .then(() =>
//         toast.success("Copied", {
//           description: `${label} copied to clipboard.`,
//         })
//       )
//       .catch(() =>
//         toast.error("Copy Failed", { description: `Could not copy ${label}.` })
//       );
//   };

//   return (
//     <div className="w-full overflow-y-auto max-h-[75vh] no-scrollbar">
//       <h2 className="text-2xl text-center font-bold dark:text-white/75 text-black -pt-6">
//         Pay {amount} {selectedCrypto?.name || "USD"}
//       </h2>

//       <div className="mt-1 space-y-4">
//         <div
//           className={`rounded-lg p-4 relative overflow-hidden ${
//             isCritical ? "border border-red-500/50" : ""
//           }`}
//         >
//           {isCritical && (
//             <div
//               className={`absolute inset-0 ${
//                 isPulsing ? "bg-red-500/10" : "bg-red-500/5"
//               } transition-all duration-1000`}
//             ></div>
//           )}

//           <div className="flex justify-between items-center mb-2">
//             <span className="dark:text-white/75 text-black">Amount to Send:</span>
//             <span className="dark:text-white/75 text-black">
//               {amount} {selectedCrypto?.name || "USD"}
//             </span>
//           </div>

//           <div className="flex justify-between items-center">
//             <span className="dark:text-white/75 text-black">Expires At:</span>
//             <div className="flex items-center gap-2">
//               {isCritical && (
//                 <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
//               )}
//               <span
//                 className={`font-medium ${
//                   isCritical ? "text-red-500" : "dark:text-white/75 text-black"
//                 }`}
//               >
//                 {formatTime(countdown)}
//               </span>
//             </div>
//           </div>

//           {accountDetails && (
//             <>
//               <div className="flex justify-between items-center mt-2 mb-2">
//                 <span className="dark:text-white/75 text-black">Account Number:</span>
//                 <div className="flex items-center gap-2">
//                   <span className="dark:text-white/75 text-black">
//                     {accountDetails.accountNumber}
//                   </span>
//                   <button
//                     onClick={() =>
//                       handleCopy(accountDetails.accountNumber, "Account number")
//                     }
//                     className="dark:text-white/75 text-black hover:text-white text-xs"
//                     title="Copy account number"
//                   >
//                     <Copy className="h-3 w-3" />
//                   </button>
//                 </div>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="dark:text-white/75 text-black">Account Type:</span>
//                 <span className="dark:text-white/75 text-black">
//                   {accountDetails.accountType
//                     ? accountDetails.accountType.charAt(0).toUpperCase() +
//                       accountDetails.accountType.slice(1)
//                     : ""}
//                 </span>
//               </div>
//             </>
//           )}

//           <div className="dark:bg-[#2B1B2E] border border-[#945393] rounded-lg p-2 mt-5 text-center shadow-md">
//             <p className="text-red-500 font-semibold text-xs">
//               ⏳ Please complete your payment before the timer expires to avoid
//               cancellation.
//             </p>
//           </div>
//         </div>

//         {selectedCrypto && (
//           <div className="rounded-lg p-4 -mt-9">
//             <h3 className="text-lg font-semibold dark:text-white/75 text-black mb-3">
//               Pay with {selectedCrypto.name}
//             </h3>
//             {checkoutData.payment_info
//               .filter((info) => info.blockchain === selectedNetwork)
//               .map((payment) => (
//                 <div key={payment.blockchain} className="mb-2 rounded-lg p-1">
//                   <div className="flex flex-col md:flex-row gap-6">
//                     <div className="flex flex-col items-center">
//                       <div className="bg-white p-2 rounded-md">
//                         <QRCode
//                           value={payment.payment_address}
//                           size={200}
//                           level="H"
//                           fgColor="#000000"
//                           bgColor="#ffffff"
//                         />
//                       </div>
//                       <p className="text-xs dark:text-white/75 text-black mt-2 text-center">
//                         Scan to send {payment.receive_currency}
//                       </p>
//                     </div>
//                     <div className="flex-1">
//                       <div className="flex items-center mb-3">
//                         <span className="font-semibold">
//                           {payment.blockchain} Network
//                         </span>
//                       </div>
//                       <div className="mb-3">
//                         <p className="dark:text-white/75 text-black mb-1">Payment Address</p>
//                         <p className="dark:text-white/75 text-black font-mono break-all  p-2 rounded">
//                           {payment.payment_address}
//                         </p>
//                         <Button
//                           variant="outline"
//                           className="mt-2 text-xs dark:text-white/75 text-black"
//                           onClick={() =>
//                             handleCopy(
//                               payment.payment_address,
//                               `${payment.blockchain} address`
//                             )
//                           }
//                         >
//                           <Copy className="h-3 w-3 mr-1" />
//                           Copy Address
//                         </Button>
//                       </div>
//                     </div>
//                   </div>

//                   <p className="text-xs text-red-500 mt-1 p-2">
//                     Please make sure the transfer network is{" "}
//                     {payment.blockchain}, otherwise the assets will be
//                     permanently lost
//                   </p>
//                 </div>
//               ))}
//           </div>
//         )}
//       </div>

//       <div className="rounded-lg p-4 -mt-10">
//         <h3 className="text-lg font-semibold dark:text-white/75 text-black mb-2">Instructions</h3>
//         <ol className="list-decimal list-inside space-y-2 text-sm dark:text-white/75 text-black">
//           <li>
//             Send exactly {amount} {selectedCrypto?.name || "USD"} to the address
//             above
//           </li>
//           <li>Wait for network confirmation (usually takes 2-5 minutes)</li>
//           <li>Do not close this window until payment is confirmed</li>
//           {isCritical && (
//             <li className="text-red-400 font-medium">
//               Complete your payment immediately - time is running out!
//             </li>
//           )}
//         </ol>
//       </div>
//     </div>
//   );
// }
"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "../ui/button";
import { AlertTriangle, Copy } from "lucide-react";
import { Step3PaymentProps } from "./types";
import { toast } from "sonner";


export function Step3Payment({
  amount,
  countdown,
  selectedCrypto,
  selectedNetwork,
  checkoutData,
  selectedAccount,
}: Step3PaymentProps & { 
  selectedAccount: string;
  onClose: () => void; // Function to call when user wants to close
}) {
  const isCritical = countdown <= 60;
  const [isPulsing, setIsPulsing] = useState(isCritical);
  const hasShownCriticalWarning = useRef(false);
  const hasShownInitialToast = useRef(false);
  const previousCountdown = useRef(countdown);

  const accountDetails = selectedAccount
    ? {
        accountNumber: selectedAccount.split("|")[0],
        accountType: selectedAccount.split("|")[1],
      }
    : null;

  // Show initial payment instruction toast
  useEffect(() => {
    if (!hasShownInitialToast.current) {
      const timer = setTimeout(() => {
        toast.success("Payment Instructions", {
          description: "Please send the exact amount to the provided address.",
          duration: 5001,
        });
        hasShownInitialToast.current = true;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (
      isCritical &&
      !hasShownCriticalWarning.current &&
      previousCountdown.current > 60
    ) {
      toast.warning("Time Running Out!", {
        description:
          "Complete your payment before expiration to avoid cancellation.",
        duration: 6000,
      });
      hasShownCriticalWarning.current = true;
    }

    let pulseInterval: ReturnType<typeof setInterval> | null = null;

    if (isCritical) {
      setIsPulsing(true);
      pulseInterval = setInterval(() => setIsPulsing((p) => !p), 1000);
    } else {
      setIsPulsing(false);
    }

    previousCountdown.current = countdown;

    return () => {
      if (pulseInterval) clearInterval(pulseInterval);
    };
  }, [countdown, isCritical]);

  useEffect(() => {
    if (countdown > 60) {
      if (countdown === 300 && previousCountdown.current !== 300) {
        toast.info("5 Minutes Remaining", {
          description: "Please complete your payment soon.",
          duration: 4000,
        });
      } else if (countdown === 120 && previousCountdown.current !== 120) {
        toast.warning("2 Minutes Remaining", {
          description: "Time is running out. Complete your payment soon.",
          duration: 5001,
        });
      }
    }
    previousCountdown.current = countdown;
  }, [countdown]);

  // Handle browser/tab close attempts
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (countdown > 0) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to leave? Your payment may be interrupted.";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() =>
        toast.success("Copied", {
          description: `${label} copied to clipboard.`,
        })
      )
      .catch(() =>
        toast.error("Copy Failed", { description: `Could not copy ${label}.` })
      );
  };

  return (
    <div className="w-full overflow-y-auto max-h-[75vh] no-scrollbar">
      <h2 className="text-2xl text-center font-bold dark:text-white/75 text-black -pt-6">
        Pay {amount} {selectedCrypto?.name || "USD"}
      </h2>

      <div className="mt-1 space-y-4">
        <div
          className={`rounded-lg p-4 relative overflow-hidden ${
            isCritical ? "border border-red-500/50" : ""
          }`}
        >
          {isCritical && (
            <div
              className={`absolute inset-0 ${
                isPulsing ? "bg-red-500/10" : "bg-red-500/5"
              } transition-all duration-1000`}
            ></div>
          )}

          <div className="flex justify-between items-center mb-2">
            <span className="dark:text-white/75 text-black">Amount to Send:</span>
            <span className="dark:text-white/75 text-black">
              {amount} {selectedCrypto?.name || "USD"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="dark:text-white/75 text-black">Expires At:</span>
            <div className="flex items-center gap-2">
              {isCritical && (
                <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
              )}
              <span
                className={`font-medium ${
                  isCritical ? "text-red-500" : "dark:text-white/75 text-black"
                }`}
              >
                {formatTime(countdown)}
              </span>
            </div>
          </div>

          {accountDetails && (
            <>
              <div className="flex justify-between items-center mt-2 mb-2">
                <span className="dark:text-white/75 text-black">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="dark:text-white/75 text-black">
                    {accountDetails.accountNumber}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(accountDetails.accountNumber, "Account number")
                    }
                    className="dark:text-white/75 text-black hover:text-white text-xs"
                    title="Copy account number"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="dark:text-white/75 text-black">Account Type:</span>
                <span className="dark:text-white/75 text-black">
                  {accountDetails.accountType
                    ? accountDetails.accountType.charAt(0).toUpperCase() +
                      accountDetails.accountType.slice(1)
                    : ""}
                </span>
              </div>
            </>
          )}

          <div className="dark:bg-[#2B1B2E] border border-[#945393] rounded-lg p-2 mt-5 text-center shadow-md">
            <p className="text-red-500 font-semibold text-xs">
              ⏳ Please complete your payment before the timer expires to avoid
              cancellation.
            </p>
          </div>
        </div>

        {selectedCrypto && (
          <div className="rounded-lg p-4 -mt-9">
            <h3 className="text-lg font-semibold dark:text-white/75 text-black mb-3">
              Pay with {selectedCrypto.name}
            </h3>
            {checkoutData?.payment_info && checkoutData.payment_info.length > 0 ? (
              checkoutData.payment_info
              .filter((info) => {
                // Match blockchain: TRC20 -> TRON, BEP20 -> BNB Smart Chain, ERC20 -> Ethereum
                const networkMap: Record<string, string> = {
                  'TRC20': 'TRON',
                  'BEP20': 'BNB Smart Chain',
                  'ERC20': 'Ethereum'
                };
                return info.blockchain === networkMap[selectedNetwork] || info.blockchain === selectedNetwork;
              })
              .map((payment) => (
                <div key={payment.blockchain} className="mb-2 rounded-lg p-1">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-2 rounded-md">
                        <QRCode
                          value={payment.payment_address}
                          size={200}
                          level="H"
                          fgColor="#000000"
                          bgColor="#ffffff"
                        />
                      </div>
                      <p className="text-xs dark:text-white/75 text-black mt-2 text-center">
                        Scan to send {payment.receive_currency}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <span className="font-semibold">
                          {payment.blockchain} Network
                        </span>
                      </div>
                      <div className="mb-3">
                        <p className="dark:text-white/75 text-black mb-1">Payment Address</p>
                        <p className="dark:text-white/75 text-black font-mono break-all  p-2 rounded">
                          {payment.payment_address}
                        </p>
                        <Button
                          variant="outline"
                          className="mt-2 text-xs dark:text-white/75 text-black"
                          onClick={() =>
                            handleCopy(
                              payment.payment_address,
                              `${payment.blockchain} address`
                            )
                          }
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Address
                        </Button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-red-500 mt-1 p-2">
                    Please make sure the transfer network is{" "}
                    {payment.blockchain}, otherwise the assets will be
                    permanently lost
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-red-500">
                No payment information available
              </div>
            )}
          </div>
        )}
      </div>

    

      <div className="rounded-lg p-4 -mt-10">
        <h3 className="text-lg font-semibold dark:text-white/75 text-black mb-2">Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm dark:text-white/75 text-black">
          <li>
            Send exactly {amount} {selectedCrypto?.name || "USD"} to the address
            above
          </li>
          <li>Wait for network confirmation (usually takes 2-5 minutes)</li>
          <li>Do not close this window until payment is confirmed</li>
          {isCritical && (
            <li className="text-red-400 font-medium">
              Complete your payment immediately - time is running out!
            </li>
          )}
        </ol>
      </div>
    </div>
  );
}