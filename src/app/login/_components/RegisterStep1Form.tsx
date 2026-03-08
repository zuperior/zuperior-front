import React, { useEffect, useRef } from "react";
import Image from "next/image";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import EyeIcon from "@/components/EyeIcon";
import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import countries from "@/lib/countries.json";

interface RegisterStep1FormProps {
  registerBuffer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    country: string;
    country_code: string;
  };
  setRegisterBuffer: React.Dispatch<
    React.SetStateAction<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      password: string;
      country: string;
      country_code: string;
    }>
  >;
  validationErrors: { [key: string]: string };
  clearFieldError: (fieldName: string) => void;
  passwordVisible: boolean;
  setPasswordVisible: (visible: boolean) => void;
}

interface CountryData {
  name: string;
  dialCode: string;
  countryCode: string;
  format: string;
}

const RegisterStep1Form: React.FC<RegisterStep1FormProps> = ({
  registerBuffer,
  setRegisterBuffer,
  validationErrors,
  clearFieldError,
  passwordVisible,
  setPasswordVisible,
}) => {
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneWrapperRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // On mount, get real input element from PhoneInput wrapper
  useEffect(() => {
    if (phoneWrapperRef.current) {
      // The phone input renders an <input type="tel"> inside wrapper div
      phoneInputRef.current =
        phoneWrapperRef.current.querySelector("input[type='tel']");
    }
  }, []);

  const inputs = [
    firstNameRef,
    lastNameRef,
    emailRef,
    phoneInputRef,
    passwordRef,
  ];

  const signupExcludedCountries = new Set<string>([
    "Martinique",
    "Belize",
    "Iraq",
  ]);

  const signupAllowedCountries = countries.filter(
    ({ name }) => !signupExcludedCountries.has(name)
  );

  // Helper to focus input by index when pressing arrow keys
  const onKeyDown = (e: React.KeyboardEvent<Element>, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (index + 1 < inputs.length) {
        inputs[index + 1].current?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index - 1 >= 0) {
        inputs[index - 1].current?.focus();
      }
    }
  };

  const getInputClassName = (fieldName: string) =>
    `w-full bg-[#1a1a1a] p-3 rounded text-white text-sm focus:outline-none ${
      validationErrors[fieldName]
        ? "border border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/20"
        : "border border-transparent focus:border-purple-500/50 focus:shadow-lg focus:shadow-purple-500/20"
    }`;

  return (
    <>
      <div>
        <input
          ref={firstNameRef}
          type="text"
          placeholder="First Name"
          className={getInputClassName("firstName")}
          value={registerBuffer.firstName}
          onChange={(e) => {
            setRegisterBuffer({ ...registerBuffer, firstName: e.target.value });
            clearFieldError("firstName");
          }}
          onKeyDown={(e) => onKeyDown(e, 0)}
        />
        {validationErrors.firstName && (
          <p className="text-red-400 text-xs mt-1 animate-pulse">
            {validationErrors.firstName}
          </p>
        )}
      </div>

      <div>
        <input
          ref={lastNameRef}
          type="text"
          placeholder="Last Name"
          className={getInputClassName("lastName")}
          value={registerBuffer.lastName}
          onChange={(e) => {
            setRegisterBuffer({ ...registerBuffer, lastName: e.target.value });
            clearFieldError("lastName");
          }}
          onKeyDown={(e) => onKeyDown(e, 1)}
        />
        {validationErrors.lastName && (
          <p className="text-red-400 text-xs mt-1 animate-pulse">
            {validationErrors.lastName}
          </p>
        )}
      </div>

      <div>
        <input
          ref={emailRef}
          type="email"
          placeholder="Email"
          className={getInputClassName("email")}
          value={registerBuffer.email}
          onChange={(e) => {
            setRegisterBuffer({ ...registerBuffer, email: e.target.value });
            clearFieldError("email");
          }}
          onKeyDown={(e) => onKeyDown(e, 2)}
        />
        {validationErrors.email && (
          <p className="text-red-400 text-xs mt-1 animate-pulse">
            {validationErrors.email}
          </p>
        )}
      </div>

      <div>
        <Select
          value={registerBuffer.country}
          onValueChange={(value) => {
            setRegisterBuffer({ ...registerBuffer, phone: "" });
            setRegisterBuffer({ ...registerBuffer, country: value });
            clearFieldError("country");
          }}
        >
          <SelectTrigger className={cn(getInputClassName("country"), "py-5")}>
            <SelectValue placeholder="Select Country" />
          </SelectTrigger>
          <SelectContent className="w-full">
            {signupAllowedCountries.map(({ name, code }) => (
              <SelectItem key={code} value={code}>
                <Image
                  src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
                  alt={code}
                  className="inline-block mr-2"
                  width={24}
                  height={18}
                  style={{ objectFit: "cover", verticalAlign: "middle" }}
                />
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {validationErrors.country && (
          <p className="text-red-400 text-xs mt-1 animate-pulse">
            {validationErrors.country}
          </p>
        )}
      </div>

      <div ref={phoneWrapperRef}>
        <PhoneInput
          country={registerBuffer.country || "in"}
          placeholder="Enter phone number"
          value={registerBuffer.phone}
          disableDropdown={true}
          onChange={(value, countryData: CountryData) => {
            setRegisterBuffer({
              ...registerBuffer,
              country: countryData.countryCode,
              phone: value,
              country_code: countryData.dialCode,
            });
            clearFieldError("phone");
          }}
          containerClass="w-full"
          inputClass={`!bg-[#1a1a1a] !p-3 !rounded !text-white !text-[13px] !w-full !h-[46px] !border ${
            validationErrors.phone
              ? "!border-red-500/50 !bg-red-500/5 !shadow-lg !shadow-red-500/20"
              : "!border-transparent focus:!border-purple-500/50 focus:!shadow-lg focus:!shadow-purple-500/20"
          }`}
          dropdownStyle={{
            maxHeight: "250px",
            overflowY: "auto",
            zIndex: 9999,
            backgroundColor: "#1a1a1a",
            color: "white",
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onKeyDown={(e) => onKeyDown(e as any, 3)}
        />
        {validationErrors.phone && (
          <p className="text-red-400 text-xs mt-1 animate-pulse">
            {validationErrors.phone}
          </p>
        )}
      </div>

      <div className="relative">
        <div className="relative">
          <input
            ref={passwordRef}
            type={passwordVisible ? "text" : "password"}
            placeholder="Password"
            className={`${getInputClassName("password")} pr-10 mb-0`}
            value={registerBuffer.password}
            onChange={(e) => {
              setRegisterBuffer({
                ...registerBuffer,
                password: e.target.value,
              });
              clearFieldError("password");
            }}
            onKeyDown={(e) => onKeyDown(e, 4)}
          />

          {/* Eye icon - aligned with input text */}
          <EyeIcon
            visible={passwordVisible}
            onClick={() => setPasswordVisible(!passwordVisible)}
          />
        </div>

        {validationErrors.password && (
          <p className="text-red-400 text-xs mt-1 animate-pulse">
            {validationErrors.password}
          </p>
        )}
      </div>
      {/* Info section */}
      <div className="mt-2 text-gray-400 text-xs flex items-start gap-1">
        <Info className="w-4 h-4 mt-[1px]" />
        <span>
          Your password will be used for both platform login and your
          auto-generated trading account.
        </span>
      </div>
    </>
  );
};

export default RegisterStep1Form;
