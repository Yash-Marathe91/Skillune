import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Skillune - Master Your Interviews",
  description: "Transform Your Resume. Master Your Interviews. Get Hired Faster.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col md:flex-row bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <TopNav />
          <main className="flex-1 p-6 md:p-8 bg-secondary/10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
