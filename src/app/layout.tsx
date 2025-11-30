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
      <body className="min-h-screen bg-[#0f0f1e] text-zinc-100 antialiased">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-purple-950/20 to-black" />
          <div
            className="absolute inset-0 blur-[180px] opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% -10%, rgba(16, 185, 129, 0.12), transparent 60%), radial-gradient(circle at 50% 110%, rgba(6, 182, 212, 0.10), transparent 60%), radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.08), transparent 50%)",
              backgroundRepeat: "no-repeat",
            }}
          />
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
