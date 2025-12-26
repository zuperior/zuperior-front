export function AccountTypeCard({
  title,
  selected,
  onClick,
  userRole,
  leverage,
  minDeposit,
  spread,
  commission,
  description,
  accountType,
}: {
  userRole: string;
  title: string;
  selected: boolean;
  onClick: () => void;
  leverage?: number | string | null;
  minDeposit?: number | null;
  spread?: number | null;
  commission?: number | null;
  description?: string | null;
  accountType?: string;
}) {
  // Format leverage display
  const formatLeverage = (lev: number | string | null | undefined): string => {
    if (lev === null || lev === undefined || lev === 0) return "1:Unlimited";
    if (typeof lev === "string") return lev;
    return `1:${lev}`;
  };

  // Format min deposit
  const formatMinDeposit = (deposit: number | null | undefined): string => {
    if (!deposit) return "$10";
    return `$${deposit.toFixed(0)}`;
  };

  // Format spread
  const formatSpread = (spr: number | null | undefined): string => {
    if (!spr) return "0.3 pips";
    return `${spr} pips`;
  };

  // Format commission
  const formatCommission = (comm: number | null | undefined): string => {
    if (!comm) return "15%";
    return `${comm}%`;
  };
  const roleMaskStyle = {
    WebkitMaskImage:
      "linear-gradient(100deg, rgba(255, 255, 255, 0.75) 10%, rgba(255, 255, 255, 0.25) 100%)",
    maskImage:
      "linear-gradient(100deg, rgba(255, 255, 255, 0.75) 10%, rgba(255, 255, 255, 0.25) 100%)",
    borderRadius: "15px",
    opacity: 0.75,
    inset: 0,
    overflow: "visible",
    position: "absolute",
    zIndex: 0,
  };
  const cardMaskStyle = {
    WebkitMaskImage:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 10%, rgba(255, 255, 255, 0.25) 100%)",
    maskImage:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 10%, rgba(255, 255, 255, 0.25) 100%)",
    borderRadius: "15px",
    opacity: 0.4,
    inset: 0,
    overflow: "visible",
    position: "absolute",
    zIndex: 0,
  };

  return (
    <div
      className={`group relative flex flex-col h-[312px] w-[240px] md:w-[250px] cursor-pointer items-center text-center gap-[10px] md:gap-[15px] rounded-[15px] px-3 md:px-[25px] pt-[15px] pb-[30px] bg-gradient-to-b transition-all duration-200 ${selected
        ? " dark:from-[#381138] dark:to-[#1C061C] bg-[#9F8BCF]"
        : " dark:from-[#381138]/15 dark:to-[#1C061C]/50  dark:border-0 border border-gray-300"
        }`}
      onClick={onClick}
    >
      <div
        style={cardMaskStyle as React.CSSProperties}
        className="border border-white/50 pointer-events-none"
      />
      <div
        className={`rounded-[15px] relative py-1.5 px-4 font-semibold text-xs text-black dark:text-white/75 flex items-center justify-center`}
      >
        <div
          style={roleMaskStyle as React.CSSProperties}
          className="border border-white/50 pointer-events-none"
        />
        <p>{userRole}</p>
      </div>
      <div className="flex-1">
        <h3
          className={`font-bold text-center mb-2.5 text-lg -tracking-[0.02em] bg-clip-text text-black dark:bg-gradient-to-r from-white to-[#9E9E9E]/95 dark:text-transparent`}
        >
          {title}
        </h3>

        <p className="text-xs dark:text-white/75 text-black  ">
          {description || (accountType === "Demo" 
            ? "Perfect for newbies--Kick off your trading journey with micro lots."
            : (userRole === "For Experts" 
              ? "Designed for skilled traders who demand performance, speed, and precision."
              : "Ideal for traders taking their first steps with clarity and confidence."))}
        </p>
        <div className="mt-[15px] flex items-center flex-col gap-2.5">
          <p className={`text-xs font-semibold dark:text-white/75 text-black `}>
            Minimum Deposit{" "}
            <span className="dark:text-white/75 text-black ml-1 text-sm">{formatMinDeposit(minDeposit)}</span>
          </p>
          <div className="w-full h-px bg-gradient-to-r from-black via-[#736496] to-black" />
          <p className={`text-xs font-semibold dark:text-white/75 text-black `}>
            Low Spreads{" "}
            <span className="text-white/75 ml-1 text-sm">{formatSpread(spread)}</span>
          </p>
          <div className="w-full h-px bg-gradient-to-r from-black via-[#736496] to-black" />
          <p className={`text-xs font-semibold dark:text-white/75 text-black `}>
            Leverage{" "}
            <span className="text-white/75 ml-1 text-sm dark:text-white/75 text-black">{formatLeverage(leverage)}</span>
          </p>
          <div className="w-full h-px bg-gradient-to-r from-black via-[#736496] to-black" />
          <p className={`text-xs font-semibold dark:text-white/75 text-black `}>
            Commissions upto{" "}
            <span className="dark:text-white/75 text-black  ml-1 text-sm">{formatCommission(commission)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}