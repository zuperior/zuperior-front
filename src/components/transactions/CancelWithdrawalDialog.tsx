"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import axios from "axios";

type CancelWithdrawalDialogProps = {
    open: boolean;
    onOpen: (open: boolean) => void;
    depositID: string;
    onSuccess?: () => void;
};

export const CancelWithdrawalDialog = ({
    open,
    onOpen,
    depositID,
    onSuccess,
}: CancelWithdrawalDialogProps) => {
    const [loading, setLoading] = useState(false);

    const handleCancel = async () => {
        if (!depositID) {
            toast.error("Withdrawal ID missing");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('userToken');
            const response = await axios.post(`/api/withdraw/cancel/${depositID}`, {}, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined
            });

            if (response.data.success) {
                toast.success("Withdrawal cancelled and refunded to wallet.");
                if (onSuccess) onSuccess();
                onOpen(false);
            } else {
                toast.error(response.data.message || "Failed to cancel withdrawal.");
            }
        } catch (err: any) {
            console.error("Cancel withdrawal error:", err);
            const errorMessage =
                err.response?.data?.message ||
                err.message ||
                "Error cancelling withdrawal.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpen}>
            <DialogContent className="border-2 border-transparent p-6 dark:text-white/75 rounded-[18px] w-full max-w-[400px] bg-white [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border gap-6 z-[9999]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-center">
                        Cancel Withdrawal
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm opacity-80 pt-2">
                        Are you sure you want to cancel this withdrawal?
                        <br />
                        The amount will be immediately refunded to your wallet.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-3 mt-2">
                    <Button
                        variant="outline"
                        className="flex-1 border border-[#362e36] dark:bg-[#070307] dark:text-white/75 dark:hover:bg-[#1e171e]"
                        onClick={() => onOpen(false)}
                        disabled={loading}
                    >
                        Back
                    </Button>
                    <Button
                        disabled={loading}
                        variant="destructive"
                        className="flex-1 cursor-pointer bg-red-500 hover:bg-red-600 text-white"
                        onClick={handleCancel}
                    >
                        {loading ? "Cancelling..." : "Confirm Cancel"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
