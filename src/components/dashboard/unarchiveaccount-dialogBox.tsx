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
import { useDispatch } from "react-redux";
import { fetchUserAccountsFromDb } from "@/store/slices/mt5AccountSlice";
import { mt5Service } from "@/services/api.service";

type UnarchiveAccountDialogProps = {
    open: boolean;
    onOpen: (open: boolean) => void;
    accountNumber?: number;
    internalId?: string;
    accountType?: string;
};

export const UnarchiveAccountDialog = ({
    open,
    onOpen,
    accountNumber,
    internalId,
    accountType,
}: UnarchiveAccountDialogProps) => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const handleUnarchive = async () => {
        if (!internalId && !accountNumber) {
            toast.error("Account ID is required");
            return;
        }

        // Use internal ID if available, otherwise use accountNumber
        const idToUse = internalId || accountNumber?.toString();

        if (!idToUse) {
            toast.error("Account ID is missing");
            return;
        }

        setLoading(true);
        try {


            const response = await mt5Service.unarchiveAccount(idToUse);



            // normalizeOk returns { success: boolean, data: any, message?: string }
            // The response structure after normalizeOk should be:
            // { success: true, data: {...}, message: '...' }
            if (response && response.success === true) {
                toast.success(response.message || "Account unarchived successfully");

                // Refresh accounts list
                dispatch(fetchUserAccountsFromDb({ includeArchived: true }) as any);

                // Trigger unarchive event to switch tabs
                const unarchiveEvent = new CustomEvent('account-unarchived', {
                    detail: { accountType: accountType || 'Live' }
                });
                window.dispatchEvent(unarchiveEvent);

                onOpen(false);
            } else {
                // Response structure: { success: false, message: string } or { success: false, data: { message: string } }
                const errorMsg = response?.message || response?.data?.message || "Failed to unarchive account";
                console.error("❌ Unarchive failed - response:", response);
                console.error("❌ Error message:", errorMsg);
                throw new Error(errorMsg);
            }
        } catch (err: any) {
            console.error("❌ Unarchive account error:", err);
            console.error("❌ Error details:", {
                message: err.message,
                response: err.response,
                data: err.response?.data,
                stack: err.stack
            });

            // Extract error message from various possible locations
            const errorMessage =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.response?.data?.detail ||
                err.message ||
                "Failed to unarchive account";

            console.error("❌ Final error message:", errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpen}>
            <DialogContent className="border-2 border-transparent p-6 dark:text-white/75 rounded-[18px] w-full max-w-[400px] bg-white [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border gap-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-center">
                        Unarchive Account
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm opacity-80 pt-2">
                        Are you sure you want to unarchive account #{accountNumber}?
                        <br />
                        It will be moved back to the active accounts.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-3 mt-2">
                    <Button
                        variant="outline"
                        className="flex-1 border border-[#362e36] dark:bg-[#070307] dark:text-white/75 dark:hover:bg-[#1e171e]"
                        onClick={() => onOpen(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={loading}
                        className="flex-1 cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9]"
                        onClick={handleUnarchive}
                    >
                        {loading ? "Unarchiving..." : "Unarchive"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

