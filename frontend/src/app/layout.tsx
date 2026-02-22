import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Import global styles

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FreelanceReach - Smart AI-Powered Client Outreach for Freelancers",
  description:
    "Automate your entire client outreach process with AI. From discovering jobs to crafting personalized proposals and booking calls.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
