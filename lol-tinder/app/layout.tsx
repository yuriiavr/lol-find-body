import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/src/components/ToastProvider";
import { GlobalChatIndicator } from "@/src/components/GlobalChatIndicator";
import { Navbar } from "@/src/components/Navbar";
import { ThemeInitializer } from "@/src/components/ThemeInitializer";
import DiscoveryLayout from "./(discovery)/layout"; // Import the new layout

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoLMatch - Find your Duo",
  description: "Professional platform to find League of Legends teammates worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <ThemeInitializer /> {/* Initialize theme at the root */}
          <Navbar />
          {/* Conditionally render DiscoveryLayout */}
          {/* This logic needs to be handled by Next.js routing, not directly here */}
          {/* The (discovery) group will automatically apply the layout */}
          {/* So, we just render children here, and Next.js handles the rest */}
          {children} 
          <GlobalChatIndicator />
        </ToastProvider>
      </body>
    </html>
  );
}
