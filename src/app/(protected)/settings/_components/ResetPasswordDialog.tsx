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
import { useAppDispatch } from "@/store/hooks";
// import { fetchAccessToken } from "@/store/slices/accessCodeSlice";
import EyeIcon from "@/components/EyeIcon";
import { z } from "zod";
import { resetPassword } from "@/services/resetPassword";

// Password validation schema
const basePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password cannot be longer than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

const passwordSchema = basePasswordSchema.refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

interface ResetMainPasswordDialogProps {
  email: string;
  open: boolean;
  onOpen: (open: boolean) => void;
}

export function ResetMainPasswordDialog({
  open,
  onOpen,
  email,
}: ResetMainPasswordDialogProps) {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [visibility, setVisibility] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isApiProcessing, setIsApiProcessing] = useState(false);
  const dispatch = useAppDispatch();

  // Simplified validation function
  const validateField = (fieldName: string, value: string) => {
    try {
      const schemas = {
        oldPassword: basePasswordSchema.shape.oldPassword,
        newPassword: basePasswordSchema.shape.newPassword,
        confirmPassword: basePasswordSchema.shape.confirmPassword,
      };

      schemas[fieldName as keyof typeof schemas]?.parse(value);

      if (fieldName === "confirmPassword" && value !== formData.newPassword) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Passwords do not match",
            path: ["confirmPassword"],
          },
        ]);
      }

      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error.errors[0]?.message || "",
        }));
      }
    }
  };

  const resetForm = () => {
    setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({});
    setVisibility({
      oldPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
  };

  const handleSubmit = async () => {
    setErrors({});
    try {
      passwordSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          formErrors[field] = err.message;
        });
        setErrors(formErrors);
        return;
      }
    }

    setIsApiProcessing(true);
    try {
      const data = await resetPassword({
        email,
        accessToken: '',
        ...formData,
      });

      if ((data as any).success || (data as any).status_code === "1") {
        toast.success("Password Reset Successful", {
          description: "Your password has been successfully updated.",
          duration: 4000,
        });
        resetForm();
        onOpen(false);
      } else {
        toast.error((data as any).message || (data as any).error || "Password Reset Failed");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsApiProcessing(false);
    }
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && !isApiProcessing) {
      resetForm();
    }
    onOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="border-2 border-transparent p-6 dark:text-white/75 rounded-[18px] w-full bg-white [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border gap-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Reset Main Account Password
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 w-full">
          <PasswordInput
            id="old-password"
            label="Old Password"
            placeholder="Enter your old password"
            value={formData.oldPassword}
            visible={visibility.oldPassword}
            error={errors.oldPassword}
            disabled={isApiProcessing}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, oldPassword: value }));
              validateField("oldPassword", value);
            }}
            onToggleVisibility={() =>
              setVisibility((prev) => ({
                ...prev,
                oldPassword: !prev.oldPassword,
              }))
            }
          />
          <PasswordInput
            id="new-password"
            label="New Password"
            placeholder="Enter your new password"
            value={formData.newPassword}
            visible={visibility.newPassword}
            error={errors.newPassword}
            disabled={isApiProcessing}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, newPassword: value }));
              validateField("newPassword", value);
            }}
            onToggleVisibility={() =>
              setVisibility((prev) => ({
                ...prev,
                newPassword: !prev.newPassword,
              }))
            }
          />
          <PasswordInput
            id="confirm-password"
            label="Confirm New Password"
            placeholder="Confirm your new password"
            value={formData.confirmPassword}
            visible={visibility.confirmPassword}
            error={errors.confirmPassword}
            disabled={isApiProcessing}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, confirmPassword: value }));
              validateField("confirmPassword", value);
            }}
            onToggleVisibility={() =>
              setVisibility((prev) => ({
                ...prev,
                confirmPassword: !prev.confirmPassword,
              }))
            }
          />

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isApiProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isApiProcessing}
              className="bg-linear-to-tr to-[#9F8BCF] from-[#6242A5] text-white  "
            >
              {isApiProcessing ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                          5.291A7.962 7.962 0 014 12H0c0 
                          3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </div>
              ) : (
                "Reset Password"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Reusable password input (outside of ResetMainPasswordDialog)
const PasswordInput = ({
  id,
  label,
  placeholder,
  value,
  visible,
  error,
  disabled,
  onChange,
  onToggleVisibility,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
}) => (
  <Label htmlFor={id} className="space-y-1 flex flex-col items-start">
    {label}
    <div className="relative w-full">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-red-400" : ""}
        disabled={disabled}
        minLength={8}
        maxLength={101}
      />
      <EyeIcon visible={visible} onClick={onToggleVisibility} />
    </div>
    {error && <span className="text-red-400 text-xs mt-1">{error}</span>}
  </Label>
);
