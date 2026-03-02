"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface TopUpDialogProps {
  accountNumber: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopUpDialog({
  open,
  onOpenChange,
  accountNumber,
}: TopUpDialogProps) {
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('userToken');
      const balanceResponse = await fetch(`/api/mt5/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          login: accountNumber,
          balance: amountNum,
          comment: "Top up for demo account"
        })
      });

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        toast.success(`Balance of $${amountNum.toFixed(2)} added to demo account`);
        setAmount("");
        onOpenChange(false);
      } else {
        const errorData = await balanceResponse.json().catch(() => ({}));
        console.error("❌ Failed to add balance:", errorData);
        toast.error(`Failed to add balance: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("❌ Error adding balance to demo account:", error);
      toast.error("Failed to add balance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      setAmount("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="border-2 border-transparent p-6 dark:text-white/75 rounded-[18px] w-full bg-white [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border gap-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Top Up Demo Account
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 w-full">
          <div className="text-base font-medium mb-2">
            Account # {accountNumber}
          </div>
          <Label
            htmlFor="top-up-amount"
            className="space-y-1 flex flex-col items-start"
          >
            <span className="text-sm font-medium mb-1">Amount</span>
            <Input
              id="top-up-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              className="border-gray-300 dark:border-[#FFFFFF]/15 rounded-[12px] cursor-pointer w-full bg-white dark:bg-[#050105] text-black dark:text-white placeholder:text-black dark:placeholder:text-white/25 p-5"
            />
          </Label>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              className="bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] cursor-pointer text-white"
            >
              {isSubmitting ? "Processing..." : "Top Up"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

