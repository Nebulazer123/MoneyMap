"use client";

import { useState } from "react";
import { Upload, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UploadModal } from "@/components/onboarding/UploadModal";
import { useDataStore } from "@/lib/store/useDataStore";
import { useRouter } from "next/navigation";


export default function Home() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { loadDemoData } = useDataStore();
  const router = useRouter();

  const handleDemo = () => {
    loadDemoData();
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-white selection:bg-purple-500/30">
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <div className="relative z-0 flex flex-col items-center gap-6 p-10 text-center animate-fade-in">

        {/* Background Glow */}
        <div className="absolute -top-20 -z-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -z-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        {/* Enhanced MoneyMap Logo */}
        <div className="relative flex h-20 w-20 items-center justify-center group">
          {/* Animated outer glow rings */}
          <div className="absolute inset-[-8px] rounded-3xl bg-gradient-to-br from-purple-500/60 via-blue-500/50 to-cyan-500/60 blur-2xl opacity-70 animate-pulse" />
          <div className="absolute inset-[-4px] rounded-2xl bg-gradient-to-tr from-purple-400/40 to-blue-400/40 blur-lg" />
          
          {/* Logo container */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/80 via-blue-900/70 to-indigo-900/80 backdrop-blur-xl border border-purple-400/30 shadow-[0_0_50px_rgba(139,92,246,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden">
            {/* Glass shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10" />
            
            {/* Custom MM Logo Mark */}
            <svg viewBox="0 0 32 32" className="h-12 w-12 relative z-10" fill="none">
              {/* Stylized M with map pin integration */}
              <defs>
                <linearGradient id="homeLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="50%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              {/* M shape forming abstract map/path */}
              <path d="M6 24V10l5 8 5-8 5 8 5-8v14" 
                    stroke="url(#homeLogoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              {/* Pin dot at peak */}
              <circle cx="16" cy="7" r="2.5" fill="url(#homeLogoGrad)" />
              {/* Dollar accent */}
              <path d="M16 5v4M14.5 6h3M14.5 8h3" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
            </svg>
          </div>
        </div>

        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(139,92,246,0.4)]">
          MoneyMap
        </h1>
        
        <p className="text-sm text-purple-300/60 -mt-4 tracking-widest uppercase">Navigate Your Finances</p>

        <p className="max-w-md text-lg text-zinc-400">
          Your private, local-first financial dashboard.
          Experience clarity with our new glassmorphism design.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            className="gap-2 pl-6 pr-5 bg-white text-black hover:bg-zinc-200"
            onClick={handleDemo}
          >
            <PlayCircle className="h-4 w-4" />
            Try Demo
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="gap-2 pl-6 pr-5 border-white/20 hover:bg-white/10"
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload Statement
          </Button>
        </div>
      </div>
    </div>
  );
}
