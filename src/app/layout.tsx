import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Noto_Serif } from "next/font/google";
import "@/styles/index.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Baazar Retail",
    template: "%s | Baazar Retail",
  },
  description:
    "Baazar Retail Private Limited — Vendor Registration & Admin Portal",
  applicationName: "Baazar Retail",
  authors: [{ name: "Baazar Retail Private Limited" }],
  robots: { index: false, follow: false },
  icons: {
    icon: [
      {
        url: "/baazar-logo.ico",
        type: "image/ico",
        sizes: "any",
      },
    ],
    apple: "/baazar-logo.ico",
  },
  openGraph: {
    title: "Baazar Retail",
    description:
      "Baazar Retail Private Limited — Vendor Registration & Admin Portal",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Baazar Retail",
    description:
      "Baazar Retail Private Limited — Vendor Registration & Admin Portal",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A2540",
};

/** FOUC prevention for next-themes (light forced by default in ThemeProvider). */
const themeInitScript = `
try {
  var theme = localStorage.getItem("theme");
  if (theme === "system" || !theme) {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.classList.add(theme);
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
