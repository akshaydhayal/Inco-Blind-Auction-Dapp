"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAuction } from "@/hooks/useAuction";
import { TxStatus } from "@/components/tx-link";

export default function CreatePage() {
  const router = useRouter();
  const { createAuction, loading, error } = useAuction();
  const [minimumBid, setMinimumBid] = useState("");
  const [duration, setDuration] = useState("24"); // hours
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!minimumBid || !duration) return;

    setTxStatus("Creating auction...");
    setTxHash(null);

    // Generate a unique auction ID from timestamp
    const auctionId = new BN(Date.now());

    // Convert minimum bid to lamports
    const minBidLamports = new BN(parseFloat(minimumBid) * LAMPORTS_PER_SOL);

    // Calculate end time (current time + duration in hours)
    const durationHours = parseInt(duration);
    const endTime = new BN(Math.floor(Date.now() / 1000) + durationHours * 3600);

    console.log("Creating auction:", {
      auctionId: auctionId.toString(),
      minimumBid: minBidLamports.toString(),
      endTime: endTime.toString(),
    });

    const tx = await createAuction(auctionId, minBidLamports, endTime);

    if (tx) {
      console.log("Auction created successfully:", tx);
      setTxHash(tx);
      setTxStatus("Auction created successfully!");

      // Redirect after showing success
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } else {
      setTxStatus(null);
    }
  };

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#3673F5]/50 transition-colors";
  const labelClass =
    "text-xs uppercase tracking-wider text-white/40 mb-2 block";

  return (
    <main className="pt-32 px-8 pb-20 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-light mb-2 text-center">Create Auction</h1>
        <p className="text-white/40 mb-12 text-center">
          Set up a new blind auction with private bids
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {txStatus && (
          <TxStatus status={txStatus} txHash={txHash} isSuccess={!!txHash} />
        )}

        <div className="space-y-6">
          <div>
            <label className={labelClass}>Minimum Bid (SOL)</label>
            <input
              type="number"
              placeholder="0.01"
              step="0.001"
              min="0"
              className={inputClass}
              value={minimumBid}
              onChange={(e) => setMinimumBid(e.target.value)}
            />
            <p className="mt-2 text-xs text-white/30">
              Minimum bid amount required to participate
            </p>
          </div>

          <div>
            <label className={labelClass}>Duration (Hours)</label>
            <input
              type="number"
              placeholder="24"
              step="1"
              min="1"
              className={inputClass}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <p className="mt-2 text-xs text-white/30">
              How long the auction will be open for bidding
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !minimumBid || !duration || !!txHash}
            className={`w-full mt-8 px-6 py-3 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-all duration-300 ${
              loading || !minimumBid || !duration || !!txHash
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {loading
              ? "Creating..."
              : txHash
              ? "Redirecting..."
              : "Create Auction"}
          </button>
        </div>
      </div>
    </main>
  );
}
