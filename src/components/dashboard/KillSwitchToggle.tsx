import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldAlert, ShieldCheck, Clock } from "lucide-react";
import type { RootState } from "@/store";
import { mt5Service } from "@/services/api.service";
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
 * Allows users to disable trading on all accounts for 24 hours.
 * Once activated, only an admin can deactivate it before the 24h period expires.
 */
export function KillSwitchToggle() {
    const user = useSelector((state: RootState) => state.user.data);
    const dispatch = useDispatch<any>();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

    const isActive = user?.killSwitchActive || false;
    const expiryTime = user?.killSwitchUntil;

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
            console.error("Error toggling kill switch:", error);
            toast.error(error.message || "Failed to toggle kill switch");
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    return (
        <div className="flex items-center gap-3 bg-secondary/30 hover:bg-secondary/50 transition-colors px-4 py-2 rounded-xl border border-border/50 shadow-sm">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={`p-2 rounded-full transition-colors ${isActive ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                            {isActive ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[250px] bg-popover text-popover-foreground border-border">
                        <p className="text-xs font-medium leading-relaxed">
                            {isActive
                                ? "It will automatically re active after 24 hrs"
                                : "By enabling this, the trading functionality of all your accounts will be disabled for the next 24 hours."}
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
                                This will disable trading on <strong className="text-foreground">all</strong> your accounts for the next 24 hours.
                                <br /><br />
                                <span className="text-red-400/90 font-medium">It will automatically re active after 24 hrs</span>
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
        </div>
    );
}
