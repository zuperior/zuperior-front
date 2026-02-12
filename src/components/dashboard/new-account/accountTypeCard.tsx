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
    spreadLabel = "Low Spreads",
    commissionLabel = "Commissions upto",
}: {
    userRole: string;
    title: string;
    selected: boolean;
    onClick: () => void;
    leverage?: number | string | null;
    minDeposit?: number | string | null;
    spread?: number | string | null;
    commission?: number | string | null;
    description?: string | null;
    accountType?: string;
    spreadLabel?: string;
    commissionLabel?: string;
}) {
    // Format leverage display
    const formatLeverage = (lev: number | string | null | undefined): string => {
        if (lev === null || lev === undefined) return "1:Unlimited";
        if (lev === 0) return "1:Unlimited";
        if (typeof lev === "string") return lev;
        return `1:${lev}`;
    };

    // Format min deposit
    const formatMinDeposit = (deposit: number | string | null | undefined): string => {
        if (deposit === null || deposit === undefined) return "$10";
        if (typeof deposit === "string") return deposit;
        return `$${deposit.toFixed(0)}`;
    };

    // Format spread
    const formatSpread = (spr: number | string | null | undefined): string => {
        if (spr === null || spr === undefined) return "0.3 pips";
        if (typeof spr === "string") return spr;
        return `${spr} pips`;
    };

    // Format commission
    const formatCommission = (comm: number | string | null | undefined): string => {
        if (comm === null || comm === undefined) return "15%";
        if (typeof comm === "string") return comm;
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
    return (
        <div
            className={`group relative flex flex-col h-[312px] w-[240px] md:w-[250px] cursor-pointer items-center text-center gap-[10px] md:gap-[15px] rounded-[15px] px-3 md:px-[25px] pt-[15px] pb-[30px] transition-all duration-200 overflow-hidden ${selected
                ? ""
                : "border border-gray-200/50 dark:border-white/10 opacity-60"
                } ${selected
                    ? "bg-gradient-to-br from-purple-50/80 via-white to-purple-50/50 dark:bg-gradient-to-br dark:from-purple-950/20 dark:via-black dark:to-purple-900/10"
                    : "bg-white/40 dark:bg-white/5 backdrop-blur-sm"
                }`}
            style={{
                borderRadius: "15px",
                opacity: selected ? 1 : 0.6,
                position: "relative",
            }}
            onClick={onClick}
        >
            {/* Framer-style thin animated border line for selected card - only border */}
            {selected && (
                <div
                    className="absolute inset-0 rounded-[15px] pointer-events-none"
                    style={{
                        background: "conic-gradient(from var(--border-angle, 0deg) at 50% 50%, transparent 0deg, transparent 270deg, rgb(163, 92, 162) 300deg, rgb(163, 92, 162) 330deg, transparent 360deg)",
                        padding: "1px",
                        zIndex: 0,
                        animation: "border-rotate 3s linear infinite",
                    }}
                >
                    <div
                        className="w-full h-full rounded-[14px] bg-gradient-to-br from-purple-50/80 via-white to-purple-50/50 dark:bg-gradient-to-br dark:from-purple-950/20 dark:via-black dark:to-purple-900/10"
                    />
                </div>
            )}
            <div className="relative z-10 w-full h-full flex flex-col">
                <div
                    className={`rounded-[15px] relative py-1.5 px-4 font-semibold text-xs text-purple-700 dark:text-purple-300 flex items-center justify-center bg-purple-100/60 dark:bg-purple-900/30 backdrop-blur-sm`}
                >
                    <div
                        style={roleMaskStyle as React.CSSProperties}
                        className="border border-purple-300/50 dark:border-purple-500/30 pointer-events-none"
                    />
                    <p>{userRole}</p>
                </div>
                <div className="flex-1">
                    <h3
                        className={`font-bold text-center mb-2.5 text-lg -tracking-[0.02em] text-gray-900 dark:text-white`}
                    >
                        {title}
                    </h3>

                    <p className="text-xs text-gray-700 dark:text-gray-300">
                        {description || (accountType === "Demo"
                            ? "Perfect for newbies--Kick off your trading journey with micro lots."
                            : (userRole === "For Experts"
                                ? "Designed for skilled traders who demand performance, speed, and precision."
                                : "Ideal for traders taking their first steps with clarity and confidence."))}
                    </p>
                    <div className="mt-[15px] flex items-center flex-col gap-2.5">
                        <p className={`text-xs font-semibold text-gray-800 dark:text-gray-200`}>
                            Minimum Deposit{" "}
                            <span className="text-gray-900 dark:text-white ml-1 text-sm">{formatMinDeposit(minDeposit)}</span>
                        </p>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent dark:from-transparent dark:via-purple-700/50 dark:to-transparent" />
                        <p className={`text-xs font-semibold text-gray-800 dark:text-gray-200`}>
                            {spreadLabel}{" "}
                            <span className="text-gray-700 dark:text-gray-300 ml-1 text-sm">{formatSpread(spread)}</span>
                        </p>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent dark:from-transparent dark:via-purple-700/50 dark:to-transparent" />
                        <p className={`text-xs font-semibold text-gray-800 dark:text-gray-200`}>
                            Leverage{" "}
                            <span className="text-gray-700 dark:text-gray-300 ml-1 text-sm">{formatLeverage(leverage)}</span>
                        </p>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent dark:from-transparent dark:via-purple-700/50 dark:to-transparent" />
                        <p className={`text-xs font-semibold text-gray-800 dark:text-gray-200`}>
                            {commissionLabel}{" "}
                            <span className="text-gray-900 dark:text-white ml-1 text-sm">{formatCommission(commission)}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}