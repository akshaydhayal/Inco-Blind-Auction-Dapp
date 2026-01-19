import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Wallet } from "@/components/wallet-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blind Auction",
  description: "Blind Auction - Privacy-preserving auctions powered by Inco",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-white font-sans bg-[#0a0a0b] overflow-x-hidden [background-attachment:fixed] [background-image:radial-gradient(at_0%_0%,rgba(99,102,241,0.15)_0px,transparent_50%),radial-gradient(at_100%_0%,rgba(139,92,246,0.15)_0px,transparent_50%),radial-gradient(at_100%_100%,rgba(236,72,153,0.1)_0px,transparent_50%),radial-gradient(at_0%_100%,rgba(59,130,246,0.1)_0px,transparent_50%)]`}
        suppressHydrationWarning
      >
        <Wallet>{children}</Wallet>
      </body>
    </html>
  );
}
