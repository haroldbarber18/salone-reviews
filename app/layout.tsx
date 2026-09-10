import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SaloneReviews | Business reviews, events and directory in Sierra Leone",
  description:
    "Find trusted businesses, tradesmen, restaurants and upcoming events across Sierra Leone. Read real reviews. List or claim your shop free.",
  applicationName: "SaloneReviews",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "SaloneReviews",
    statusBarStyle: "default",
  },
  verification: {
    google: "9I61ZqNiWlco0W8N8JQpJiYD5JnZ_7gvcHi5VV4rgKQ",
  },
};

export const viewport: Viewport = {
  themeColor: "#006B3F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
