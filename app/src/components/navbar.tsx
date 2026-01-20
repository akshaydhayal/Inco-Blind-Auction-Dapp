"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const WalletButton = dynamic(() => import("./wallet-button"), {
  ssr: false,
  loading: () => (
    <div className="w-32 h-10 bg-white/5 rounded-2xl animate-pulse" />
  ),
});

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-xl backdrop-saturate-150 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-black tracking-tight transition-transform hover:scale-105"
            >
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                BlindBids
              </span>
              <span className="text-indigo-400">.</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Private & Encrypted</span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150">
                <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold">
                  Powered by
                </span>
                <Link 
                  href="https://inco.org" 
                  target="_blank" 
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity group"
                >
                  <Image
                    src="/logo.png"
                    alt="Inco"
                    width={20}
                    height={20}
                    className="opacity-90 group-hover:opacity-100 transition-opacity"
                    unoptimized
                  />
                  <p className="text-xs text-white/60 font-semibold group-hover:text-white transition-colors">Inco</p>
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex gap-4 text-sm font-semibold">
              <Link 
                href="/" 
                className="text-white/70 hover:text-white transition-all relative group py-2"
              >
                Auctions
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                href="/create" 
                className="text-white/70 hover:text-white transition-all relative group py-2"
              >
                Create
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
