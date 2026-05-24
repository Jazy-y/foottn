import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuroraBackground } from "@/components/layout/AuroraBackground";
import { Toaster } from "@/components/ui/toaster";
import { TrafficTracker } from "@/components/layout/TrafficTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FootTN — On-chain energy for your next match",
  description:
    "Book private stadiums, build teams, run events. The premium sports operating system.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#08090d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-background text-foreground selection:bg-primary/30"
        suppressHydrationWarning
      >
        <AuroraBackground />
        <AuthProvider>
          <div className="relative isolate flex min-h-screen flex-col">
            {children}
            <TrafficTracker />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
