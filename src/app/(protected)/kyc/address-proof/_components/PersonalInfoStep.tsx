"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Country {
  code: string;
  country: string;
  country_code: string;
}

interface PersonalInfoStepProps {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  userCountry?: string; // User's country from profile
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  setAddress: (value: string) => void;
  onNext: () => void;
}

export default function PersonalInfoStep({
  firstName,
  lastName,
  address,
  phoneNumber,
  userCountry,
  setFirstName,
  setLastName,
  setPhoneNumber,
  setAddress,
  onNext,
}: PersonalInfoStepProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
  const [phoneNumberOnly, setPhoneNumberOnly] = useState<string>("");
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState<string>("");

  // Fetch countries from database
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("/api/countries");
        const data = await response.json();
        console.log("Countries API response:", data);
        if (data.success && Array.isArray(data.countries)) {
          setCountries(data.countries);
        } else {
          console.error("Invalid countries response:", data);
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // Parse phone number from user database and set country code from user profile
  useEffect(() => {
    if (countries.length === 0 || isInitialized) return;

    // Priority 1: Get country from user profile
    let detectedCountryCode: string | null = null;
    if (userCountry) {
      // Find country by country name or code (case insensitive)
      const userCountryMatch = countries.find(
        (c) => 
          c.country?.toLowerCase() === userCountry.toLowerCase() ||
          c.code?.toLowerCase() === userCountry.toLowerCase()
      );
      if (userCountryMatch?.country_code) {
        detectedCountryCode = userCountryMatch.country_code;
        console.log("✅ Detected country from user profile:", {
          userCountry,
          countryCode: detectedCountryCode,
          countryName: userCountryMatch.country
        });
      }
    }

    // Priority 2: Parse phone number - extract country code if present
    let parsedPhoneNumber = phoneNumber || "";
    let extractedCountryCode: string | null = null;
    
    if (parsedPhoneNumber) {
      // Remove any spaces
      parsedPhoneNumber = parsedPhoneNumber.trim();
      
      // If phone number starts with +, try to extract country code
      if (parsedPhoneNumber.startsWith("+")) {
        // Sort countries by country_code length (longest first) to match longer codes first
        const sortedCountries = [...countries]
          .filter((c) => c.country_code)
          .sort((a, b) => (b.country_code?.length || 0) - (a.country_code?.length || 0));

        // Try to match with known country codes (try longest first)
        for (const country of sortedCountries) {
          if (country.country_code && parsedPhoneNumber.startsWith(`+${country.country_code}`)) {
            const codeLength = `+${country.country_code}`.length;
            const numberPart = parsedPhoneNumber.substring(codeLength).trim();
            extractedCountryCode = country.country_code;
            parsedPhoneNumber = numberPart;
            console.log("✅ Extracted country code from phone:", {
              countryCode: extractedCountryCode,
              number: numberPart,
              original: phoneNumber
            });
            break;
          }
        }
      } else {
        // Phone number doesn't start with +, check if it starts with a country code
        const sortedCountries = [...countries]
          .filter((c) => c.country_code)
          .sort((a, b) => (b.country_code?.length || 0) - (a.country_code?.length || 0));

        for (const country of sortedCountries) {
          if (country.country_code && parsedPhoneNumber.startsWith(country.country_code)) {
            const codeLength = country.country_code.length;
            const numberPart = parsedPhoneNumber.substring(codeLength).trim();
            // Only extract if the remaining number looks valid (at least 7 digits)
            if (numberPart.length >= 7 && /^\d+$/.test(numberPart)) {
              extractedCountryCode = country.country_code;
              parsedPhoneNumber = numberPart;
              console.log("✅ Extracted country code from phone (no +):", {
                countryCode: extractedCountryCode,
                number: numberPart,
                original: phoneNumber
              });
              break;
            }
          }
        }
      }
    }

    // Set country code: Priority 1 = User profile, Priority 2 = Extracted from phone, Priority 3 = IP detection, Priority 4 = Default
    const finalCountryCode = detectedCountryCode || extractedCountryCode;
    
    if (finalCountryCode) {
      setSelectedCountryCode(finalCountryCode);
      setPhoneNumberOnly(parsedPhoneNumber.replace(/^\+/, "").trim());
      setIsInitialized(true);
      console.log("✅ Final country code set:", finalCountryCode, "from:", detectedCountryCode ? "user profile" : "phone number");
    } else {
      // No country code found yet - try IP detection
      const detectCountryFromIP = async () => {
        try {
          const response = await fetch("/api/geo/country");
          const data = await response.json();
          if (data.success && data.countryCode && data.countryCode !== "NA") {
            const ipCountry = countries.find(
              (c) => c.code.toLowerCase() === data.countryCode.toLowerCase()
            );
            if (ipCountry?.country_code) {
              setSelectedCountryCode(ipCountry.country_code);
              setPhoneNumberOnly(parsedPhoneNumber.replace(/^\+/, "").trim());
              setIsInitialized(true);
              console.log("✅ Detected country from IP:", ipCountry.country_code);
              return;
            }
          }
        } catch (error) {
          console.error("Error detecting country from IP:", error);
        }

        // Fallback: Use default country
        const defaultCountry = countries.find((c) => c.code === "US" && c.country_code) 
          || countries.find((c) => c.country_code);
        if (defaultCountry?.country_code) {
          setSelectedCountryCode(defaultCountry.country_code);
          setPhoneNumberOnly(parsedPhoneNumber.replace(/^\+/, "").trim());
          setIsInitialized(true);
          console.log("✅ Using default country:", defaultCountry.country_code);
        }
      };
      detectCountryFromIP();
    }
  }, [phoneNumber, userCountry, countries, isInitialized]);

  // Update phone number when country code or number changes (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    if (selectedCountryCode && phoneNumberOnly) {
      setPhoneNumber(`+${selectedCountryCode}${phoneNumberOnly}`);
    } else if (phoneNumberOnly) {
      setPhoneNumber(phoneNumberOnly);
    } else if (selectedCountryCode) {
      // Clear phone number if only country code is set
      setPhoneNumber("");
    }
  }, [selectedCountryCode, phoneNumberOnly, setPhoneNumber, isInitialized]);

  const handleNext = () => {
    if (!firstName.trim()) {
      toast.error("Please enter your first name");
      return;
    }
    if (!lastName.trim()) {
      toast.error("Please enter your last name");
      return;
    }
    if (!phoneNumberOnly.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!selectedCountryCode) {
      toast.error("Please select a country code");
      return;
    }

    toast.success("Personal information saved successfully!");
    onNext();
  };

  return (
    <div className="dark:text-[#FFFFFF] text-[#000000]">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-2xl font-semibold">Enter your Personal Information</h1>
        <span className="text-sm mt-2">
          Make sure your information matches your address proof document
        </span>
      </div>
      <Card className="border-0 p-6 bg-[#FFFFFF] dark:bg-[#01040D] dark:text-[#FFFFFF] text-[#000000] mx-auto max-w-md">
        <div className="space-y-6">
          <div className="space-y-4">
            <Input
              id="firstName"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border-[#2a3247] bg-[#FFFFFF] dark:bg-[#01040D] dark:text-[#FFFFFF] text-[#000000] focus-visible:ring-blue-500"
            />
            <Input
              id="lastName"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border-[#2a3247] bg-[#FFFFFF] dark:bg-[#01040D] dark:text-[#FFFFFF] text-[#000000] focus-visible:ring-blue-500"
            />
            <div className="flex gap-2">
              <Select
                value={selectedCountryCode}
                onValueChange={(value) => {
                  setSelectedCountryCode(value);
                  setCountrySearchQuery(""); // Clear search when selection is made
                }}
                disabled={isLoadingCountries}
              >
                <SelectTrigger className="w-[140px] border-[#2a3247] bg-[#FFFFFF] dark:bg-[#01040D] dark:text-[#FFFFFF] text-[#000000] focus-visible:ring-blue-500">
                  <SelectValue placeholder="Code">
                    {selectedCountryCode ? `+${selectedCountryCode}` : "Select"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {/* Search Input */}
                  <div className="p-2 border-b border-[#2c272c]">
                    <Input
                      placeholder="Search country..."
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="rounded-lg border-[#2a3247] bg-[#FFFFFF] dark:bg-[#01040D] dark:text-[#FFFFFF] text-[#000000] focus-visible:ring-blue-500"
                    />
                  </div>
                  {/* Filtered Countries List */}
                  {countries
                    .filter((country) => {
                      if (!countrySearchQuery.trim()) return true;
                      const query = countrySearchQuery.toLowerCase();
                      return (
                        country.country?.toLowerCase().includes(query) ||
                        country.code?.toLowerCase().includes(query) ||
                        country.country_code?.includes(query) ||
                        `+${country.country_code}`.includes(query)
                      );
                    })
                    .map((country) => (
                      <SelectItem
                        key={country.code}
                        value={country.country_code || ""}
                        disabled={!country.country_code}
                        className="focus:bg-[#9F8BCF]/30 data-[state=checked]:bg-[#9F8BCF]/70 text-black dark:text-white">
                      
                        <span className="flex items-center gap-2">
                          <span className="font-medium">+{country.country_code}</span>
                          <span className="text-xs opacity-75">{country.country}</span>
                        </span>
                      </SelectItem>
                    ))}
                  {countries.filter((country) => {
                    if (!countrySearchQuery.trim()) return false;
                    const query = countrySearchQuery.toLowerCase();
                    return (
                      country.country?.toLowerCase().includes(query) ||
                      country.code?.toLowerCase().includes(query) ||
                      country.country_code?.includes(query) ||
                      `+${country.country_code}`.includes(query)
                    );
                  }).length === 0 && countrySearchQuery.trim() && (
                    <div className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No countries found
                    </div>
                  )}
                </SelectContent>
              </Select>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Phone Number"
                value={phoneNumberOnly}
                onChange={(e) => {
                  // Only allow digits
                  const value = e.target.value.replace(/\D/g, "");
                  setPhoneNumberOnly(value);
                }}
                className="flex-1 border-[#2a3247] bg-[#FFFFFF] dark:bg-[#01040D] dark:text-[#FFFFFF] text-[#000000] focus-visible:ring-blue-500"
              />
            </div>

            <Textarea
              id="address"
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2} // makes it roughly two lines tall
              className="w-full border-[#2a3247] bg-[#FFFFFF] dark:bg-[#01040D] dark:text-[#FFFFFF] text-[#000000] focus-visible:ring-blue-500 rounded-md p-2"
            />
          </div>

          <Button
            className="w-full cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] dark:text-[#FFFFFF] text-white"
            onClick={handleNext}>
            Save & Next
          </Button>
          <Link href="/">
            <Button className="w-full bg-[#FFFFFF] dark:bg-[#01040D] dark:text-[#FFFFFF] text-[#000000] hover:bg-[#FFFFFF] dark:hover:bg-[#01040D] cursor-pointer underline">
              <MoveLeft className="h-4 w-4 mr-2" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
