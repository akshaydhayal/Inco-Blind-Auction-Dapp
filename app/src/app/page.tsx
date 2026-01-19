"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuction } from "@/hooks/useAuction";
import { AuctionAccount } from "@/lib/program";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function HomePage() {
  const { fetchAuctions } = useAuction();
  const [auctions, setAuctions] = useState<
    { publicKey: PublicKey; account: AuctionAccount }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchAuctions();
      setAuctions(data);
      setLoading(false);
    };
    load();
  }, [fetchAuctions]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) return "Ended";
    if (hours > 24) return date.toLocaleDateString();
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  return (
    <main className="pt-20 pb-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
        {/* Hero Section */}
        <div className="text-center mb-8 relative overflow-hidden">
          {/* Animated background orbs */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
          </div>
          
          <div className="relative z-10 px-4">
            <div className="inline-block mb-3 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Private & Encrypted</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 leading-tight">
              <span className="block text-white">Blind</span>
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Auctions
              </span>
            </h1>
            
            <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto mb-6 leading-relaxed font-light">
              Place encrypted bids in complete privacy. Your bid amount remains hidden until the auction closes.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/create"
                className="group relative px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105 text-sm overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Auction
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </Link>
              
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150">
                <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-white/80 font-semibold">Powered by Inco Lightning</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auctions Section */}
        <section className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
                Active Auctions
              </h2>
              <p className="text-white/50 text-xs">Discover and participate in private blind auctions</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150">
              <span className="text-xs text-white/70 font-bold">
                {auctions.length} {auctions.length === 1 ? "auction" : "auctions"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 animate-pulse min-h-[280px] flex flex-col border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150"
                >
                  <div className="h-5 bg-white/10 rounded-lg w-1/3 mb-3" />
                  <div className="h-6 bg-white/10 rounded-lg w-2/3 mb-3" />
                  <div className="h-3 bg-white/10 rounded-lg w-full mb-2" />
                  <div className="h-3 bg-white/10 rounded-lg w-full mb-2" />
                  <div className="h-3 bg-white/10 rounded-lg w-3/4 mb-3" />
                  <div className="flex-grow" />
                  <div className="h-8 bg-white/10 rounded-lg w-full mt-auto" />
                </div>
              ))}
            </div>
          ) : auctions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl px-4 border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 animate-pulse">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2">No auctions yet</h3>
              <p className="text-white/60 mb-6 text-sm">Be the first to create a blind auction</p>
              <Link
                href="/create"
                className="inline-block px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105 text-sm"
              >
                Create First Auction
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {auctions.map((auction) => {
                const isOpen = auction.account.isOpen && !auction.account.isClosed;
                const minBid = auction.account.minimumBid.toNumber() / LAMPORTS_PER_SOL;
                
                return (
                  <Link
                    key={auction.publicKey.toBase58()}
                    href={`/auction/${auction.publicKey.toBase58()}`}
                    className="group relative rounded-2xl p-4 border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150 flex flex-col min-h-[280px] transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/30"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300 rounded-2xl"></div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            isOpen
                              ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30"
                              : "bg-white/10 text-white/60 border border-white/20"
                          }`}
                        >
                          {auction.account.isClosed
                            ? "Closed"
                            : isOpen
                            ? "● Live"
                            : "Ended"}
                        </span>
                        <div className="text-xs text-white/40 font-mono font-semibold">
                          #{auction.account.auctionId.toString().slice(-6)}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-black text-white mb-3 group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                        Blind Auction
                      </h3>

                      {/* Stats */}
                      <div className="space-y-2 mb-3 flex-grow">
                        <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                          <span className="text-xs text-white/60 font-medium">Bidders</span>
                          <span className="text-base font-black text-white">
                            {auction.account.bidderCount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                          <span className="text-xs text-white/60 font-medium">Min. Bid</span>
                          <span className="text-base font-black text-white">
                            {minBid.toFixed(3)} SOL
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-xs text-white/60 font-medium">Time Left</span>
                          <span className="text-xs font-bold text-white/90">
                            {formatDate(auction.account.endTime.toNumber())}
                          </span>
                        </div>
                      </div>

                      {/* View Button */}
                      <div className="pt-3 border-t border-white/10 mt-auto">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-white/50 group-hover:text-white transition-colors">View Details</span>
                          <svg className="w-4 h-4 text-indigo-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
