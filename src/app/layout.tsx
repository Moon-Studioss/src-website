import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Display face for public headlines and the Idea Machine
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

// viewport-fit=cover lets the bottom tab bar respect the iPhone home indicator
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export const metadata: Metadata = {
  title: "SRC e-solutions — Turn Your Project Idea Into a Working Prototype",
  description:
    "Submit your student project idea online. We review every request personally and build web, mobile, ML/AI, IoT, and software projects end-to-end.",
  keywords: [
    "student project development",
    "project prototype",
    "college project help",
    "web development",
    "ML AI project",
    "IoT project",
    "mobile app development",
  ],
  openGraph: {
    title: "SRC e-solutions — From Idea to Working Prototype",
    description:
      "Submit your project requirement once. We review and reach out if we can take it up.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen antialiased" style={{ background: "var(--paper)", color: "var(--ink)" }}>
        {children}
      </body>
    </html>
  );
}
