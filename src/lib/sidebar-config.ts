import { StaticImageData } from "next/image";
import {
  becomePartner, becomePartnerBlack, dashboard, dashboardBlack, deposits,
  depositsBlack, platforms, platformsBlack, support, supportBlack, settings, settingsBlack, tools, toolsBlack,
  transactions, transactionsBlack, withdrawals, withdrawalsBlack,
  wallet, walletBlack,
  // accounts, accountsBlack
} from "@/lib/sidebar-assets";

export type MenuItem = {
  name: string;
  icon: StaticImageData;
  active: StaticImageData;
  link: string;
  subItems: SubMenuItem[];
};

export type SubMenuItem = {
  name: string;
  link: string;
};

export const getMenuItems = ({ theme }: { theme: string }): MenuItem[] => {
  const overviewImage = theme === "dark" ? dashboard : dashboardBlack;
  const depositImage = theme === "dark" ? deposits : depositsBlack;
  const withdrawImage = theme === "dark" ? withdrawals : withdrawalsBlack;

  const transactionsImage = theme === "dark" ? transactions : transactionsBlack;
  const partnerImage = theme === "dark" ? becomePartner : becomePartnerBlack;
  const toolsImage = theme === "dark" ? tools : toolsBlack;
  const platformsImage = theme === "dark" ? platforms : platformsBlack;
  const supportImage = theme === "dark" ? support : supportBlack;
  const settingsImage = theme === "dark" ? settings : settingsBlack;
  // Wallet icon tweak: in light mode use Trading Tools icon instead
  const walletImage = theme === "dark" ? wallet : toolsBlack;
  // Payment Methods icon tweak: in light mode use Deposits icon instead
  const paymentMethodsImage = theme === "dark" ? deposits : depositsBlack;
  const paymentMethodsActive = theme === "dark" ? deposits : deposits;
  // const accountsImage = theme === "dark" ? accounts : accountsBlack;



  return [
    {
      name: "Overview",
      icon: overviewImage,
      link: "/",
      active: dashboard,
      subItems: [],
    },
    // {
    //   name: "Accounts",
    //   icon: accountsImage,
    //   link: "/accounts",
    //   active: accounts,
    //   subItems: [],
    // },
    {
      name: "Deposits",
      icon: depositImage,
      link: "/deposit",
      active: deposits,
      subItems: [],
    },
    {
      name: "Withdrawal",
      icon: withdrawImage,
      link: "/withdrawal",
      active: withdrawals,
      subItems: [],
    },
    {
      name: "Wallet",
      icon: walletImage,
      active: wallet,
      link: "/wallet",
      subItems: [],
    },
    {
      name: "Withdrawal Methods",
      icon: paymentMethodsImage,
      active: paymentMethodsActive,
      link: "/payment-methods",
      subItems: [],
    },
    {
      name: "Transactions",
      icon: transactionsImage,
      active: transactions,
      link: "/transactions",
      subItems: [],
    },

    {
      name: "Trading Platforms",
      icon: platformsImage,
      active: platforms,
      link: "/trading-platforms",
      subItems: [
        // { name: "Web Platform", link: "/trading-platforms/web" },
        // { name: "Mobile App", link: "/trading-platforms/mobile" },
        // { name: "Desktop Software", link: "/trading-platforms/desktop" },
      ],
    },
    {
      name: "Trading Tools",
      icon: toolsImage,
      active: tools,
      link: "/trading-tools",
      subItems: [
        // { name: "Market News", link: "/trading-tools/market-news" },
        // { name: "Technical Analysis", link: "/trading-tools/technical-analysis" },
        // { name: "News Sentiment", link: "/trading-tools/news-sentiment" },
        // { name: "Volatility Analysis", link: "/trading-tools/volatility-analysis" },
        // { name: "Performance Statistics", link: "/trading-tools/performance-statics" },
        // { name: "Heat Maps", link: "/trading-tools/heat-maps" },
        // { name: "Our Favourite", link: "/trading-tools/our-favourites" },
        // { name: "Events", link: "/trading-tools/calendar" },
        // { name: "Risk Calculator", link: "/trading-tools/risk-calculator" },
        // { name: "Cross Rates", link: "/trading-tools/cross-rates" },
        // { name: "Crypto Market CAP", link: "/trading-tools/crypto-market-cap" },
        // { name: "Top Stories", link: "/trading-tools/top-stories" },
      ],
    },
    {
      name: "Become a Partner",
      icon: partnerImage,
      active: becomePartner,
      link: "/partner",
      subItems: [
        // { name: "Partner Benefits", link: "/partner/benefits" },
        // { name: "Apply Now", link: "/partner/apply" },
        // { name: "Partner Portal", link: "/partner/portal" },
      ],
    },

    {
      name: "Support Hub",
      icon: supportImage,
      active: support,
      link: "/support",
      subItems: [],
    },
    {
      name: "Settings",
      icon: settingsImage,
      link: "/settings",
      active: settings,
      subItems: [
        // { name: "Profile", link: "/settings?tab=profile" },
        // { name: "Security", link: "/settings?tab=security" },
        // { name: "Notifications", link: "/settings?tab=notification" },
        // { name: "Preferences", link: "/settings?tab=preference" },
      ],
    },
  ];
};
