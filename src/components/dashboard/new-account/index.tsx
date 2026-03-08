"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "../../ui/dialog";
import { useAppDispatch } from "@/store/hooks";
import { createMt5Account, fetchMt5Groups } from "@/store/slices/mt5AccountSlice";
import { toast } from "sonner";
import { StepChooseAccountType, DEMO_STATIC_GROUPS, Group } from "./StepChooseAccountType";
import { StepPrepareAccount } from "./StepPrepareAccount";
import { StepAccountCreated } from "./StepAccountCreated";
import { useFetchUserData } from "@/hooks/useFetchUserData";
import { CardLoader } from "@/components/ui/loading";
import { groupManagementService } from "@/services/api.service";

interface NewAccountResponse {
  status: string;
  status_code: string;
  message: string;
  _token: string;
  object: {
    crm_account_id: number;
    crm_tp_account_id: number;
    tp_id: string;
    tp_creation_error: string;
  };
  // Add real MT5 account data
  accountId?: string;
  name?: string;
  group?: string;
  leverage?: number;
  balance?: number;
  equity?: number;
  credit?: number;
  margin?: number;
  marginFree?: number;
  marginLevel?: number;
  profit?: number;
  isEnabled?: boolean;
  createdAt?: string;
}

export function NewAccountDialog({
  open,
  onOpenChange,
}: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState("Live");
  const [accountPlan, setAccountPlan] = useState<Group | null>(null);
  // const [server, setServer] = useState("");
  const [leverage, setLeverage] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [password, setPassword] = useState("");
  const [accountName, setAccountName] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [errors, setErrors] = useState<{
    accountName?: string;
    password?: string;
    leverage?: string;
    currency?: string;
    topUpAmount?: string;
  }>({});
  const [loadingStep2, setLoadingStep2] = useState(false);
  // const [platform, setPlatform] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftValue, setScrollLeftValue] = useState(0);
  // CRM account ID is not required for MT5 account creation

  const [latestAccount, setLatestAccount] = useState<NewAccountResponse | null>(
    null
  );

  const { fetchAllData } = useFetchUserData();

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftValue(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeftValue - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeftValue - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (open) {
      setStep(1);
      setAccountType("Live");
      setAccountPlan(null);
    }
  }, [open]);

  // Auto-select group when entering step 2 or when accountType changes in step 2
  useEffect(() => {
    if (step === 2 && accountType) {
      const needsSelection =
        !accountPlan || (typeof accountPlan === "object" && !accountPlan.group);

      if (needsSelection) {
        const autoSelectGroup = async () => {
          try {
            // For Demo accounts, use static demo groups only
            if (accountType.toLowerCase() === "demo") {
              if (DEMO_STATIC_GROUPS.length > 0) {
                setAccountPlan(DEMO_STATIC_GROUPS[0]);
                console.log(
                  "✅ Auto-selected first static demo group for Demo:",
                  DEMO_STATIC_GROUPS[0].dedicated_name || DEMO_STATIC_GROUPS[0].group
                );
              } else {
                console.warn("⚠️ No static demo groups configured");
              }
              return;
            }

            const response = await groupManagementService.getActiveGroups(accountType);
            if (response.success && response.data && response.data.length > 0) {
              setAccountPlan(response.data[0]);
              console.log(
                "✅ Auto-selected first group for",
                accountType,
                ":",
                response.data[0].dedicated_name || response.data[0].group
              );
            } else {
              console.warn("⚠️ No groups available for account type:", accountType);
            }
          } catch (error) {
            console.error("❌ Error auto-selecting group:", error);
          }
        };
      };

      autoSelectGroup();
    }
  }, [step, accountType]);

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -250, behavior: "smooth" });
  };

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 250, behavior: "smooth" });
  };

  const resetStates = () => {
    setStep(1);
    setAccountPlan(null);
    setAccountType("Live");
    setLeverage("");
    setCurrency("USD");
    setAccountName("");
    setPassword("");
    setTopUpAmount("");
    setPasswordVisible(false);
    setErrors({});
    setLoadingStep2(false);
    setLatestAccount(null);
  };

  const arrowMaskStyle = {
    WebkitMaskImage:
      "linear-gradient(100deg, rgba(255, 255, 255, 0.75) 10%, rgba(255, 255, 255, 0.25) 100%)",
    maskImage:
      "linear-gradient(100deg, rgba(255, 255, 255, 0.75) 10%, rgba(255, 255, 255, 0.25) 100%)",
    borderRadius: "100px",
    opacity: 0.75,
    inset: 0,
    overflow: "visible",
    position: "absolute",
    zIndex: 0,
  };

  const validateStep2 = () => {
    const newErrors: typeof errors = {};
    // Account Name validation
    if (!accountName.trim()) {
      newErrors.accountName = "Account name is required.";
    } else if (accountName.length < 3) {
      newErrors.accountName = "Account name must be at least 3 characters.";
    }
    // Password validation
    if (!password) {
      newErrors.password = "Password is required.";
    } else {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
      if (!passwordRegex.test(password)) {
        newErrors.password =
          "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.";
      }
    }
    // Leverage required
    if (!leverage) {
      newErrors.leverage = "Leverage is required.";
    }
    // Currency required
    if (!currency) {
      newErrors.currency = "Currency is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    // Validate account plan (group) was selected
    // If not selected, try to auto-select the first available group
    if (!accountPlan || !accountPlan.group) {
      console.warn("⚠️ No group selected, attempting to auto-select...");
      try {
        // For Demo accounts, use static demo groups only
        if (accountType.toLowerCase() === "demo") {
          if (DEMO_STATIC_GROUPS.length > 0) {
            setAccountPlan(DEMO_STATIC_GROUPS[0]);
            console.log(
              "✅ Auto-selected first static demo group for Demo during submit:",
              DEMO_STATIC_GROUPS[0].dedicated_name || DEMO_STATIC_GROUPS[0].group
            );
          } else {
            console.error("❌ No static demo groups configured");
            toast.error("Please go back and select an account type");
            setLoadingStep2(false);
            return;
          }
        } else {
          const response = await groupManagementService.getActiveGroups(accountType);
          if (response.success && response.data && response.data.length > 0) {
            setAccountPlan(response.data[0]);
            console.log(
              "✅ Auto-selected first group for",
              accountType,
              ":",
              response.data[0].dedicated_name || response.data[0].group
            );
            // Continue with the selected group
          } else {
            console.error("❌ Invalid account plan selected:", accountPlan);
            toast.error("Please go back and select an account type");
            setLoadingStep2(false);
            return;
          }
        }
      } catch (error) {
        console.error("❌ Error auto-selecting group:", error);
        toast.error("Please go back and select an account type");
        setLoadingStep2(false);
        return;
      }
    }

    try {
      setLoadingStep2(true);

      if (!accountPlan) {
        toast.error("Please select an account plan");
        setLoadingStep2(false);
        return;
      }

      // Use group from selected account plan
      const group = accountPlan.group;
      const isDemo = accountType.toLowerCase() === "demo";

      // Generate passwords for MT5 (master and investor)
      const masterPassword = password.trim();
      const investorPassword = masterPassword + "inv"; // Auto-generate investor password

      const payload = {
        name: accountName.trim(),
        group: group,
        leverage: parseInt(leverage) || 100,
        masterPassword: masterPassword,
        investorPassword: investorPassword,
        password: masterPassword, // Legacy field as per API spec
        email: "",
        country: "",
        city: "",
        phone: "",
        comment: `Created from CRM - ${accountType} ${accountPlan.dedicated_name || accountPlan.group} account`,
        accountPlan: accountPlan.dedicated_name || accountPlan.group.split('\\').pop() || "Account" // Include accountPlan name for reference
      };

      const result = await dispatch(createMt5Account(payload)).unwrap();

      // Handle .NET Core API response format and new MT5Account object format
      const resAny = result as any;
      if (result && (typeof result === 'boolean' ? result : resAny.success === true || resAny.success === 'true' || !!result.accountId)) {

        // Check if account was actually created (accountId should not be empty)
        if (!result.accountId || result.accountId === "0") {
          console.error("❌ MT5 account creation failed - accountId is empty");
          console.error("🔍 Full result object:", result);
          toast.error("MT5 account creation failed - please check API configuration");
          setLoadingStep2(false);
          return;
        }

        toast.success(`Your MT5 account has been created successfully! Account ID: ${result.accountId}`);

        // Set the latest account data for the success step
        setLatestAccount({
          ...(result as any),
          status: "success",
          status_code: "200",
          message: "Account created successfully",
          _token: "",
          object: {
            crm_account_id: parseInt(result.accountId) || 0,
            crm_tp_account_id: 0,
            tp_id: result.accountId,
            tp_creation_error: ""
          },
        });

        // Advance to success step immediately
        nextStep();

        // Refresh user data in background (non-blocking)
        fetchAllData(true).catch(e => console.warn("Background data refresh failed:", e));

        // Optional: Add balance to demo account if topUpAmount is provided (non-blocking background task)
        if (isDemo && topUpAmount && parseFloat(topUpAmount) > 0) {
          fetch(`/api/mt5/deposit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            },
            body: JSON.stringify({
              login: result.accountId,
              balance: parseFloat(topUpAmount),
              comment: "Initial demo account balance"
            })
          }).catch(e => console.warn("Failed to add initial demo balance:", e));
        }
      } else {
        toast.error("Failed to create MT5 account");
      }

    } catch (err: any) {
      console.error("MT5 account creation failed:", err);
      let errorMessage = "Failed to create MT5 account. Please try again.";
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoadingStep2(false);
    }
  };


  const handleAccountChange = (value: string) => {
    setAccountType(value);
    // DO NOT reset account plan here! 
    // The useEffect will handle finding the matching group for the new accountType
  };

  const nextStep = () => {
    // Validate that a group is selected before proceeding from step 1
    if (step === 1) {
      if (!accountPlan || (typeof accountPlan === 'object' && !accountPlan.group)) {
        toast.error("Please select an account type");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        resetStates();
      }
    }}>
      <DialogContent className="border-3 border-transparent py-10 px-[35px] md:px-[50px] text-white/75 rounded-lg flex flex-col items-center w-full max-w-[90%] sm:max-w-2xl [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border">
        <DialogHeader className="w-full">
          <div className="flex items-center justify-center">
            <div className="flex items-center h-[24] w-[400px]">
              <div
                className={`flex h-6 w-6 px-3 mx-0 items-center justify-center rounded-full ${step >= 1 ? "bg-[#9F8BCF]" : "bg-[#594B7A]"
                  }`}
              >
                <span className="text-sm font-medium">1</span>
              </div>
              <div
                className={`h-[4px] w-full mx-0 ${step >= 2 ? "bg-[#6B5993]" : "bg-[#392F4F]"
                  }`}
              ></div>
              <div
                className={`flex h-6 w-6 px-3 mx-0 items-center justify-center rounded-full ${step >= 2 ? "bg-[#9F8BCF]" : "bg-[#594B7A]"
                  }`}
              >
                <span className="text-sm font-medium ">2</span>
              </div>
              <div
                className={`h-[4px] w-full mx-0 ${step >= 3 ? "bg-[#6B5993]" : "bg-[#392F4F]"
                  }`}
              ></div>
              <div
                className={`flex h-6 w-6 px-3 items-center justify-center rounded-full ${step >= 3 ? " bg-[#9F8BCF]" : "bg-[#594B7A]"
                  }`}
              >
                <span className="text-sm font-medium">3</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {step === 1 && (
          <StepChooseAccountType
            accountPlan={accountPlan}
            setAccountPlan={setAccountPlan}
            accountType={accountType}
            setAccountType={setAccountType}
            nextStep={nextStep}
            scrollRef={scrollRef as React.RefObject<HTMLDivElement>}
            handleMouseDown={handleMouseDown}
            handleMouseMove={handleMouseMove}
            handleMouseUp={handleMouseUp}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            isDragging={isDragging}
            handleScrollLeft={handleScrollLeft}
            handleScrollRight={handleScrollRight}
            arrowMaskStyle={arrowMaskStyle as React.CSSProperties}
          />
        )}

        {step === 2 && loadingStep2 && (
          <div className="w-full">
            <CardLoader message="Creating your account..." />
          </div>
        )}

        {step === 2 && !loadingStep2 && (
          <StepPrepareAccount
            accountType={accountType}
            handleAccountChange={handleAccountChange}
            accountPlan={accountPlan}
            setAccountPlan={setAccountPlan}
            leverage={leverage}
            setLeverage={setLeverage}
            currency={currency}
            setCurrency={setCurrency}
            accountName={accountName}
            setAccountName={setAccountName}
            password={password}
            setPassword={setPassword}
            passwordVisible={passwordVisible}
            setPasswordVisible={setPasswordVisible}
            topUpAmount={topUpAmount}
            setTopUpAmount={setTopUpAmount}
            errors={errors}
            loadingStep2={loadingStep2}
            handleSubmit={async () => {
              setLoadingStep2(true);
              await handleSubmit();
              setLoadingStep2(false);
            }}
            prevStep={prevStep}
          />
        )}

        {step === 3 && (
          <StepAccountCreated
            latestAccount={latestAccount}
            password={password}
            accountType={accountType}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
