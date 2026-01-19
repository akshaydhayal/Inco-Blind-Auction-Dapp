"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuction } from "@/hooks/useAuction";
import { AuctionAccount, BidAccount } from "@/lib/program";
import { TxStatus } from "@/components/tx-link";

export default function AuctionDetailPage() {
  const { id } = useParams();
  const wallet = useWallet();
  const {
    fetchAuctionByPDA,
    fetchBid,
    placeBid,
    checkWin,
    closeAuction,
    decryptIsWinner,
    withdrawBid,
    loading,
    error,
  } = useAuction();

  const [auction, setAuction] = useState<AuctionAccount | null>(null);
  const [bid, setBid] = useState<BidAccount | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [decryptResult, setDecryptResult] = useState<{
    plaintext: string;
    ed25519Instructions: unknown[];
    isWinnerHandle: string;
  } | null>(null);

  const auctionPDA = useMemo(
    () => (id ? new PublicKey(id as string) : null),
    [id]
  );

  const clearStatus = (delay = 8000) => {
    setTimeout(() => {
      setTxStatus(null);
      setLastTxHash(null);
      setIsSuccess(false);
    }, delay);
  };

  const refreshData = useCallback(async () => {
    if (!auctionPDA) return;
    const auctionData = await fetchAuctionByPDA(auctionPDA);
    setAuction(auctionData);
    if (wallet.publicKey) {
      const bidData = await fetchBid(auctionPDA, wallet.publicKey);
      setBid(bidData);
      if (!bidData) {
        setIsWinner(null);
        setDecryptResult(null);
      }
    } else {
      setBid(null);
      setIsWinner(null);
      setDecryptResult(null);
    }
  }, [auctionPDA, fetchAuctionByPDA, fetchBid, wallet.publicKey]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!auctionPDA) return;
      setPageLoading(true);
      const auctionData = await fetchAuctionByPDA(auctionPDA);
      if (!cancelled) setAuction(auctionData);
      if (wallet.publicKey) {
        const bidData = await fetchBid(auctionPDA, wallet.publicKey);
        if (!cancelled) {
          setBid(bidData);
          setIsWinner(null);
          setDecryptResult(null);
        }
      } else {
        if (!cancelled) {
          setBid(null);
          setIsWinner(null);
          setDecryptResult(null);
        }
      }
      if (!cancelled) setPageLoading(false);
    };
    fetchData();
    return () => { cancelled = true; };
  }, [auctionPDA, fetchAuctionByPDA, fetchBid, wallet.publicKey]);

  const handlePlaceBid = async () => {
    if (!bidAmount || !auctionPDA || !auction) return;
    const amount = parseFloat(bidAmount);
    if (amount < auction.minimumBid.toNumber() / LAMPORTS_PER_SOL) {
      setTxStatus(`Bid must be at least ${auction.minimumBid.toNumber() / LAMPORTS_PER_SOL} SOL`);
      clearStatus();
      return;
    }
    setTxStatus("Encrypting bid...");
    setLastTxHash(null);
    setIsSuccess(false);
    try {
      setTxStatus("Submitting transaction...");
      const tx = await placeBid(auctionPDA, amount, amount);
      if (tx) {
        setTxStatus("Bid placed successfully! (Your bid is encrypted)");
        setLastTxHash(tx);
        setIsSuccess(true);
        setBidAmount("");
        await refreshData();
        clearStatus();
      }
    } catch (err) {
      console.error("Error placing bid:", err);
      setTxStatus(null);
    }
  };

  const handleCheckWin = async () => {
    if (!auctionPDA) return;
    setTxStatus("Checking win status...");
    setLastTxHash(null);
    setIsSuccess(false);
    const result = await checkWin(auctionPDA);
    if (result) {
      setTxStatus("Encrypted comparison complete!");
      setLastTxHash(result.tx);
      await refreshData();
      setDecrypting(true);
      setTxStatus("Decrypting result...");
      try {
        const decrypted = await decryptIsWinner(result.isWinnerHandle);
        if (decrypted) {
          setIsWinner(decrypted.isWinner);
          setDecryptResult({
            plaintext: decrypted.plaintext,
            ed25519Instructions: decrypted.ed25519Instructions,
            isWinnerHandle: result.isWinnerHandle.toString(),
          });
          if (decrypted.isWinner) {
            setTxStatus("🎉 Congratulations! You won the auction!");
            setIsSuccess(true);
          } else {
            setTxStatus("Not the winner. You can withdraw your refund.");
          }
        } else {
          setTxStatus("Could not decrypt result");
        }
      } catch (err) {
        console.error("Decrypt error:", err);
        setTxStatus("Decryption failed - check console");
      }
      setDecrypting(false);
      clearStatus(10000);
    }
  };

  const handleWithdraw = async () => {
    if (!auctionPDA || !decryptResult) return;
    setTxStatus("Withdrawing...");
    setLastTxHash(null);
    setIsSuccess(false);
    const tx = await withdrawBid(
      auctionPDA,
      decryptResult.isWinnerHandle,
      decryptResult.plaintext,
      decryptResult.ed25519Instructions
    );
    if (tx) {
      if (isWinner) {
        setTxStatus("Payment confirmed! Your bid stays in vault.");
      } else {
        setTxStatus("💰 Refund withdrawn successfully!");
      }
      setLastTxHash(tx);
      setIsSuccess(true);
      await refreshData();
      setDecryptResult(null);
      clearStatus();
    }
  };

  const handleCloseAuction = async () => {
    if (!auctionPDA) return;
    setTxStatus("Closing auction...");
    setLastTxHash(null);
    setIsSuccess(false);
    const tx = await closeAuction(auctionPDA);
    if (tx) {
      setTxStatus("Auction closed successfully!");
      setLastTxHash(tx);
      setIsSuccess(true);
      await refreshData();
      clearStatus();
    }
  };

  if (pageLoading) {
    return (
      <main className="pt-28 sm:pt-32 px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-white/10 rounded w-32 mb-8" />
            <div className="h-12 bg-white/10 rounded w-1/2 mb-4" />
            <div className="h-6 bg-white/10 rounded w-1/3" />
          </div>
        </div>
      </main>
    );
  }

  if (!auction) {
    return (
      <main className="pt-28 sm:pt-32 px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16 sm:py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Auction not found</h2>
            <p className="text-white/50 mb-6 text-sm sm:text-base">The auction you're looking for doesn't exist</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all text-sm sm:text-base"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to auctions
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isAuthority = wallet.publicKey?.toBase58() === auction.authority.toBase58();
  const minBid = auction.minimumBid.toNumber() / LAMPORTS_PER_SOL;
  const endTime = new Date(auction.endTime.toNumber() * 1000);
  const isEnded = Date.now() >= endTime.getTime();
  const hasChecked = bid?.checked ?? false;
  const hasWithdrawn = bid?.withdrawn ?? false;
  const isOpen = auction.isOpen && !auction.isClosed;

  const canPlaceBid = isOpen && !isEnded && !bid && wallet.publicKey;
  const canCheckWin = auction.isClosed && bid && !hasChecked && wallet.publicKey;
  const canWithdraw = hasChecked && !hasWithdrawn && decryptResult && wallet.publicKey;
  const canClose = isAuthority && !auction.isClosed && isEnded && auction.bidderCount > 0;

  return (
    <main className="pt-28 sm:pt-32 px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-all mb-6 sm:mb-8 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-bold">Back to auctions</span>
        </Link>

        {(error || txStatus) && (
          <div className="mb-6">
            <TxStatus
              status={error || txStatus || ""}
              txHash={lastTxHash}
              isError={!!error}
              isSuccess={isSuccess}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {/* Left Column - Auction Info */}
          <div className="space-y-6">
            <div className="rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <span
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black ${
                    isOpen
                      ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-2 border-green-500/40"
                      : "bg-white/10 text-white/60 border-2 border-white/20"
                  }`}
                >
                  {auction.isClosed ? "Closed" : isOpen ? "● Live" : "Ended"}
                </span>
                {isAuthority && (
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 text-xs font-black rounded-full border-2 border-indigo-500/40">
                    Authority
                  </span>
                )}
              </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Auction #{auction.auctionId.toString().slice(-6)}
              </h1>

              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex items-center justify-between py-3 sm:py-4 border-b-2 border-white/10">
                  <span className="text-sm sm:text-base text-white/70 font-semibold">Bidders</span>
                  <span className="text-xl sm:text-2xl font-black text-white">{auction.bidderCount}</span>
                </div>
                <div className="flex items-center justify-between py-3 sm:py-4 border-b-2 border-white/10">
                  <span className="text-sm sm:text-base text-white/70 font-semibold">Minimum Bid</span>
                  <span className="text-xl sm:text-2xl font-black text-white">{minBid.toFixed(3)} SOL</span>
                </div>
                <div className="flex items-center justify-between py-3 sm:py-4">
                  <span className="text-sm sm:text-base text-white/70 font-semibold">End Time</span>
                  <span className="text-xs sm:text-sm font-bold text-white/90">{endTime.toLocaleString()}</span>
                </div>
              </div>

              {canClose && (
                <button
                  onClick={handleCloseAuction}
                  disabled={loading}
                  className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-black rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-500 hover:scale-105 disabled:opacity-50 text-base sm:text-lg"
                >
                  {loading ? "Closing..." : "Close Auction"}
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {!wallet.publicKey ? (
            <div className="rounded-3xl p-6 sm:p-8 lg:p-10 text-center border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border-2 border-indigo-500/50 animate-pulse">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-2 sm:mb-3">Connect Wallet</h3>
                <p className="text-white/60 text-sm sm:text-base lg:text-lg">Connect your wallet to participate in this auction</p>
              </div>
            ) : canPlaceBid ? (
            <div className="rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border-2 border-indigo-500/50">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Place Your Bid</h2>
                    <p className="text-white/60 text-xs sm:text-sm lg:text-base font-semibold">Your bid will be encrypted</p>
                  </div>
                </div>
                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-black text-white/90 mb-2 sm:mb-3">
                      Bid Amount (SOL)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        min={minBid}
                        placeholder={minBid.toString()}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-4 sm:px-5 py-4 sm:py-5 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/20 transition-all text-base sm:text-lg font-bold"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                      <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-white/50 text-sm font-black">SOL</div>
                    </div>
                    <p className="mt-2 sm:mt-3 text-xs text-white/50 font-semibold">Minimum: {minBid.toFixed(3)} SOL</p>
                  </div>
                  <button
                    onClick={handlePlaceBid}
                    disabled={loading || !bidAmount}
                    className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-black rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-500 hover:scale-105 disabled:opacity-50 text-base sm:text-lg overflow-hidden relative group"
                  >
                    <span className="relative z-10">
                      {loading ? "Placing bid..." : "Place Encrypted Bid"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                  </button>
                </div>
              </div>
            ) : bid ? (
            <div className="rounded-3xl p-6 sm:p-8 lg:p-10 space-y-5 sm:space-y-6 border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center border-2 border-green-500/50">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Your Bid</h2>
                    <p className="text-white/60 text-xs sm:text-sm lg:text-base font-semibold">Deposit: {(bid.depositAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(3)} SOL</p>
                  </div>
                </div>

                {hasChecked && (
                  <div className={`p-5 sm:p-6 rounded-2xl border-2 ${isWinner ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/40" : "bg-white/10 border-white/20"}`}>
                    <div className="flex items-center gap-3">
                      {isWinner ? (
                        <>
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          <span className="text-green-400 font-black text-base sm:text-lg">Winner 🎉</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-white/60 font-black text-base sm:text-lg">Not Winner</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {canCheckWin && (
                  <button
                    onClick={handleCheckWin}
                    disabled={loading || decrypting}
                    className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-black rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-500 hover:scale-105 disabled:opacity-50 text-base sm:text-lg"
                  >
                    {decrypting ? "Decrypting..." : loading ? "Checking..." : "Check If You Won"}
                  </button>
                )}

                {canWithdraw && (
                  <button
                    onClick={handleWithdraw}
                    disabled={loading}
                    className={`w-full px-6 sm:px-8 py-4 sm:py-5 font-black rounded-2xl transition-all duration-500 hover:scale-105 shadow-2xl text-base sm:text-lg overflow-hidden relative group disabled:opacity-50 disabled:cursor-not-allowed ${
                      isWinner
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-green-500/50"
                        : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white hover:shadow-indigo-500/50"
                    }`}
                  >
                    <span className="relative z-10">
                      {loading
                        ? "Processing..."
                        : isWinner
                        ? "Confirm Payment (Bid Stays in Vault)"
                        : "Withdraw Refund"}
                    </span>
                    <div 
                      className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${
                        isWinner 
                          ? "bg-gradient-to-r from-green-400 to-emerald-400" 
                          : "bg-gradient-to-r from-indigo-400 to-purple-400"
                      }`}
                    />
                  </button>
                )}

                {hasWithdrawn && (
                  <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/40 rounded-2xl text-center">
                    <p className="text-indigo-400 text-sm font-black">Withdrawn</p>
                  </div>
                )}
              </div>
            ) : (
            <div className="rounded-3xl p-6 sm:p-8 lg:p-10 text-center border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150">
                <p className="text-white/60 text-sm sm:text-base lg:text-lg font-semibold">
                  {auction.isClosed ? "Auction is closed" : isEnded ? "Auction has ended" : "Connect wallet to place a bid"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
