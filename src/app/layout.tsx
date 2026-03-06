import "../app/globals.css";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { ReactNode } from "react";
import ReduxProvider from "@/providers/redux-provider"; // your redux wrapper
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { LoadingProvider } from "@/context/LoadingContext"; // Import the LoadingProvider here
import TawkToChat from "@/components/TawkToChat";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Think Superior, Trade Zuperior",
  description: "India's #1 Leading Forex Broker",
  icons: {
    icon: "/zuperior-new-logo.png",
    shortcut: "/zuperior-new-logo.png",
    apple: "/zuperior-new-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.className} antialiased`}>
        <ReduxProvider>
          <LoadingProvider>
            {" "}
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <TawkToChat />
              <Toaster
                position="bottom-right"
                theme="dark"
                offset={{ bottom: 20, right: 90 }}
                toastOptions={{
                  style: {
                    background: "#1E1429",
                    color: "#E4E4E7",
                    border: "1px solid #2E1B3B",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    padding: "14px 16px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                  },
                }}
              />
              {children}
            </ThemeProvider>
          </LoadingProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
