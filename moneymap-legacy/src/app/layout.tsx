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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(4,6,10,0.96),rgba(3,4,7,0.98)),linear-gradient(to_bottom,rgba(3,4,7,0.94),rgba(4,5,9,0.98))]" />
          <div
            className="absolute inset-0 blur-[200px] opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(circle at 18% 18%, rgba(34, 197, 94, 0.14), transparent 40%), radial-gradient(circle at 82% 18%, rgba(109, 40, 217, 0.12), transparent 44%), radial-gradient(circle at 50% 88%, rgba(27, 94, 89, 0.12), transparent 48%)",
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
