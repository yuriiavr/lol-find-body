import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ToastProvider } from "@/src/components/ToastProvider";
import { GlobalChatIndicator } from "@/src/components/GlobalChatIndicator";
import { Navbar } from "@/src/components/Navbar";
import { ThemeInitializer } from "@/src/components/ThemeInitializer";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReMatch - Find your Duo",
  description:
    "Professional platform to find League of Legends teammates worldwide.",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!["en", "uk"].includes(locale)) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ToastProvider>
            {/* Якщо ти додаси або маєш бібліотеку для прогрес-бару, 
                використовуй значення з CSS змінної */}
            <ThemeInitializer />
            <Navbar />
            {children}
            <GlobalChatIndicator />
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
