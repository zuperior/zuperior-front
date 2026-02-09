import React from "react";
import TradingLoader from "./TradingLoader";
import { formatDate, getStatusColor, formatStatusText } from "@/utils/formDate";
import { ArrowDown, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import Image from "next/image";

interface Tx {
  depositID?: string;
  login?: string;
  open_time?: string | number;
  profit?: number;
  amount?: number;
  comment?: string;
  type: string;
  status?: string;
  account_id?: string;
  inrAmount?: string | number;
}

interface Props {
  loadingTx: boolean;
  selectedAccountId: string | null;
  tableData: Tx[];
}

const getArrowIcon = (type: string) => {
  if (type === "Deposit" || type === "Internal Transfer In") {
    return <ArrowDown className="h-3 w-3 text-black bg-[#92F09A] rounded-full p-0.5" />;
  } else if (type === "Internal Transfer Out") {
    return <ArrowLeftRight className="h-3 w-3 text-black bg-[#9F8ACF] rounded-full p-0.5" />;
  } else {
    return <ArrowUpRight className="h-3 w-3 text-black bg-[#D97777] rounded-full p-0.5 rotate-[-10deg]" />;
  }
};

// Helper function to extract crypto symbol from payment method
const extractCryptoSymbol = (paymentMethod: string | undefined | null): string | null => {
  if (!paymentMethod) return null;

  // Match pattern like "crypto-BTC", "crypto-USDT-BEP20", "crypto-ETH", etc.
  const newFormatMatch = paymentMethod.match(/^crypto-([A-Z]+)(?:-([A-Z0-9]+))?/i);
  if (newFormatMatch) {
    return newFormatMatch[1].toUpperCase(); // Return the crypto symbol (BTC, USDT, ETH, etc.)
  }

  // Match pattern like "unipayment_crypto_btc (BTC)" - extract from parentheses
  const parenMatch = paymentMethod.match(/\(([A-Z]+)\)/);
  if (parenMatch) {
    return parenMatch[1];
  }

  // Match pattern like "unipayment_crypto_btc", "unipayment_crypto_eth", etc.
  const underscoreMatch = paymentMethod.match(/unipayment_crypto_([a-z]+)/i);
  if (underscoreMatch) {
    const symbol = underscoreMatch[1].toUpperCase();
    // Handle special cases: btc -> BTC, eth -> ETH, trc20/bep20/erc20 -> USDT
    if (symbol === 'TRC20' || symbol === 'BEP20' || symbol === 'ERC20') {
      return 'USDT';
    }
    return symbol;
  }

  // Match Cregis format: cregis_usdt_trc20, cregis_usdt_bep20, etc.
  const cregisMatch = paymentMethod.match(/^cregis_([a-z]+)_([a-z0-9]+)$/i);
  if (cregisMatch) {
    const currency = cregisMatch[1].toUpperCase(); // USDT
    const network = cregisMatch[2].toUpperCase(); // TRC20, BEP20
    return currency; // Return the currency symbol
  }

  return null;
};

// Helper function to get crypto icon path
const getCryptoIcon = (symbol: string, paymentMethod?: string): string => {
  const upperSymbol = symbol.toUpperCase();

  // Special handling for USDT based on network in payment method
  if (upperSymbol === 'USDT' && paymentMethod) {
    const lowerMethod = paymentMethod.toLowerCase();
    if (lowerMethod.includes('trc20')) {
      return '/trc20.png';
    } else if (lowerMethod.includes('bep20')) {
      return '/bep20.png';
    } else if (lowerMethod.includes('erc20')) {
      return '/crypto_icon/USDT-ERC20.webp';
    }
  }

  const iconMap: Record<string, string> = {
    'BTC': '/crypto_icon/btc.webp',
    'ETH': '/crypto_icon/ethereum.webp',
    'USDT': '/crypto_icon/USDT-ERC20.webp', // Default USDT icon
    'BNB': '/crypto_icon/bnb.webp',
    'USDC': '/crypto_icon/usdc.webp',
    'EURC': '/crypto_icon/eurc.webp',
  };

  return iconMap[upperSymbol] || '/crypto_icon/btc.webp'; // Fallback icon
};

// Helper function to render payment method with crypto logo if applicable
const renderPaymentMethod = (comment: string | undefined | null) => {
  if (!comment) return "-";

  // Handle Cregis format: cregis_usdt_trc20 -> USDT TRC20
  const cregisMatch = comment.match(/^cregis_([a-z]+)_([a-z0-9]+)$/i);
  if (cregisMatch) {
    const currency = cregisMatch[1].toUpperCase(); // USDT
    const network = cregisMatch[2].toUpperCase(); // TRC20, BEP20
    const displayText = `${currency} ${network}`; // USDT TRC20, USDT BEP20
    const cryptoSymbol = currency;
    const iconPath = getCryptoIcon(cryptoSymbol, comment);

    return (
      <div className="flex items-center gap-2">
        <Image
          src={iconPath}
          alt={cryptoSymbol}
          width={20}
          height={20}
          className="rounded-full"
        />
        <span>{displayText}</span>
      </div>
    );
  }

  const cryptoSymbol = extractCryptoSymbol(comment);

  if (cryptoSymbol) {
    const iconPath = getCryptoIcon(cryptoSymbol, comment);
    // Always display as "crypto (SYMBOL)" format for clarity, all uppercase
    const displayText = `CRYPTO (${cryptoSymbol})`;

    return (
      <div className="flex items-center gap-2">
        <Image
          src={iconPath}
          alt={cryptoSymbol}
          width={20}
          height={20}
          className="rounded-full"
        />
        <span>{displayText}</span>
      </div>
    );
  }

  // If no crypto symbol found, return as-is (for non-crypto payments)
  return comment.toUpperCase();
};

// Helper function to get payment method as simple text (without icons) for display in transfer type column
const getPaymentMethodText = (comment: string | undefined | null): string => {
  if (!comment) return "";

  // Handle Cregis format: cregis_usdt_trc20 -> USDT TRC20
  const cregisMatch = comment.match(/^cregis_([a-z]+)_([a-z0-9]+)$/i);
  if (cregisMatch) {
    const currency = cregisMatch[1].toUpperCase();
    const network = cregisMatch[2].toUpperCase();
    return `${currency} ${network}`;
  }

  const cryptoSymbol = extractCryptoSymbol(comment);
  if (cryptoSymbol) {
    return `CRYPTO (${cryptoSymbol})`;
  }

  // Return uppercase for non-crypto payments
  return comment.toUpperCase();
};

export const TransactionsTable: React.FC<Props> = ({
  loadingTx,
  selectedAccountId,
  tableData,
}) => (
  <>
    <div
      className="overflow-x-auto rounded-b-xl w-full"
      style={{ maxHeight: "550px", overflowY: "auto" }}
    >
      <table className=" hidden xl:block w-full text-sm table-fixed ">
        <thead className="sticky top-0 bg-white dark:bg-[#01040D] z-10 border-b border-black/10 dark:border-white/10 w-full">
          <tr className="text-xs font-semibold leading-3.5 dark:text-white/25 text-black/25">
            <th className="text-left px-4 py-3 w-[8%]">Sr. No</th>
            <th className="text-left px-2 py-3 w-[14%]">Amount (USD)</th>
            <th className="text-left px-4 py-3 w-[24%]">Transfer Process</th>
            <th className="text-left py-3 w-[20%]">Deposit/Withdrawal</th>
            <th className="text-left px-7 py-3 w-[18%]">Date-Time</th>
            <th className="text-center px-10 py-3 w-[8%]">Status</th>
          </tr>
        </thead>
        <tbody className="text-gray-800 dark:text-white">
          {loadingTx ? (
            <tr>
              <td colSpan={6} className="py-16 text-center text-gray-400">
                <TradingLoader />
              </td>
            </tr>
          ) : !selectedAccountId ? (
            <tr>
              <td colSpan={6} className="text-center py-10 text-gray-400">
                Please select an account to view transactions.
              </td>
            </tr>
          ) : tableData.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-10 text-gray-400">
                No transactions found.
              </td>
            </tr>
          ) : (
            tableData.map((tx, i) => (
              <tr
                key={tx.depositID ?? `${i}-${tx.login}-${tx.open_time}`}
                className="text-sm leading-6.5 text-black/75 dark:text-white/75 whitespace-nowrap font-semibold border-b border-[#9F8ACF]/10"
              >
                <td className="px-4 py-[15px]">
                  {i + 1}
                </td>
                <td className="px-2 py-[15px]">
                  {(() => {
                    const val = Number(tx.profit ?? tx.amount ?? 0);
                    const usdDisplay = `$ ${Math.abs(val).toFixed(2)}`;
                    // For UPI payments, show USD and INR amounts
                    if (tx.comment === 'UPI' && tx.inrAmount) {
                      const inrVal = Number(tx.inrAmount);
                      return `${usdDisplay} (₹${inrVal.toLocaleString('en-IN')} INR)`;
                    }
                    return usdDisplay;
                  })()}
                </td>
                <td className="px-2 py-[15px]">{renderPaymentMethod(tx.comment)}</td>
                <td className="px-2 py-[15px]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {getArrowIcon(tx.type)}
                      <span>{tx.type}</span>
                    </div>
                    {tx.comment && (
                      <span className="text-xs text-black/50 dark:text-white/50 ml-5">
                        {getPaymentMethodText(tx.comment)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-[15px]">
                  {formatDate(tx.open_time ?? "")}
                </td>
                <td
                  className={`px-4 py-[15px] text-center ${getStatusColor(
                    tx.status
                  )}`}
                >
                  {formatStatusText(tx.status)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    <div
      className="w-full bg-gradient-to-r from-[#181422] to-[#181422] dark:from-[#15101d] dark:to-[#181422] rounded-xl px-5 shadow-lg 
        text-white dark:text-white/75 block lg:block xl:hidden"
    >
      {loadingTx ? (
        <div className="py-16 text-center text-gray-400">
          <TradingLoader />
        </div>
      ) : !selectedAccountId ? (
        <div className="py-10 text-center text-gray-400">
          Please select an account to view transactions.
        </div>
      ) : tableData.length === 0 ? (
        <div className="py-10 text-center text-gray-400">
          No transactions found.
        </div>
      ) : (
        tableData.map((tx, i) => {
          const val = Number(tx.profit ?? tx.amount ?? 0);
          return (
            <div
              key={tx.depositID ?? `${i}-${tx.login}-${tx.open_time}`}
              className="flex justify-between items-center border-b border-white/10 py-3 last:border-none"
            >
              <div>
                <div className="font-medium">
                  {renderPaymentMethod(tx.comment)}
                </div>
                <p className="text-sm text-gray-400 dark:text-white/75">
                  Sr. No: {i + 1}
                </p>
                <p className="text-sm text-gray-400 dark:text-white/75">
                  {formatDate(tx.open_time ?? "")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg">
                  {(() => {
                    const usdDisplay = `$${Math.abs(val).toFixed(2)}`;
                    // For UPI payments, show USD and INR amounts
                    if (tx.comment === 'UPI' && tx.inrAmount) {
                      const inrVal = Number(tx.inrAmount);
                      return `${usdDisplay} (₹${inrVal.toLocaleString('en-IN')} INR)`;
                    }
                    return usdDisplay;
                  })()}
                </p>
                <div className="flex flex-col gap-1">
                  <p className="flex items-center gap-1 text-green-400 text-sm">
                    {getArrowIcon(tx.type)} {tx.type}
                  </p>
                  {tx.comment && (
                    <p className="text-xs text-gray-400 dark:text-white/50">
                      {getPaymentMethodText(tx.comment)}
                    </p>
                  )}
                </div>
                <p className={`text-xs mt-1 ${getStatusColor(tx.status)}`}>
                  {formatStatusText(tx.status)}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  </>
);
