import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Skillune - Free Open Source ATS Checker",
  description: "Transform your resume, master your interviews, get hired faster. 100% free and open source.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
