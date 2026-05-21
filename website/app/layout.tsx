import type { Metadata } from "next";
import "./globals.css";
import { TickerChartProvider } from "@/components/TickerChartProvider";

export const metadata: Metadata = {
  title: "GreenGeniusAI — The World's Smartest AI Investor",
  description:
    "GreenGeniusAI automatically invests your money into the hottest trending assets, exits before declines, and explains every decision. Founding member rate $14.99/month. Powered by real-time market intelligence.",
  keywords: "AI investing, automated trading, stock market AI, smart investor, GreenGeniusAI",
  openGraph: {
    title: "GreenGeniusAI — The World's Smartest AI Investor",
    description: "AI that invests smarter than Wall Street. Founding member rate — $14.99/month.",
    type: "website",
    siteName: "GreenGeniusAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "GreenGeniusAI",
    description: "AI that invests smarter than Wall Street. Founding member rate — $14.99/month.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-genius-black text-genius-text antialiased">
        <TickerChartProvider>
          {children}
        </TickerChartProvider>
      </body>
    </html>
  );
}
