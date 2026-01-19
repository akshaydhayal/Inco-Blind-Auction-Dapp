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
    return date.toLocaleString();
  };

  return (
    <main className="pt-32 px-8 pb-20 max-w-6xl mx-auto">
      <h1 className="text-6xl md:text-8xl font-light tracking-tight leading-none mb-6">
        Private <span className="text-[#3673F5]">Blind</span>
        <br />
        Auctions
      </h1>
      <p className="text-white/40 text-lg md:text-xl max-w-xl mb-16">
        Place encrypted bids in complete privacy. Your bid amount remains hidden until the auction closes.
      </p>

      <section>
        <h2 className="text-xs uppercase tracking-[0.2em] text-white/30 mb-8">
          Active Auctions
        </h2>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 animate-pulse"
              >
                <div className="h-6 bg-white/5 rounded w-1/3 mb-4" />
                <div className="h-4 bg-white/5 rounded w-2/3 mb-6" />
                <div className="h-8 bg-white/5 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/40 mb-4">No auctions yet</p>
            <Link
              href="/create"
              className="inline-block px-6 py-3 bg-[#3673F5] text-white text-sm font-medium rounded-full hover:bg-[#3673F5]/90 transition-all"
            >
              Create the first auction
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {auctions.map((auction) => (
              <Link
                key={auction.publicKey.toBase58()}
                href={`/auction/${auction.publicKey.toBase58()}`}
                className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500"
              >
                <div className="absolute top-6 right-6">
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${
                      auction.account.isOpen && !auction.account.isClosed
                        ? "bg-[#3673F5]/10 text-[#3673F5] border-[#3673F5]/20"
                        : "bg-white/5 text-white/40 border-white/10"
                    }`}
                  >
                    {auction.account.isClosed
                      ? "Closed"
                      : auction.account.isOpen
                      ? "Open"
                      : "Ended"}
                  </span>
                </div>
                <h3 className="text-2xl font-light mb-2 group-hover:text-[#3673F5] transition-colors">
                  Auction #{auction.account.auctionId.toString().slice(-6)}
                </h3>
                <p className="text-white/40 text-sm mb-4">
                  {auction.account.bidderCount} bidder
                  {auction.account.bidderCount !== 1 ? "s" : ""}
                </p>
                <div className="space-y-2 mb-4">
                  <div>
                    <span className="text-xs text-white/30">Min. Bid: </span>
                    <span className="text-lg font-light">
                      {(auction.account.minimumBid.toNumber() / LAMPORTS_PER_SOL).toFixed(3)} SOL
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-white/30">Ends: </span>
                    <span className="text-sm text-white/60">
                      {formatDate(auction.account.endTime.toNumber())}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs text-white/30">
                    ID: {auction.account.auctionId.toString().slice(-8)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
