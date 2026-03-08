"use client";

import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import countries from "@/lib/countries.json";
import Image from "next/image";

const excludedKycCountries = new Set<string>([
  // AFRICA
  "Central African Republic",
  "Comoros",
  "Libya",
  "Mali",
  "Mauritius",
  "Rwanda",
  "Seychelles",
  "Somalia",
  "South Sudan",
  "Sudan",
  "Western Sahara",
  "Mayotte",
  "Réunion",

  // ASIA & MIDDLE EAST
  "Afghanistan",
  "Iraq",
  "Israel",
  "Japan",
  "Malaysia",
  "Myanmar",
  "Palestine, State of",
  "Singapore",
  "Korea (Republic of)",
  "Syrian Arab Republic",
  "Yemen",

  // EUROPE & RUSSIA
  "Albania",
  "Andorra",
  "Austria",
  "Belarus",
  "Belgium",
  "Bosnia and Herzegovina",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Ireland",
  "Italy",
  "Kosovo",
  "Latvia",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "North Macedonia",
  "Monaco",
  "Netherlands",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "Russian Federation",
  "San Marino",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Svalbard and Jan Mayen",
  "Sweden",
  "Switzerland",
  "Åland Islands",
  "Faroe Islands",
  "Greenland",

  // CARIBBEAN & AMERICAS
  "Anguilla",
  "Bermuda",
  "British Indian Ocean Territory",
  "Cayman Islands",
  "Cuba",
  "Curaçao",
  "Falkland Islands (Malvinas)",
  "French Guiana",
  "Guadeloupe",
  "Haiti",
  "Nicaragua",
  "Saint Barthélemy",
  "Saint Martin (French part)",
  "Saint Pierre and Miquelon",
  "Saint Vincent and the Grenadines",
  "Sint Maarten (Dutch part)",
  "South Georgia and the South Sandwich Islands",
  "Bahamas",
  "Turks and Caicos Islands",
  "Uruguay",

  // OCEANIA & PACIFIC
  "Australia",
  "Bouvet Island",
  "Christmas Island",
  "Cocos (Keeling) Islands",
  "Fiji",
  "French Polynesia",
  "Heard Island and McDonald Islands",
  "Kiribati",
  "Micronesia",
  "New Zealand",
  "Niue",
  "Norfolk Island",
  "Palau",
  "Pitcairn",
  "Samoa",
  "Tokelau",
  "Tuvalu",
  "Vanuatu",
  "Wallis and Futuna",
]);

const kycAllowedCountries = countries.filter(
  ({ name }) => !excludedKycCountries.has(name)
);

interface PersonalInfoStepProps {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  country: string | undefined;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  setCountry: (value: string) => void;
  onNext: () => void;
}

export default function PersonalInfoStep({
  firstName,
  lastName,
  phoneNumber,
  country,
  setFirstName,
  setLastName,
  setPhoneNumber,
  setCountry,
  onNext,
}: PersonalInfoStepProps) {
  const handleNext = () => {
    if (!firstName.trim() || !lastName.trim() || !country) {
      toast.error("Please fill in all required fields.");
      return;
    }

    toast.success("Personal information confirmed!");
    onNext();
  };

  return (
    <div className="dark:text-white text-black">
      <div className="flex flex-col items-center mb-4">
        <h1 className="text-2xl font-semibold">Verify Your Information</h1>
        <span className="text-sm mt-2 text-center">
          Please confirm that your details match your National Identity Card.
          <br />
          If any information is incorrect, contact support.
        </span>
      </div>
      <Card className="border-0 p-4 bg-white dark:bg-[#01040D] dark:text-white text-black mx-auto max-w-sm">
        <div className="space-y-6">
          <div className="space-y-3">
            <>
              <label htmlFor="country" className="text-xs font-medium mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <Select
                value={country || ""}
                onValueChange={setCountry}
              >
                <SelectTrigger className="w-full border-[#2a3247] bg-white dark:bg-[#01040D] dark:text-white text-black">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {kycAllowedCountries.map(({ name, code }) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center">
                        <Image
                          src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
                          alt={code}
                          className="inline-block mr-2"
                          width={24}
                          height={18}
                          style={{ objectFit: "cover", verticalAlign: "middle" }}
                        />
                        {name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
            <>
              <label htmlFor="firstName" className="text-xs font-medium mb-1">
                First Name
              </label>
              <Input
                id="firstName"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border-[#2a3247] bg-white dark:bg-[#01040D] dark:text-white text-black"
              />
            </>
            <>
              <label htmlFor="lastName" className="text-xs font-medium mb-1">
                Last Name
              </label>
              <Input
                id="lastName"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border-[#2a3247] bg-white dark:bg-[#01040D] dark:text-white text-black"
              />
            </>
          </div>

          <Button
            className="w-full cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] dark:text-white text-black"
            onClick={handleNext}>
            Confirm & Next
          </Button>
          <Link href="/">
            <Button className="w-full bg-white dark:bg-[#01040D] dark:text-white text-black hover:bg-white dark:hover:bg-[#01040D] cursor-pointer underline">
              <MoveLeft className="h-4 w-4 mr-2" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
