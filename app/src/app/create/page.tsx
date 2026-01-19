"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAuction } from "@/hooks/useAuction";
import { TxStatus } from "@/components/tx-link";

export default function CreatePage() {
  const router = useRouter();
  const { createAuction, loading, error } = useAuction();
  const [minimumBid, setMinimumBid] = useState("");
  const [duration, setDuration] = useState("24");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!minimumBid || !duration) return;

    setTxStatus("Creating auction...");
    setTxHash(null);

    const auctionId = new BN(Date.now());
    const minBidLamports = new BN(parseFloat(minimumBid) * LAMPORTS_PER_SOL);
    const durationHours = parseInt(duration);
    const endTime = new BN(Math.floor(Date.now() / 1000) + durationHours * 3600);

    const tx = await createAuction(auctionId, minBidLamports, endTime);

    if (tx) {
      setTxHash(tx);
      setTxStatus("Auction created successfully!");
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } else {
      setTxStatus(null);
    }
  };

  return (
    <main className="pt-20 pb-12 min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-all mb-4 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-bold text-sm">Back</span>
          </Link>

          <div className="max-w-2xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 mb-3 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border-2 border-indigo-500/50 animate-pulse shadow-lg shadow-indigo-500/30">
                <svg className="w-7 h-7 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="inline-block mb-3 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">New Auction</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Create Auction
              </h1>
              <p className="text-sm text-white/70 font-light">
                Set up a new blind auction with private encrypted bids
              </p>
            </div>

          {/* Form Card */}
          <div className="rounded-2xl p-5 sm:p-6 border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            {txStatus && (
              <div className="mb-4">
                <TxStatus status={txStatus} txHash={txHash} isSuccess={!!txHash} />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/90 mb-2">
                  Minimum Bid Amount (SOL)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.01"
                    step="0.001"
                    min="0"
                    className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-semibold"
                    value={minimumBid}
                    onChange={(e) => setMinimumBid(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-xs font-bold">SOL</div>
                </div>
                <p className="mt-2 text-xs text-white/50 flex items-center gap-1.5">
                  <svg className="w-3 h-3 flex-shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Minimum bid amount required to participate</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/90 mb-2">
                  Duration (Hours)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="24"
                    step="1"
                    min="1"
                    className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-semibold"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-xs font-bold">hours</div>
                </div>
                <p className="mt-2 text-xs text-white/50 flex items-center gap-1.5">
                  <svg className="w-3 h-3 flex-shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>How long the auction will remain open</span>
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !minimumBid || !duration || !!txHash}
                className={`w-full px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-black rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm overflow-hidden relative group`}
              >
                <span className="relative z-10">
                  {loading
                    ? "Creating Auction..."
                    : txHash
                    ? "Redirecting..."
                    : "Create Auction"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-4 p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-white/80">
                  <p className="font-black text-white mb-1">Privacy First</p>
                  <p className="font-light leading-relaxed">All bids are encrypted using Inco Lightning. Bid amounts remain completely private until the auction closes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
