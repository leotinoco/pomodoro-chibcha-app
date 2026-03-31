import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pomodoro Chibcha - Focus & Productivity",
  description:
    "Boost your productivity with Pomodoro Chibcha. Features include a customizable Pomodoro timer, Google Tasks & Calendar integration, and ambient sounds for deep focus.",
  icons: {
    icon: "/favicon.avif",
  },
  openGraph: {
    title: "Pomodoro Chibcha - Focus & Productivity",
    description:
      "Boost your productivity with Pomodoro Chibcha. Features include a customizable Pomodoro timer, Google Tasks & Calendar integration, and ambient sounds for deep focus.",
    url: "https://pomodoro-chibcha-app.vercel.app",
    siteName: "Pomodoro Chibcha",
    images: [
      {
        url: "/online-pomodoro-google-integration.png",
        width: 1200,
        height: 630,
        alt: "Pomodoro Chibcha Dashboard",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pomodoro Chibcha - Focus & Productivity",
    description:
      "Boost your productivity with Pomodoro Chibcha. Features include a customizable Pomodoro timer, Google Tasks & Calendar integration, and ambient sounds for deep focus.",
    images: ["/online-pomodoro-google-integration.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Pomodoro Chibcha",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "A comprehensive productivity tool combining Pomodoro technique, task management, and calendar integration.",
  image:
    "https://pomodoro-chibcha-app.vercel.app/online-pomodoro-google-integration.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}
