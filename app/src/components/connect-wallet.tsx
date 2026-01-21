"use client";

import Image from "next/image";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function ConnectWallet() {
  const { setVisible } = useWalletModal();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative">
      {/* Animated background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute w-[400px] h-[400px] bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="text-center w-full relative z-10">
        {/* Icon */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-8 sm:mb-10 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border-2 border-indigo-500/50 animate-pulse shadow-2xl shadow-indigo-500/30">
          <svg className="w-14 h-14 sm:w-16 sm:h-16 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <div className="inline-block mb-6 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Secure Connection</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6 sm:mb-8">
          Connect
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Wallet
          </span>
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed font-light">
          Connect your Solana wallet to explore blind auctions, place encrypted bids, and participate in private auctions with complete privacy.
        </p>

        <button
          onClick={() => setVisible(true)}
          className="group relative px-10 sm:px-12 py-5 sm:py-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-black rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-500 hover:scale-105 text-lg sm:text-xl mb-12 sm:mb-16 overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connect Wallet
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
        </button>

        {/* Supported Wallets */}
        <div className="mb-16 sm:mb-20">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-6 sm:mb-8 font-bold">
            Supported Wallets
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {["Phantom", "Solflare", "Ledger", "Backpack"].map((wallet) => (
              <button
                key={wallet}
                onClick={() => setVisible(true)}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-sm sm:text-base text-white/80 hover:text-white transition-all duration-300 font-bold border border-white/10 hover:border-white/20 hover:scale-105 bg-white/5 backdrop-blur-xl backdrop-saturate-150 hover:bg-white/10"
              >
                {wallet}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/50 font-semibold">Powered by</span>
            <Image
              src="/logo.png"
              alt="Inco"
              width={64}
              height={20}
              className="opacity-80 hover:opacity-100 transition-opacity"
              unoptimized
            />
          </div>
          <p className="text-xs sm:text-sm text-white/40 max-w-md">
            Privacy-preserving blind auctions with encrypted computation
          </p>
        </div>
      </div>
    </div>
  );
}
