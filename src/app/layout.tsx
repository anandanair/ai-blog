import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeBackground from "@/components/ThemeBackground";
import { Analytics } from "@vercel/analytics/react";
import { GoogleTagManager } from "@next/third-parties/google";

const notoSans = Noto_Sans({ subsets: ["latin"] });

const siteName = "AutoTek";
const siteDescription =
  "Autonomous insights. Human curiosity. Your leading source for news, analysis, and trends in technology.";
const siteUrl = "https://blog.itsmeanand.com/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - Autonomous Tech News & Insights`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  // Open Graph (for Facebook, LinkedIn, etc.)
  openGraph: {
    title: {
      default: `${siteName} - Autonomous Tech News & Insights`,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    url: siteUrl, // Base URL of your site
    siteName: siteName,
    // Add a default image for sharing (e.g., your logo)
    // Create an image (e.g., 1200x630px) and place it in your /public folder
    images: [
      {
        url: "/og-default.png", // Path relative to your /public folder
        width: 1472,
        height: 832,
        alt: `${siteName} Logo`,
      },
    ],
    locale: "en_US", // Specify language/region
    type: "website", // Type of content
  },

  // Twitter Card (for Twitter sharing)
  twitter: {
    card: "summary_large_image", // Use 'summary_large_image' for more visual impact
    title: {
      default: `${siteName} - Autonomous Tech News & Insights`,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    // site: '@yourTwitterHandle', // Optional: Your Twitter handle
    // creator: '@creatorTwitterHandle', // Optional: Content creator handle
    images: ["/og-default.png"], // Must be an absolute URL or path relative to /public
  },

  // Optional: Other useful metadata
  applicationName: siteName,
  referrer: "origin-when-cross-origin",
  keywords: [
    "technology",
    "AI",
    "data science",
    "machine learning",
    "computer science",
    "cyber security",
    "blockchain",
    "internet of things",
    "artificial intelligence",
    "deep learning",
    "neural networks",
    "robotics",
    "tech news",
    "autotek",
    "tech blog",
  ], // Add relevant keywords
  authors: [{ name: "Anand", url: siteUrl }], // Your author info
  creator: "Anand",
  publisher: "Anand",

  // Add link to your robots.txt and sitemap (assuming they are in /public or generated)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // If you generate a sitemap (recommended!), uncomment the line below
  // sitemap: `${siteUrl}/sitemap.xml`,

  // Favicon links (place these in your /public folder)
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  // If you have a manifest file for PWA capabilities
  // manifest: '/site.webmanifest',
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
      {GA_MEASUREMENT_ID && (
        <GoogleTagManager gtmId={GA_MEASUREMENT_ID} /> 
      )}
    </html>
  );
}
