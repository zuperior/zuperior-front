import { StaticImageData } from "next/image";

export interface PaymentInfo {
  token_symbol: string;
  blockchain: string;
  payment_address: string;
  receive_currency: string;
}

export interface CheckoutData {
  expire_time: string;
  order_currency: string;
  payment_info: PaymentInfo[];
  cregis_id: string;
}

export type PaymentStatus =
  | 'pending'
  | 'expired'
  | 'paid'
  | 'partial_paid'
  | 'overpaid'
  | 'refunded'
  | 'new'
  | 'paid_remain'
  | 'paid_over'
  | 'paid_partial'
  | 'complete'
  | 'success'
  | 'confirmed';

export interface PaymentStatusData {
  event_name: string;
  event_type: PaymentStatus;
  order_amount: string;
  paid_amount: string;
  order_currency: string;
  cregis_id: string;
  timestamp: number;
}

export type PaymentImages = {
  [key: string]: string | StaticImageData;
};

export interface NewAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCrypto?: Cryptocurrency | null;
}

export interface Step1FormProps {
  amount: string;
  setAmount: (value: string) => void;
  selectedNetwork: string;
  setSelectedNetwork?: (value: string) => void;
  selectedCrypto?: Cryptocurrency | null;
  nextStep: () => void;
}

export interface Step2ConfirmationProps {
  amount: string;
  selectedNetwork: string;
  selectedCrypto?: Cryptocurrency | null;
  paymentMethod: string;
  paymentImages: PaymentImages;
  selectedTab?: string;
  error: string | null;
  isProcessing: boolean;
  exchangeRate?: number;
  prevStep: () => void;
  handleContinueToPayment: () => void;
  requiresNetwork?: boolean; // Whether network selection is required for this payment method
}

export interface Step3PaymentProps {
  amount: string;
  countdown: number;
  selectedCrypto?: Cryptocurrency | null;
  selectedNetwork: string;
  checkoutData: CheckoutData;
  cregisId: string;
  isLoading: boolean;
}

export interface Step4StatusProps {
  statusData: PaymentStatusData;
  onRetry: () => void;
  onClose: () => void;
}
export type NetworkInfo = {
  blockchain: string;
  logoUrl: string;
};
export type Cryptocurrency = {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  networks: NetworkInfo[];
};

export interface Account {
  tradingplatformaccountsid: number;
  account_name: number;
  acc: number;
  account_number: string;
  account_type_requested: string;
  currency: string;
  platformname: string;
  mt4_group: string;
  tp_accountstatus: string;
  provides_balance_history: boolean;
}

export interface AccountDetails {
  status: string;
  status_code: string;
  accounts?: Account[];
  data: {
    crm_account_id: number;
    accountname: string;
    email1: string;
    verification_status: string | null;
    account_bill_ads_general: {
      bill_city: string;
      bill_country: string;
      bill_state: string;
      bill_street: string;
    };
    tp_accounts_general_info: Account[];
  }[];
}

export interface TransferFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: 'between_accounts' | 'to_another_user';
}

export interface WithdrawFormProps {
  withdrawAmount: string;
  setWithdrawAmount: (val: string) => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  toWallet: string;
  setToWallet: (val: string) => void;
  fromAccount: string;
  setFromAccount: (val: string) => void;
  open: boolean,
  onOpenChange: (open: boolean) => void,
  selectedCrypto?: Cryptocurrency | null;
}