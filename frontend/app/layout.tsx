import type { Metadata } from "next";
import { AIAssistant } from "@/components/AIAssistant";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASTRA Estate",
  description: "Multi-agent real estate transaction platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AIAssistant />
      </body>
    </html>
  );
}
