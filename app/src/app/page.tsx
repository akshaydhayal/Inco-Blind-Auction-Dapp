"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useAuction } from "@/hooks/useAuction";
import { AuctionAccount } from "@/lib/program";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function HomePage() {
  const { fetchAuctions } = useAuction();
  const [auctions, setAuctions] = useState<
    { publicKey: PublicKey; account: AuctionAccount }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");

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
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  // Filter auctions based on active tab
  const filteredAuctions = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    if (activeTab === "active") {
      return auctions.filter(
        (auction) =>
          auction.account.isOpen &&
          !auction.account.isClosed &&
          auction.account.endTime.toNumber() > now
      );
    } else {
      return auctions.filter(
        (auction) =>
          auction.account.isClosed ||
          (!auction.account.isOpen) ||
          auction.account.endTime.toNumber() <= now
      );
    }
  }, [auctions, activeTab]);

  const handleRefresh = async () => {
    setLoading(true);
    const data = await fetchAuctions();
    setAuctions(data);
    setLoading(false);
  };

  return (
    <main className="pt-20 pb-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
        {/* Hero Section - Background only */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Auctions Section */}
        <section className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                {activeTab === "active" ? "Active Auctions" : "Closed Auctions"}
              </h2>
              <p className="text-sm text-white/60 max-w-2xl leading-relaxed font-light">
                Place encrypted bids in complete privacy. Your bid amount remains hidden until the auction closes.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 hover:bg-white/10 transition-all text-white/70 hover:text-white"
                title="Refresh auctions"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <div className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150">
                <span className="text-xs text-white/70 font-bold">
                  {filteredAuctions.length} {filteredAuctions.length === 1 ? "auction" : "auctions"}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "active"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
            >
              Active Auctions
              {auctions.filter(
                (a) =>
                  a.account.isOpen &&
                  !a.account.isClosed &&
                  a.account.endTime.toNumber() > Math.floor(Date.now() / 1000)
              ).length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                  {auctions.filter(
                    (a) =>
                      a.account.isOpen &&
                      !a.account.isClosed &&
                      a.account.endTime.toNumber() > Math.floor(Date.now() / 1000)
                  ).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("closed")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "closed"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
            >
              Closed Auctions
              {auctions.filter(
                (a) =>
                  a.account.isClosed ||
                  (!a.account.isOpen) ||
                  a.account.endTime.toNumber() <= Math.floor(Date.now() / 1000)
              ).length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                  {auctions.filter(
                    (a) =>
                      a.account.isClosed ||
                      (!a.account.isOpen) ||
                      a.account.endTime.toNumber() <= Math.floor(Date.now() / 1000)
                  ).length}
                </span>
              )}
            </button>
          </div>

          {filteredAuctions.length > 0 && (
            <p className="text-sm text-white/50 mb-4">
              {filteredAuctions.length} {filteredAuctions.length === 1 ? "auction" : "auctions"} available
            </p>
          )}

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
          ) : filteredAuctions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl px-4 border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 animate-pulse">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2">No auctions yet</h3>
              <p className="text-white/60 text-sm">Be the first to create a blind auction</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {filteredAuctions.map((auction) => {
                const isOpen = auction.account.isOpen && !auction.account.isClosed;
                const minBid = auction.account.minimumBid.toNumber() / LAMPORTS_PER_SOL;
                const now = Math.floor(Date.now() / 1000);
                const isActive = isOpen && auction.account.endTime.toNumber() > now;
                
                return (
                  <div
                    key={auction.publicKey.toBase58()}
                    className="group relative rounded-2xl overflow-hidden border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150 flex flex-col transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/30"
                  >
                    {/* Image */}
                    {auction.account.imageUrl ? (
                      <div className="relative w-full h-48 overflow-hidden bg-white/5">
                        <img
                          src={auction.account.imageUrl}
                          alt={auction.account.title || "Auction image"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {/* Status Badge on Image */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                              isActive
                                ? "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white"
                                : "bg-white/90 text-gray-800"
                            }`}
                          >
                            {isActive ? "● LIVE" : "CLOSED"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                        <div className="absolute top-3 right-3">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                              isActive
                                ? "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white"
                                : "bg-white/90 text-gray-800"
                            }`}
                          >
                            {isActive ? "● LIVE" : "CLOSED"}
                          </span>
                        </div>
                        <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-5 flex flex-col flex-grow">
                      {/* Title */}
                      <h3 className="text-lg font-black text-white mb-2 line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                        {auction.account.title || "Untitled Auction"}
                      </h3>

                      {/* Description */}
                      {auction.account.description && (
                        <p className="text-sm text-white/70 mb-4 line-clamp-2 leading-relaxed">
                          {auction.account.description}
                        </p>
                      )}

                      {/* Auction ID */}
                      <div className="mb-4">
                        <span className="text-xs text-white/50 font-semibold">
                          Auction #{auction.account.auctionId.toString().slice(-6)}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2 mb-4 flex-grow">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/60 font-medium">Bidders</span>
                          <span className="text-sm font-bold text-white">
                            {auction.account.bidderCount} {auction.account.bidderCount === 1 ? "bidder" : "bidders"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/60 font-medium">Min. Bid</span>
                          <span className="text-sm font-bold text-white">
                            {minBid.toFixed(3)} SOL
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/60 font-medium">Expires</span>
                          <span className="text-xs font-bold text-white/90">
                            {formatDate(auction.account.endTime.toNumber())}
                          </span>
                        </div>
                      </div>

                      {/* View Details Link */}
                      <Link
                        href={`/auction/${auction.publicKey.toBase58()}`}
                        className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-sm font-bold text-indigo-400 group-hover:text-purple-400 transition-colors"
                      >
                        <span>View Auction Details</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
