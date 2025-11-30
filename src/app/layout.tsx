import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoneyMap",
  description: "MoneyMap demo. Stress test your spending using sample data only.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#020617] text-zinc-100 antialiased">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950" />
          <div className="absolute left-1/5 top-[-10%] h-96 w-96 rounded-full bg-emerald-500/16 blur-[140px]" />
          <div className="absolute bottom-[-15%] right-0 h-[28rem] w-[28rem] rounded-full bg-cyan-500/14 blur-[170px]" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col">
          <NavBar />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10 sm:pb-16 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
