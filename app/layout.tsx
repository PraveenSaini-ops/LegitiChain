import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "LegitiChain - Digital Evidence Integrity Registry",
  description: "Cryptographic anchor & chain of custody verification platform on Polygon Amoy Testnet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-[#fff8f2] text-[#1e1b16] antialiased">
        <AuthProvider>
          <Sidebar />
          <div className="pl-[280px] flex flex-col min-h-screen">
            <Header />
            <main className="relative pt-20 flex-1 w-full max-w-[1280px] mx-auto px-8 py-10">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

