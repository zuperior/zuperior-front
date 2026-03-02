import React from "react";
import Image from "next/image";
import googlePlayBadge from "../../../assets/emails/Google Play.jpg";
import appleStoreBadge from "../../../assets/emails/Apple Store Image .jpg";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FooterProps {
  title?: string;
  buttonText?: string;
}

const EmailFooter: React.FC<FooterProps> = ({
  title = "DOWNLOAD OUR MOBILE APP AND EXPLORE MORE",
  buttonText = "Password Link",
}) => {
  return (
    <footer>
      <div className="container mx-auto px-5 text-center">
        {/* Title with gradient */}
        <p className="text-sm font-semibold bg-gradient-to-r from-[#C6ABEE] to-[#FFFFFF] bg-clip-text text-transparent py-5">
          {title}
        </p>

        {/* Optional Button */}
        {buttonText && (
          <div className="relative inline-block py-8">
            <Button
              className="px-8 py-3 rounded-full font-semibold text-white relative overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #9F4AFF 0%, #7A4AFF 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: `
          /* Inner shadows */
          inset 0px 0.5px 1px rgba(255, 255, 255, 0.6),
          inset 0px -0.5px 1px rgba(0, 0, 0, 0.1),
          /* Drop shadow */
          0px 4px 20px rgba(159, 74, 255, 0.5)
        `,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span className="relative z-10">{buttonText}</span>
              {/* Top highlight */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "30%",
                  background:
                    "linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%)",
                  borderRadius: "9999px 9999px 0 0",
                }}
              ></div>
            </Button>
          </div>
        )}

        <p className="text-sm font-normal pt-2 bg-gradient-to-r from-[#C6ABEE] to-[#FFFFFF] bg-clip-text text-transparent">
          DOWNLOAD OUR MOBILE APP AND EXPLORE MORE
        </p>

        {/* App Store Badges - Conditionally rendered */}
        <div className="flex flex-row justify-center gap-6 py-10">
          <Link
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Image
              src={googlePlayBadge}
              alt="Get it on Google Play"
              width={150}
              height={45}
              className="h-12 w-auto object-contain"
            />
          </Link>
          <Link
            href="https://www.apple.com/app-store/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Image
              src={appleStoreBadge}
              alt="Download on App Store"
              width={150}
              height={45}
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default EmailFooter;
