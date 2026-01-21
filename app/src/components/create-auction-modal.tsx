"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAuction } from "@/hooks/useAuction";
import { TxStatus } from "@/components/tx-link";

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAuctionModal({ isOpen, onClose }: CreateAuctionModalProps) {
  const router = useRouter();
  const { createAuction, loading, error } = useAuction();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [minimumBid, setMinimumBid] = useState("");
  // Default to 24 hours from now
  const [endDateTime, setEndDateTime] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
  });
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title || !description || !category || !imageUrl || !minimumBid || !endDateTime) return;

    setTxStatus("Creating auction...");
    setTxHash(null);

    const auctionId = new BN(Date.now());
    const minBidLamports = new BN(parseFloat(minimumBid) * LAMPORTS_PER_SOL);
    // Convert datetime-local value to Unix timestamp
    const selectedDate = new Date(endDateTime);
    const endTime = new BN(Math.floor(selectedDate.getTime() / 1000));
    
    const tagsArray = tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);

    const tx = await createAuction(
      auctionId, 
      minBidLamports, 
      endTime,
      title,
      description,
      category,
      imageUrl,
      tagsArray
    );

    if (tx) {
      setTxHash(tx);
      setTxStatus("Auction created successfully!");
      setTimeout(() => {
        onClose();
        router.push("/");
        // Reset form
        setTitle("");
        setDescription("");
        setCategory("");
        setImageUrl("");
        setTags("");
        setMinimumBid("");
        // Reset to 24 hours from now
        const resetDate = new Date();
        resetDate.setHours(resetDate.getHours() + 24);
        setEndDateTime(resetDate.toISOString().slice(0, 16));
        setTxHash(null);
        setTxStatus(null);
      }, 2000);
    } else {
      setTxStatus(null);
    }
  };

  const handleClose = () => {
    if (!loading && !txHash) {
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setImageUrl("");
      setTags("");
      setMinimumBid("");
      // Reset to 24 hours from now
      const resetDate = new Date();
      resetDate.setHours(resetDate.getHours() + 24);
      setEndDateTime(resetDate.toISOString().slice(0, 16));
      setTxHash(null);
      setTxStatus(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-neutral-900/95 backdrop-blur-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 border-b border-white/10 bg-neutral-900/95 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Auction
            </h2>
            <button
              onClick={handleClose}
              disabled={loading || !!txHash}
              className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-white/70 font-light">
            Set up a new blind auction with private encrypted bids
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {txStatus && (
            <div className="mb-4">
              <TxStatus status={txStatus} txHash={txHash} isSuccess={!!txHash} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-white/90 mb-2">
                Auction Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Rare NFT Collection"
                maxLength={100}
                className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="mt-1 text-xs text-white/40 text-right">{title.length}/100</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-white/90 mb-2">
                Category *
              </label>
              <select
                className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm [color-scheme:dark]"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="" className="bg-neutral-900 text-white">Select category</option>
                <option value="NFTs" className="bg-neutral-900 text-white">NFTs</option>
                <option value="Physical Items" className="bg-neutral-900 text-white">Physical Items</option>
                <option value="Digital Goods" className="bg-neutral-900 text-white">Digital Goods</option>
                <option value="Services" className="bg-neutral-900 text-white">Services</option>
                <option value="Collectibles" className="bg-neutral-900 text-white">Collectibles</option>
                <option value="Art" className="bg-neutral-900 text-white">Art</option>
                <option value="Other" className="bg-neutral-900 text-white">Other</option>
              </select>
            </div>

            {/* Minimum Bid */}
            <div>
              <label className="block text-xs font-bold text-white/90 mb-2">
                Minimum Bid (SOL) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.01"
                  step="0.001"
                  min="0"
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-2 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                  value={minimumBid}
                  onChange={(e) => setMinimumBid(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-xs">SOL</div>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-white/90 mb-2">
                Description *
              </label>
              <textarea
                placeholder="Describe what you're auctioning..."
                maxLength={1000}
                rows={3}
                className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="mt-1 text-xs text-white/40 text-right">{description.length}/1000</p>
            </div>

            {/* Image URL */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-white/90 mb-2">
                Image URL *
              </label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                maxLength={200}
                className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            {/* Tags and End Date & Time in single row */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-white/90 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="rare, collectible, vintage"
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              {/* End Date & Time */}
              <div>
                <label className="block text-xs font-bold text-white/90 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm [color-scheme:dark]"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !title || !description || !category || !imageUrl || !minimumBid || !endDateTime || !!txHash}
            className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-black rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
          >
            {loading
              ? "Creating Auction..."
              : txHash
              ? "Redirecting..."
              : "Create Auction"}
          </button>

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
  );
}
