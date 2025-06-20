import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  EB_Garamond,
  Geist,
  Geist_Mono,
  Inter,
} from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
// const displayFont = Cormorant_Garamond({
//   variable: "--font-display",
//   subsets: ["latin"],
//   weight: "500",
// });

const Paragon = localFont({
  src: [
    {
      path: "../../public/fonts/Paragon-Regular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "ATLAS",
  description: "See What's Happening in London",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}  ${Paragon.variable} antialiased`}
        // ${displayFont.variable}
      >
        {children}
      </body>
    </html>
  );
}
