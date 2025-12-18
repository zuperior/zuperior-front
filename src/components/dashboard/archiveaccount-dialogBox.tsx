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

type ArchiveAccountDialogProps = {
    open: boolean;
    onOpen: (open: boolean) => void;
    accountNumber?: number;
    internalId?: string;
};

export const ArchiveAccountDialog = ({
    open,
    onOpen,
    accountNumber,
    internalId,
}: ArchiveAccountDialogProps) => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const handleArchive = async () => {
        if (!internalId) {
            toast.error("Internal account ID missing");
            return;
        }

        setLoading(true);
        try {
            console.log("Archiving account:", internalId);
            const response = await mt5Service.archiveAccount(internalId);

            if (response.success) {
                toast.success("Account archived successfully");

                // Refresh accounts list
                dispatch(fetchUserAccountsFromDb({ includeArchived: true }) as any);

                onOpen(false);
            } else {
                throw new Error(response.message || "Failed to archive account");
            }
        } catch (err: any) {
            console.error("Archive account error:", err);
            const errorMessage =
                err.response?.data?.message ||
                err.message ||
                "Failed to archive account";
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
                        Archive Account
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm opacity-80 pt-2">
                        Are you sure you want to archive account #{accountNumber}?
                        <br />
                        It will be moved to the Archived tab.
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
                        onClick={handleArchive}
                    >
                        {loading ? "Archiving..." : "Archive"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
