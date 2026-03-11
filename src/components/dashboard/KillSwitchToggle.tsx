import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldAlert, ShieldCheck, Clock } from "lucide-react";
import type { RootState } from "@/store";
import { mt5Service, userService } from "@/services/api.service";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { setKillSwitchStatus, getUser } from "@/store/slices/getUserSlice";

/**
 * KillSwitchToggle Component
 * Allows users to disable trading on all accounts until 2:00 AM UTC the next day.
 * Once activated, only an admin can deactivate it before the 24h period expires.
 */
export function KillSwitchToggle() {
    const user = useSelector((state: RootState) => state.user.data);
    const dispatch = useDispatch<any>();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Debug state to show raw error
    const [lastError, setLastError] = useState<any>(null);
    const [showOpenPositionsError, setShowOpenPositionsError] = useState(false);
    const [openPositionsData, setOpenPositionsData] = useState<any[]>([]);
    const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

    const isActive = user?.killSwitchActive || false;
    const expiryTime = user?.killSwitchUntil;

    // Sync status with server on mount (handle multi-tab/browser updates)
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await userService.getProfile();
                if (response.success && response.data) {
                    dispatch(setKillSwitchStatus({
                        active: response.data.killSwitchActive ?? false,
                        until: response.data.killSwitchUntil ?? null
                    }));
                }
            } catch (error) {
                console.error("Failed to sync kill switch status:", error);
            }
        };

        fetchStatus();
    }, [dispatch]);

    // Countdown Timer and Auto-Refresh logic
    useEffect(() => {
        if (!isActive || !expiryTime) {
            setTimeRemaining(null);
            return;
        }

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = new Date(expiryTime).getTime() - now;

            if (distance < 0) {
                setTimeRemaining("00:00:00");
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const hh = hours.toString().padStart(2, '0');
            const mm = minutes.toString().padStart(2, '0');
            const ss = seconds.toString().padStart(2, '0');

            setTimeRemaining(`${hh}:${mm}:${ss}`);
        };

        updateTimer(); // Initial call
        const interval = setInterval(updateTimer, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [isActive, expiryTime, user?.email, dispatch]);

    const handleToggle = (checked: boolean) => {
        // User is only allowed to ENABLE. Disabling is restricted in UI but handled here as safety.
        if (checked) {
            setShowConfirm(true);
        }
    };

    const performToggle = async (active: boolean) => {
        setLoading(true);
        try {
            const response = await mt5Service.toggleKillSwitch(active);

            if (response.success) {
                // Update local Redux state immediately
                dispatch(setKillSwitchStatus({
                    active: response.data.active,
                    until: response.data.until
                }));

                toast.success(active ? "Kill switch activated" : "Kill switch deactivated");
            } else {
                toast.error(response.message || "Failed to toggle kill switch");
            }
        } catch (error: any) {
            // Check if error is due to validation (400 status from kill-switch)
            if (error.response?.status === 400) {
                const errorData = error.response?.data;

                // IMPORTANT: Ensure Kill Switch stays OFF by refreshing from server FIRST
                try {
                    const response = await userService.getProfile();
                    if (response.success && response.data) {
                        dispatch(setKillSwitchStatus({
                            active: response.data.killSwitchActive ?? false,
                            until: response.data.killSwitchUntil ?? null
                        }));
                    }
                } catch (refreshError) {
                    console.error("Failed to refresh kill switch status:", refreshError);
                }

                // Always show modal for 400 errors from kill-switch
                if (errorData?.accountsWithOpenPositions && Array.isArray(errorData.accountsWithOpenPositions) && errorData.accountsWithOpenPositions.length > 0) {
                    setOpenPositionsData(errorData.accountsWithOpenPositions);
                } else if (errorData?.accountsWithOpenPositions) {
                    // Handle case where it might be a single object or different structure
                    const data = Array.isArray(errorData.accountsWithOpenPositions) ? errorData.accountsWithOpenPositions : [errorData.accountsWithOpenPositions];
                    setOpenPositionsData(data);
                } else {
                    // Show modal with generic message if no account details
                    setOpenPositionsData([{
                        accountId: 'one or more accounts',
                        openPositions: 1
                    }]);
                }
                setShowOpenPositionsError(true);
            } else {
                // Only log unexpected errors to console
                console.error("Error toggling kill switch:", error);
                toast.error(error.response?.data?.message || error.message || "Failed to toggle kill switch");
            }
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    return (
        <div className="flex items-center gap-2.5 bg-secondary/30 hover:bg-secondary/50 transition-colors px-4 py-2 rounded-xl border border-border/50 shadow-sm">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={`p-2 rounded-full transition-colors ${isActive ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                            {isActive ? <ShieldAlert className="md:size-5 size-3.5" /> : <ShieldCheck className="md:size-5 size-3.5" />}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[250px] bg-popover text-popover-foreground border-border">
                        <p className="text-xs font-medium leading-relaxed">
                            {isActive
                                ? "Trading accounts will be enabled at UTC+2 00:00 hrs"
                                : "By enabling this, the trading functionality of all your accounts will be disabled until next trading session UTC +2 00:00 hrs"}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <div className="flex flex-col min-w-[80px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 leading-none mb-1">Kill Switch</span>
                <div className="flex flex-col gap-0.5">
                    <span className={`text-[11px] font-bold leading-none ${isActive ? 'text-red-500' : 'text-primary'}`}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    {isActive && timeRemaining && (
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
                            <Clock size={10} />
                            <span>{timeRemaining}</span>
                        </div>
                    )}
                </div>
            </div>

            <Switch
                checked={isActive}
                onCheckedChange={handleToggle}
                disabled={loading || isActive}
                className={`data-[state=checked]:bg-red-500 ${isActive ? 'cursor-not-allowed opacity-70' : ''}`}
            />

            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none bg-[#0a0a0c]">
                    <div className="p-8 pb-6 flex flex-col gap-6">
                        <DialogHeader className="gap-3">
                            <DialogTitle className="flex items-center gap-3 text-red-500 text-xl font-bold tracking-tight">
                                <div className="p-2.5 rounded-full bg-red-500/10">
                                    <ShieldAlert size={26} />
                                </div>
                                Activate Kill Switch?
                            </DialogTitle>
                            <DialogDescription className="text-base text-muted-foreground/90 leading-relaxed pt-2">
                                This will disable trading on all your accounts for the current trading session.
                                <br /><br />
                                <span className="text-red-400/90 font-medium">It will automatically be enabled in the next trading session UTC+2 00:00 hrs.</span>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-3 sm:justify-end border-t border-white/5 pt-6 mt-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirm(false)}
                                disabled={loading}
                                className="rounded-xl px-6 border-white/10 hover:bg-white/5"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => performToggle(true)}
                                disabled={loading}
                                className="rounded-xl px-6 bg-red-600 hover:bg-red-700 font-bold"
                            >
                                {loading ? "Activating..." : "Yes, Disable Trading"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Open Positions Error Modal */}
            {showOpenPositionsError && (
                <Dialog open={showOpenPositionsError} onOpenChange={setShowOpenPositionsError}>
                    <DialogContent className="sm:max-w-[550px] bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-red-500/20 shadow-2xl rounded-2xl p-6">
                        <DialogHeader className="space-y-4 pb-4">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-red-400">
                                <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <ShieldAlert size={26} />
                                </div>
                                Cannot Activate Kill Switch
                            </DialogTitle>
                            <DialogDescription className="text-base text-muted-foreground/90 leading-relaxed pt-2">
                                {openPositionsData[0]?.accountId === 'one or more accounts' ? (
                                    <>
                                        You have <strong className="text-red-400">open positions</strong> on your trading accounts.
                                        <span className="mt-4 p-2 bg-black/20 rounded text-xs font-mono break-all text-left block">
                                            DEBUG: {JSON.stringify(lastError || {})}
                                        </span>
                                    </>
                                ) : (
                                    <>You have <strong className="text-red-400">{openPositionsData.reduce((sum, acc) => sum + acc.openPositions, 0)} open position{openPositionsData.reduce((sum, acc) => sum + acc.openPositions, 0) > 1 ? 's' : ''}</strong> across the following account{openPositionsData.length > 1 ? 's' : ''}:</>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Only show account cards if we have specific account data */}
                        {openPositionsData[0]?.accountId !== 'one or more accounts' && (
                            <div className="space-y-3 py-6">
                                {openPositionsData.map((account, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-5 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-foreground text-lg">Account {account.accountId}</span>
                                            <span className="text-sm text-muted-foreground">MT5 Trading Account</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                                            <span className="text-red-400 font-bold text-lg">{account.openPositions}</span>
                                            <span className="text-sm text-red-400/80">open position{account.openPositions > 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5 mt-2">
                            <p className="text-sm text-yellow-400/90 leading-relaxed">
                                <strong>Action Required:</strong> Please close all open positions before activating the Kill Switch.
                            </p>
                        </div>

                        <DialogFooter className="flex gap-3 sm:justify-end border-t border-white/5 pt-6 mt-4">
                            <Button
                                onClick={() => setShowOpenPositionsError(false)}
                                className="rounded-xl px-8 py-2 bg-blue-600 hover:bg-blue-700 font-medium"
                            >
                                Got it
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
