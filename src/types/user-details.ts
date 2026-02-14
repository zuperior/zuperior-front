interface AccountBillAdsGeneral {
  accountaddressid: number;
  bill_city: string;
  bill_code: string;
  bill_country: string;
  bill_state: string;
  bill_street: string;
  bill_pobox: string | null;
  bill_country_code: string | null;
}

export interface TpAccountSnapshot {
  tradingplatformaccountsid: number;
  account_name: number;
  platformname: string;
  acc: number;
  account_type: string;
  leverage: number;
  balance: string;
  credit: string;
  nickname?: string;
  equity: string;
  margin: string;
  margin_free: string;
  margin_level: string;
  closed_pnl: string;
  open_pnl: string;
  account_type_requested: string | null;
  provides_balance_history: boolean;
  tp_account_scf: {
    tradingplatformaccountsid: number;
    cf_1479: string;
  };
}

export interface User {
  // Database fields (User table)
  id?: string;
  clientId?: string;
  name?: string;
  email?: string;
  country?: string;
  createdAt?: string;
  emailVerified?: boolean;
  lastLoginAt?: string;
  role?: string;
  status?: string;
  killSwitchActive?: boolean;
  killSwitchUntil?: string | null;

  // Legacy CRM fields (for backward compatibility)
  crm_account_id?: number;
  accountname?: string;
  email1?: string;
  verification_status?: string | null;
  provider_name?: string | null;
  additional_information?: string | null;
  phone?: string;
  account_bill_ads_general?: AccountBillAdsGeneral;
  tp_accounts_last_snapshot_info?: TpAccountSnapshot[];
}