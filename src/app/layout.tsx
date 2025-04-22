import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeBackground from "@/components/ThemeBackground";
import { Analytics } from "@vercel/analytics/react";

const notoSans = Noto_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoTek",
  description: "Autonomous insights. Human curiosity.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={notoSans.className}>
        <ThemeProvider>
          <ThemeBackground />
          <Navbar />
          <main className="relative z-10 pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
            <Analytics />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
