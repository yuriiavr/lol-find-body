import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ToastProvider } from "@/src/components/ToastProvider";
import { GlobalChatIndicator } from "@/src/components/GlobalChatIndicator";
import { Navbar } from "@/src/components/Navbar";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { GameThemeProvider } from "@/src/context/GameThemeContext";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

// Виставляє data-game-theme ще ДО першого малювання, щоб не було спалаху теми.
// GameThemeProvider далі тримає атрибут синхронним зі станом.
const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('site-game-theme')||'lol';if(t&&t!=='none'){document.documentElement.setAttribute('data-game-theme',t);}}catch(e){}`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = {
    en: {
      title: "ReMatch — Find your Duo",
      description:
        "Find teammates for League of Legends, TFT, Valorant and CS2 — match by rank, role and region.",
    },
    uk: {
      title: "ReMatch — Знайди свою команду",
      description:
        "Знаходь напарників у League of Legends, TFT, Valorant та CS2 — за рангом, роллю й регіоном.",
    },
  };
  const m = meta[locale === "uk" ? "uk" : "en"];
  return { title: m.title, description: m.description };
}

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ToastProvider>
            <GameThemeProvider>
              <Navbar />
              {children}
              <GlobalChatIndicator />
            </GameThemeProvider>
          </ToastProvider>
        </NextIntlClientProvider>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
