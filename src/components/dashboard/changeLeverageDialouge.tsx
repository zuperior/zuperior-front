"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useFetchUserData } from "@/hooks/useFetchUserData";
import { fetchUserAccountsFromDb, updateAccountLeverage } from "@/store/slices/mt5AccountSlice";
import { useDispatch } from "react-redux";

// Standard leverage options available in MT5
const LEVERAGE_OPTIONS = [
  { value: "100", label: "1:100" },
  { value: "200", label: "1:200" },
  { value: "300", label: "1:300" },
  { value: "500", label: "1:500" },
  { value: "1000", label: "1:1000" },
  { value: "1500", label: "1:1500" },
  { value: "2000", label: "1:2000" },
];

export default function ChangeLeverageDialog({
  open,
  onOpenChange,
  accountNumber,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountNumber: string;
  currency: string;
}) {
  const dispatch = useDispatch();
  const [selectedLeverage, setSelectedLeverage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { fetchAllData } = useFetchUserData();

  // Reset selected leverage when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedLeverage("");
    }
  }, [open]);

  // Confirm handler
  const handleConfirm = async () => {
    if (!selectedLeverage) {
      toast.error("Please select a leverage");
      return;
    }

    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const res = await axios.put(
        `/api/mt5/update-account/${accountNumber}/leverage`,
        { leverage: parseInt(selectedLeverage) },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = res.data;

      if (data.success) {
        // Immediately update Redux state with new leverage (instant UI update)
        dispatch(updateAccountLeverage({
          accountId: accountNumber,
          leverage: parseInt(selectedLeverage)
        }));

        toast.success("Leverage changed successfully!");

        // Then refresh from database to ensure consistency (async, won't block UI)
        dispatch(fetchUserAccountsFromDb() as any);
        await fetchAllData(); // Refresh all user data

        onOpenChange(false);
      } else {
        throw new Error(data.message || "Change leverage failed");
      }
    } catch (err: any) {
      console.error("Change leverage error:", err);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to change leverage";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-2 border-transparent p-6 dark:text-white/75 rounded-[18px] flex flex-col items-center w-full bg-white [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border"
        disableOutsideClick={true}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold dark:text-white/75">
            Change Leverage
          </DialogTitle>
        </DialogHeader>

        <div className="w-full px-6 mt-4">
          <Label className="text-sm text-blak dark:text-white/75 mb-1">
            Choose Your Leverage
          </Label>

          <Select
            value={selectedLeverage}
            onValueChange={(val) => setSelectedLeverage(val)}
          >
            <SelectTrigger className="border-[#362e36] p-5 dark:bg-[#070307] w-full text-black dark:text-white">
              <SelectValue
                placeholder="Select Leverage"
              />
            </SelectTrigger>

            <SelectContent className="border-[#1e171e] bg-white dark:bg-[#060207]">
              {LEVERAGE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-black dark:text-white/75"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-5 w-full">
            <Button
              variant="outline"
              className="flex-1 border border-[#362e36] dark:bg-[#070307] dark:text-white/75 dark:hover:bg-[#1e171e]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={loading}
              className="flex-1 cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9]"
              onClick={handleConfirm}
            >
              {loading ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
