import type { Metadata, Viewport } from "next";
import "./globals.css";
import { IframeHeightReporter } from "@/components/IframeHeightReporter";

export const metadata: Metadata = {
  title: "Railing Visualizer | OZ Aluminium Railing",
  description:
    "Upload a photo of your deck, porch, balcony, or staircase and instantly preview OZ Aluminium Railing's glass and aluminium railing systems with AI.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* Poppins — matches the geometric sans used on ozaluminiumrailing.ca.
            Loaded at runtime via <link> so it works everywhere without a
            build-time font fetch. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)]">
        <IframeHeightReporter />
        {children}
      </body>
    </html>
  );
}
