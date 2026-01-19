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

  // Store decrypt result for withdraw
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

    return () => {
      cancelled = true;
    };
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
      // Use bid amount as deposit amount (they should match)
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

      // Now decrypt the result
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
      <main className="pt-32 px-8 pb-20 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-white/5 rounded w-24 mb-8" />
          <div className="h-12 bg-white/5 rounded w-1/2 mb-4" />
          <div className="h-6 bg-white/5 rounded w-1/3" />
        </div>
      </main>
    );
  }

  if (!auction) {
    return (
      <main className="pt-32 px-8 pb-20 max-w-6xl mx-auto">
        <p className="text-white/40">Auction not found</p>
        <Link
          href="/"
          className="text-[#3673F5] hover:underline mt-4 inline-block"
        >
          ← Back to auctions
        </Link>
      </main>
    );
  }

  const isAuthority =
    wallet.publicKey?.toBase58() === auction.authority.toBase58();
  const minBid = auction.minimumBid.toNumber() / LAMPORTS_PER_SOL;
  const endTime = new Date(auction.endTime.toNumber() * 1000);
  const isEnded = Date.now() >= endTime.getTime();
  const hasChecked = bid?.checked ?? false;
  const hasWithdrawn = bid?.withdrawn ?? false;

  const canPlaceBid =
    auction.isOpen &&
    !auction.isClosed &&
    !isEnded &&
    !bid &&
    wallet.publicKey;

  const canCheckWin =
    auction.isClosed &&
    bid &&
    !hasChecked &&
    wallet.publicKey;

  const canWithdraw =
    hasChecked &&
    !hasWithdrawn &&
    decryptResult &&
    wallet.publicKey;

  const canClose =
    isAuthority &&
    !auction.isClosed &&
    isEnded &&
    auction.bidderCount > 0;

  return (
    <main className="pt-32 px-8 pb-20 max-w-6xl mx-auto">
      <Link
        href="/"
        className="text-white/40 text-sm mb-8 hover:text-white transition-colors flex items-center gap-2"
      >
        ← Back to auctions
      </Link>

      {(error || txStatus) && (
        <TxStatus
          status={error || txStatus || ""}
          txHash={lastTxHash}
          isError={!!error}
          isSuccess={isSuccess}
        />
      )}

      <div className="grid lg:grid-cols-2 gap-16">
        <div>
          <span
            className={`text-xs px-3 py-1 rounded-full border mb-6 inline-block ${
              auction.isOpen && !auction.isClosed
                ? "bg-[#3673F5]/10 text-[#3673F5] border-[#3673F5]/20"
                : "bg-white/5 text-white/40 border-white/10"
            }`}
          >
            {auction.isClosed
              ? "Closed"
              : auction.isOpen
              ? "Open for bidding"
              : "Ended"}
          </span>

          <h1 className="text-5xl md:text-6xl font-light mb-4">
            Auction #{auction.auctionId.toString().slice(-6)}
          </h1>

          <p className="text-white/40 text-lg mb-8">
            {auction.bidderCount} bidder{auction.bidderCount !== 1 ? "s" : ""} •{" "}
            Minimum bid: {minBid.toFixed(3)} SOL
          </p>

          <div className="space-y-4 mb-8">
            <div>
              <span className="text-xs text-white/30 uppercase tracking-wider">
                End Time
              </span>
              <p className="text-white/60 mt-1">
                {endTime.toLocaleString()}
              </p>
            </div>
            {isAuthority && (
              <div>
                <span className="text-xs text-white/30 uppercase tracking-wider">
                  Authority
                </span>
                <p className="text-white/60 mt-1 text-sm">
                  You are the authority
                </p>
              </div>
            )}
          </div>

          {canClose && (
            <button
              onClick={handleCloseAuction}
              disabled={loading}
              className="w-full px-6 py-3 bg-[#3673F5] text-white text-sm font-medium rounded-full hover:bg-[#3673F5]/90 transition-all disabled:opacity-50"
            >
              {loading ? "Closing..." : "Close Auction"}
            </button>
          )}
        </div>

        <div className="space-y-6">
          {!wallet.publicKey ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-white/40 mb-4">Connect wallet to participate</p>
            </div>
          ) : canPlaceBid ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-light mb-4">Place Your Bid</h2>
              <p className="text-white/40 text-sm mb-4">
                Your bid will be encrypted - nobody can see it!
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-wider mb-2 block">
                    Bid Amount (SOL)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min={minBid}
                    placeholder={minBid.toString()}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#3673F5]/50"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                </div>
                <button
                  onClick={handlePlaceBid}
                  disabled={loading || !bidAmount}
                  className="w-full px-6 py-3 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  {loading ? "Placing bid..." : "Place Encrypted Bid"}
                </button>
              </div>
            </div>
          ) : bid ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-light">Your Bid</h2>
              <div>
                <span className="text-xs text-white/30">Deposit: </span>
                <span className="text-white">
                  {(bid.depositAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(3)} SOL
                </span>
              </div>
              {hasChecked && (
                <div>
                  <span className="text-xs text-white/30">Status: </span>
                  <span className={isWinner ? "text-green-400" : "text-white/60"}>
                    {isWinner ? "Winner 🎉" : "Not Winner"}
                  </span>
                </div>
              )}
              {hasWithdrawn && (
                <div>
                  <span className="text-xs text-white/30">Withdrawn: </span>
                  <span className="text-white/60">Yes</span>
                </div>
              )}

              {canCheckWin && (
                <button
                  onClick={handleCheckWin}
                  disabled={loading || decrypting}
                  className="w-full px-6 py-3 bg-[#3673F5] text-white text-sm font-medium rounded-full hover:bg-[#3673F5]/90 transition-all disabled:opacity-50"
                >
                  {decrypting
                    ? "Decrypting..."
                    : loading
                    ? "Checking..."
                    : "Check If You Won"}
                </button>
              )}

              {canWithdraw && (
                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  {loading
                    ? "Withdrawing..."
                    : isWinner
                    ? "Confirm Payment (Bid Stays in Vault)"
                    : "Withdraw Refund"}
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-white/40">
                {auction.isClosed
                  ? "Auction is closed"
                  : isEnded
                  ? "Auction has ended"
                  : "Connect wallet to place a bid"}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
