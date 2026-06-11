import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { AIAssistant } from "@/components/AIAssistant";
import { UserMenu } from "@/components/auth/UserMenu";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap"
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

export const metadata: Metadata = {
  title: "ASTRA Estate",
  description: "Multi-agent real estate transaction platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="fixed right-3 top-3 z-50">
          <UserMenu />
        </div>
        {children}
        <AIAssistant />
      </body>
    </html>
  );
}
