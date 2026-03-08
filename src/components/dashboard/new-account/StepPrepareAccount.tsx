import React from "react";
import { DialogTitle } from "../../ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import EyeIcon from "../../EyeIcon";
import { mt5Service } from "@/services/api.service";

interface StepPrepareAccountProps {
  accountType: string;
  handleAccountChange: (value: string) => void;
  leverage: string;
  setLeverage: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  accountName: string;
  setAccountName: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  passwordVisible: boolean;
  setPasswordVisible: (v: boolean) => void;
  topUpAmount: string;
  setTopUpAmount: (value: string) => void;
  errors: {
    accountName?: string;
    password?: string;
    leverage?: string;
    currency?: string;
    topUpAmount?: string;
  };
  loadingStep2: boolean;
  handleSubmit: () => Promise<void>;
  prevStep: () => void;
  accountPlan: any;
  setAccountPlan?: (plan: any) => void;
}

export const StepPrepareAccount: React.FC<StepPrepareAccountProps> = ({
  accountType,
  handleAccountChange,
  leverage,
  setLeverage,
  currency,
  setCurrency,
  accountName,
  setAccountName,
  password,
  setPassword,
  passwordVisible,
  setPasswordVisible,
  topUpAmount,
  setTopUpAmount,
  errors,
  loadingStep2,
  handleSubmit,
  prevStep,
  accountPlan,
  setAccountPlan,
}) => (
  <div className="mx-auto w-[250px] md:w-[400px]">
    <DialogTitle className=" text-[20px] md:text-[28px] mt-3 text-center font-bold text-black dark:text-[#D9D9D9]">
      Prepare your account
    </DialogTitle>
    <Tabs defaultValue={accountType} onValueChange={handleAccountChange}>
      <div className="flex justify-center items-center  border-[#2c262c] mb-4">
        <TabsList className="dark:bg-[#040104] border border-[#1d191d] px-2 py-5.5 rounded-[15px] mt-4 gap-5 w-full">
          <TabsTrigger
            value="Live"
            className="p-2 data-[state=active]:bg-gradient-to-r  from-[#1E1429] to-[#311B47]/95 px-6 cursor-pointer data-[state=active]:text-white dark:text-white/75 text-black text-[12px] rounded-[10px] transition-all duration-200"
          >
            Live
          </TabsTrigger>
          <TabsTrigger
            value="Demo"
            className="p-2 data-[state=active]:bg-gradient-to-r from-[#1E1429] to-[#311B47]/95 px-6 cursor-pointer data-[state=active]:text-white dark:text-white/75 text-black text-[12px] rounded-[10px] transition-all duration-200"
          >
            Demo
          </TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
    <div className="space-y-3.5">
      <div className="space-y-1">
        <Label htmlFor="leverage" className="text-white/75 text-[14px]">
          Take your Leverage
        </Label>
        <Select value={leverage} onValueChange={setLeverage}>
          <SelectTrigger
            className="border-gray-300 dark:border-[#FFFFFF]/15 rounded-[12px] cursor-pointer p-5 dark:data-[placeholder]:text-white/25 
          data-[placeholder]:text-black w-full dark:bg-[#050105] text-black dark:text-white/75"
          >
            <SelectValue placeholder="Select the Value" />
          </SelectTrigger>
          <SelectContent className="border-[#2a3247] dark:bg-[#232838] dark:text-white/75 text-black cursor-pointer">
            <SelectItem value="100">1:100</SelectItem>
            <SelectItem value="200">1:200</SelectItem>
            <SelectItem value="300">1:300</SelectItem>
            <SelectItem value="500">1:500</SelectItem>
            <SelectItem value="1000">1:1000</SelectItem>
            <SelectItem value="1500">1:1500</SelectItem>
            <SelectItem value="2000">1:2000</SelectItem>
          </SelectContent>
        </Select>
        {errors.leverage && (
          <p className="text-red-400 text-[10px] mt-1">{errors.leverage}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="currency" className="dark:text-white/75 text-black text-[14px]">
          Choose your currency
        </Label>
        <Select value={currency} onValueChange={setCurrency} disabled>
          <SelectTrigger className="border-[#FFFFFF]/15 rounded-[12px] cursor-pointer w-full bg-[#050105] p-5 data-[placeholder]:text-white/25 ">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent
            className="border-[#2a3247] bg-[#232838] dark:text-white/75 text-black"
            defaultValue={currency}
          >
            <SelectItem value="USD">USD</SelectItem>
            {/* <SelectItem value="INR">INR</SelectItem> */}
          </SelectContent>
        </Select>
        {errors.currency && (
          <p className="text-red-400 text-[10px] mt-1">{errors.currency}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="accountName" className="dark:text-white/75 text-black text-[14px]">
          Give your account a name
        </Label>
        <Input
          id="accountName"
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="Zuper"
          className="border-gray-300 dark:border-[#FFFFFF]/15 
             rounded-[12px] cursor-pointer w-full 
             bg-white dark:bg-[#050105] 
             text-black dark:text-white 
             placeholder:text-black dark:placeholder:text-white/25 
             p-5"
        />
        {errors.accountName && (
          <p className="text-red-400 text-[10px] mt-1">{errors.accountName}</p>
        )}
      </div>
      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg mb-6 border border-primary/20">
        <div className="flex flex-col">
          <span className="text-[12px] opacity-70">Selected Plan</span>
          <span className="text-sm font-bold text-primary">
            {accountPlan?.dedicated_name || accountPlan?.group?.split('\\').pop() || "Select a plan"}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[12px] opacity-70">Type</span>
          <span className="text-sm font-semibold">
            {accountType === 'Live' ? 'Real' : 'Demo'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="password" className="text-black dark:text-white/75 text-[14px]">
          Trading Password
        </Label>
        <div className="relative">
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            id="password"
            type={passwordVisible ? "text" : "password"}
            placeholder="******"
            className="border-gray-300 dark:border-[#FFFFFF]/15 
             rounded-[12px] cursor-pointer w-full 
             bg-white dark:bg-[#050105] 
             text-black dark:text-white 
             placeholder:text-black dark:placeholder:text-white/25 
             p-5"
          />
          <EyeIcon
            visible={passwordVisible}
            onClick={() => setPasswordVisible(!passwordVisible)}
            className=""
          />
        </div>
        {errors.password && (
          <p className="text-red-400 text-[10px] mt-1">{errors.password}</p>
        )}
      </div>
      {accountType.toLowerCase() === "demo" && (
        <div className="space-y-1">
          <Label htmlFor="topUpAmount" className="dark:text-white/75 text-black text-[14px]">
            Top Up Amount (Optional)
          </Label>
          <Input
            id="topUpAmount"
            type="number"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            placeholder="0.00"
            className="border-gray-300 dark:border-[#FFFFFF]/15 
               rounded-[12px] cursor-pointer w-full 
               bg-white dark:bg-[#050105] 
               text-black dark:text-white 
               placeholder:text-black dark:placeholder:text-white/25 
               p-5"
          />
          {errors.topUpAmount && (
            <p className="text-red-400 text-[10px] mt-1">{errors.topUpAmount}</p>
          )}
        </div>
      )}
      <div className="flex flex-col">
        <Button
          className="flex-1 cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9] flex items-center justify-center"
          onClick={async () => {
            await handleSubmit();
          }}
          disabled={loadingStep2}
        >
          {loadingStep2 ? (
            <svg
              className="animate-spin h-7 w-7"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <defs>
                <linearGradient
                  id="loader-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#a259ff" />
                  <stop offset="100%" stopColor="#6a3fd9" />
                </linearGradient>
              </defs>
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="url(#loader-gradient)"
                strokeWidth="4"
                fill="none"
                opacity="0.3"
              />
              <path
                d="M12 2 a10 10 0 0 1 0 20 a10 10 0 0 1 0-20"
                stroke="url(#loader-gradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="40"
                strokeDashoffset="10"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 12 12"
                  to="360 12 12"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          ) : (
            "Continue"
          )}
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-transparent cursor-pointer dark:text-white/75 text-black border-none text-xs mt-1 dark:hover:bg-[#090209] dark:hover:text-white"
          onClick={prevStep}
        >
          Back
        </Button>
      </div>
    </div>
  </div>
);
