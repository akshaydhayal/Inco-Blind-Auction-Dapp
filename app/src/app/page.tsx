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
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchAuctions();
      setAuctions(data);
      setLoading(false);
    };
    load();
  }, [fetchAuctions]);

  // Update current time every minute for time remaining display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTimeRemaining = (endTime: number, isClosed: boolean) => {
    if (isClosed) {
      return `Closed on ${formatDate(endTime)}`;
    }
    
    const remaining = endTime - currentTime;
    
    if (remaining <= 0) {
      return "Expired";
    }
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    if (parts.length === 0) {
      return "Less than 1m";
    }
    
    return `${parts.join(" ")} remaining`;
  };

  // Separate auctions into active and closed
  const { activeAuctions, closedAuctions } = useMemo(() => {
    const active: Array<{ publicKey: PublicKey; account: AuctionAccount }> = [];
    const closed: Array<{ publicKey: PublicKey; account: AuctionAccount }> = [];
    const now = Math.floor(Date.now() / 1000);

    auctions.forEach((auction) => {
      const endTime = auction.account.endTime.toNumber();
      const isOpen = auction.account.isOpen && !auction.account.isClosed;
      const isExpired = endTime <= now;
      
      if (isExpired || auction.account.isClosed || !isOpen) {
        closed.push(auction);
      } else {
        active.push(auction);
      }
    });

    return { activeAuctions: active, closedAuctions: closed };
  }, [auctions]);

  const handleRefresh = async () => {
    setLoading(true);
    const data = await fetchAuctions();
    setAuctions(data);
    setLoading(false);
  };

  const AuctionCard = ({ auction }: { auction: { publicKey: PublicKey; account: AuctionAccount } }) => {
    const minBid = auction.account.minimumBid.toNumber() / LAMPORTS_PER_SOL;
    const endTime = auction.account.endTime.toNumber();
    const endTimeDate = new Date(endTime * 1000);
    const now = Math.floor(Date.now() / 1000);
    const isExpired = endTime <= now;
    const isOpen = auction.account.isOpen && !auction.account.isClosed;
    const isActive = isOpen && !isExpired;

  return (
      <Link 
        key={auction.publicKey.toBase58()} 
        href={`/auction/${auction.publicKey.toBase58()}`}
        className="rounded-lg border-2 border-neutral-700 overflow-hidden hover:border-neutral-500 hover:shadow-lg transition-all group bg-neutral-900/50"
      >
        {auction.account.imageUrl && (
          <div className="aspect-video w-full bg-neutral-900 relative overflow-hidden">
            <img 
              src={auction.account.imageUrl} 
              alt={auction.account.title || "Auction image"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23171717" width="400" height="300"/%3E%3Ctext fill="%23525252" font-family="system-ui" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage not available%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        )}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="font-medium text-lg group-hover:text-white transition-colors">
              {auction.account.title || "Untitled Auction"}
            </div>
            <div className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
              isActive
                ? "bg-green-900/50 text-green-200"
                : "bg-neutral-800 text-neutral-400"
            }`}>
              {isActive ? "● LIVE" : "CLOSED"}
            </div>
          </div>
          {auction.account.description && (
            <p className="text-sm text-neutral-400 line-clamp-2">
              {auction.account.description}
            </p>
          )}
          {auction.account.category && (
            <div className="text-xs">
              <span className="px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-800/50">
                {auction.account.category}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <div className="text-xs text-neutral-500">
              Auction <span className="font-mono">#{auction.account.auctionId.toString().slice(-6)}</span>
            </div>
            <div className="text-sm font-medium text-neutral-300">
              {auction.account.bidderCount} {auction.account.bidderCount === 1 ? "bidder" : "bidders"}
              </div>
          </div>
          <div className="pt-2 flex items-center justify-between gap-2">
            <div className="text-xs text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
              View Auction Details →
            </div>
            <div className={`text-xs ${isActive ? 'text-orange-400' : 'text-neutral-400'}`}>
              🕒 {formatTimeRemaining(endTime, !isActive)}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const renderAuctionGrid = (auctionList: Array<{ publicKey: PublicKey; account: AuctionAccount }>) => {
    if (auctionList.length === 0) {
      return (
        <div className="text-center py-12 border border-dashed border-neutral-800 rounded-lg">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-lg font-medium text-neutral-300 mb-2">No Auctions Found</div>
          <p className="text-sm text-neutral-500">Check back later for exciting auctions!</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctionList.map(auction => <AuctionCard key={auction.publicKey.toBase58()} auction={auction} />)}
      </div>
    );
  };

  return (
    <div className="space-y-8">
          {/* Tabs */}
          <div className="border-b border-neutral-800 pb-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                    activeTab === 'active'
                      ? 'text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  ✨ Active Auctions
                  {activeTab === 'active' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                  )}
                  {activeAuctions.length > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === 'active' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {activeAuctions.length}
                  </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('closed')}
                  className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                    activeTab === 'closed'
                      ? 'text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  ⏰ Closed Auctions
                  {activeTab === 'closed' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-600" />
                  )}
                  {closedAuctions.length > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === 'closed' 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {closedAuctions.length}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-4">
                {activeTab === 'active' && !loading && (
                  <p className="text-sm text-green-300/70">
                    {activeAuctions.length} {activeAuctions.length === 1 ? 'auction' : 'auctions'} available to bid
                  </p>
                )}
                {activeTab === 'closed' && !loading && (
                  <p className="text-sm text-yellow-300/70">
                    {closedAuctions.length} {closedAuctions.length === 1 ? 'auction' : 'auctions'} that have closed
                  </p>
                )}
                <button 
                  onClick={handleRefresh} 
                  className="text-sm px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors shrink-0"
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : '🔄 Refresh'}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border-2 border-neutral-700 overflow-hidden animate-pulse bg-neutral-900/50"
                >
                  <div className="aspect-video w-full bg-neutral-900" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-neutral-800 rounded w-3/4" />
                    <div className="h-4 bg-neutral-800 rounded w-full" />
                    <div className="h-4 bg-neutral-800 rounded w-2/3" />
                    <div className="pt-2 border-t border-neutral-800">
                      <div className="h-3 bg-neutral-800 rounded w-1/2" />
                    </div>
                  </div>
                </div>
            ))}
          </div>
          ) : (
            <div className="rounded-lg border border-neutral-800 p-6 pt-2">
              {activeTab === 'active' && (
                <div>
                  {renderAuctionGrid(activeAuctions)}
                </div>
              )}
              {activeTab === 'closed' && (
                <div>
                  {renderAuctionGrid(closedAuctions)}
                </div>
              )}
            </div>
          )}
    </div>
  );
}
