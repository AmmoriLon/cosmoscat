import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Unbounded } from "next/font/google";
import "./globals.css";

const heading = Unbounded({
  variable: "--font-heading",
  subsets: ["cyrillic", "latin"],
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["cyrillic", "latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["cyrillic", "latin"],
});

export const metadata: Metadata = {
  title: "КБ «Мята» — Генконструктор",
  description:
    "Мобильный кликер: котята строят ракеты, кубсаты и продают снимки с орбиты.",
  appleWebApp: {
    capable: true,
    title: "КБ Мята",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#070b12",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`dark ${heading.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#070b12] font-sans text-zinc-100">{children}</body>
    </html>
  );
}
