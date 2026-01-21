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
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

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

  // Countdown timer effect
  useEffect(() => {
    if (!auction) {
      setTimeRemaining(null);
      return;
    }

    const endTime = auction.endTime.toNumber();
    const now = Math.floor(Date.now() / 1000);
    const isExpired = endTime <= now;

    if (isExpired || auction.isClosed) {
      setTimeRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const remaining = endTime - Math.floor(Date.now() / 1000);

      if (remaining <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  const handlePlaceBid = async () => {
    if (!auctionPDA || !bidAmount) return;
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setTxStatus("Invalid bid amount");
      return;
    }

    setTxStatus("Placing bid...");
    setLastTxHash(null);
    const tx = await placeBid(auctionPDA, amount, amount);
    if (tx) {
      setLastTxHash(tx);
      setTxStatus("Bid placed successfully!");
      setIsSuccess(true);
      await refreshData();
      setBidAmount("");
      clearStatus();
    } else {
      setTxStatus(null);
    }
  };

  const handleCheckWin = async () => {
    if (!auctionPDA || !wallet.publicKey) return;
    setDecrypting(true);
    setTxStatus("Checking win status...");
    setLastTxHash(null);

    const result = await checkWin(auctionPDA, wallet.publicKey);
    if (result) {
      setLastTxHash(result.txHash);
      setTxStatus("Win status checked!");
      setIsSuccess(true);
      await refreshData();
      clearStatus();
    } else {
      setTxStatus(null);
    }
    setDecrypting(false);
  };

  const handleDecryptWinner = async () => {
    if (!bid) return;
    setDecrypting(true);
    const result = await decryptIsWinner(auctionPDA!, wallet.publicKey!);
    if (result) {
      setDecryptResult(result);
      setIsWinner(result.plaintext === "1");
    }
    setDecrypting(false);
  };

  const handleWithdraw = async () => {
    if (!auctionPDA || !decryptResult) return;
    setTxStatus("Withdrawing funds...");
    setLastTxHash(null);
    const tx = await withdrawBid(
      auctionPDA,
      wallet.publicKey!,
      decryptResult.isWinnerHandle,
      decryptResult.plaintext
    );
    if (tx) {
      setLastTxHash(tx);
      setTxStatus("Funds withdrawn successfully!");
      setIsSuccess(true);
      await refreshData();
      clearStatus();
    } else {
      setTxStatus(null);
    }
  };

  const handleCloseAuction = async () => {
    if (!auctionPDA) return;
    setTxStatus("Closing auction...");
    setLastTxHash(null);
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
      <div className="space-y-6">
          <div className="h-4 bg-neutral-800 rounded w-32 animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="aspect-video w-full bg-neutral-900 rounded-lg animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-neutral-900 rounded-lg animate-pulse" />
                <div className="h-24 bg-neutral-900 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-neutral-900 rounded-lg w-3/4 animate-pulse" />
              <div className="h-6 bg-neutral-900 rounded-lg w-1/4 animate-pulse" />
              <div className="h-20 bg-neutral-900 rounded-lg w-full animate-pulse" />
            </div>
          </div>
        </div>
    );
  }

  if (!auction) {
    return (
      <div className="space-y-6">
            <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors">
              ← Back to All Auctions
            </Link>
            <div className="rounded-lg border border-red-800 bg-red-950/30 p-8 text-center">
              <div className="text-4xl mb-4">❌</div>
              <div className="text-xl font-medium text-red-200 mb-2">Auction Not Found</div>
              <p className="text-red-300/70">The auction you're looking for doesn't exist</p>
            </div>
          </div>
    );
  }

  const isAuthority = wallet.publicKey?.toBase58() === auction.authority.toBase58();
  const minBid = auction.minimumBid.toNumber() / LAMPORTS_PER_SOL;
  const endTime = new Date(auction.endTime.toNumber() * 1000);
  const isEnded = Date.now() >= endTime.getTime();
  const hasChecked = bid?.checked ?? false;
  const hasWithdrawn = bid?.withdrawn ?? false;
  const isOpen = auction.isOpen && !auction.isClosed;
  const isExpired = auction.endTime.toNumber() <= Math.floor(Date.now() / 1000);

  const canPlaceBid = isOpen && !isEnded && !bid && wallet.publicKey;
  const canCheckWin = auction.isClosed && bid && !hasChecked && wallet.publicKey;
  const canWithdraw = hasChecked && !hasWithdrawn && decryptResult && wallet.publicKey;
  const canClose = isAuthority && !auction.isClosed && isEnded && auction.bidderCount > 0;

  return (
    <div className="space-y-6">
        {/* Back Button */}
        <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors mb-6">
          ← Back to All Auctions
        </Link>

        {error && (
          <div className="rounded border border-yellow-800 bg-yellow-950/50 text-yellow-200 px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {txStatus && (
          <div className="mb-6">
            <TxStatus
              status={txStatus}
              txHash={lastTxHash}
              isError={!!error}
              isSuccess={isSuccess}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Image and Stats */}
          <div className="space-y-4">
            {/* Image */}
            <div className="aspect-video w-full rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
              {auction.imageUrl ? (
                <img
                  src={auction.imageUrl}
                  alt={auction.title || "Auction image"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="450"%3E%3Crect fill="%23171717" width="800" height="450"/%3E%3Ctext fill="%23525252" font-family="system-ui" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage not available%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500">
                  No image available
                </div>
              )}
            </div>

            {/* Auction Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-500 mb-1">Auction ID</div>
                <div className="text-2xl font-bold font-mono">#{auction.auctionId.toString().slice(-6)}</div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-500 mb-1">Bidders</div>
                <div className="text-2xl font-bold text-green-400">{auction.bidderCount}</div>
              </div>
            </div>

            {/* End Time Info with Countdown */}
            <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-4 space-y-3">
              <div className="text-sm font-medium mb-2">Valid Until</div>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {isExpired || auction.isClosed ? '⏰' : '📅'}
                </span>
                <div>
                  <div className={isExpired || auction.isClosed ? 'text-red-400' : 'text-neutral-200'}>
                    {endTime.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {(isExpired || auction.isClosed) && (
                    <div className="text-xs text-red-400 mt-1">
                      {auction.isClosed ? 'This auction has been closed' : 'This auction has expired'}
                    </div>
                  )}
                </div>
              </div>

              {/* Countdown Timer */}
              {!isExpired && !auction.isClosed && timeRemaining && (
                <div className="pt-3 border-t border-neutral-800">
                  <div className="text-xs text-neutral-500 mb-2">Time Remaining</div>
                  <div className="flex items-center gap-3">
                    {timeRemaining.days > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">{timeRemaining.days}</div>
                        <div className="text-xs text-neutral-500">days</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{timeRemaining.hours}</div>
                      <div className="text-xs text-neutral-500">hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{timeRemaining.minutes}</div>
                      <div className="text-xs text-neutral-500">minutes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-300">{timeRemaining.seconds}</div>
                      <div className="text-xs text-neutral-500">seconds</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category and Tags */}
            {(auction.category || (auction.tags && auction.tags.length > 0)) && (
              <div className="rounded-lg border border-neutral-800 p-4 bg-neutral-900/30">
                <div className="text-sm font-medium mb-3">📋 Details</div>
                <div className="space-y-2 text-sm">
                  {auction.category && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Category</span>
                      <span className="text-neutral-200">{auction.category}</span>
                    </div>
                  )}
                  {auction.tags && auction.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {auction.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-neutral-800 text-neutral-300 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="space-y-6">
            {/* Title and Status Badge */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-4xl font-bold">{auction.title || `Auction #${auction.auctionId.toString().slice(-6)}`}</h1>
                <div className={`px-4 py-2 rounded-lg border ${
                  isOpen && !isExpired
                    ? 'bg-green-900/50 border-green-700'
                    : 'bg-neutral-800 border-neutral-700'
                }`}>
                  <div className={`text-2xl font-bold ${
                    isOpen && !isExpired ? 'text-green-200' : 'text-neutral-400'
                  }`}>
                    {isOpen && !isExpired ? '● LIVE' : auction.isClosed ? 'CLOSED' : 'ENDED'}
                  </div>
                </div>
              </div>
              {auction.description && (
                <p className="text-lg text-neutral-300">{auction.description}</p>
              )}
            </div>

            {/* Minimum Bid Info */}
            <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Minimum Bid</div>
                <div className="text-2xl font-bold text-green-400">{minBid.toFixed(3)} SOL</div>
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                All bids are encrypted and remain private until auction closes
              </div>
            </div>

            {/* Place Bid Section */}
            {canPlaceBid && (
              <div className="rounded-lg border border-purple-800/50 bg-purple-950/30 p-6">
                <div className="text-lg font-medium text-purple-200 mb-3">
                  💰 Place Encrypted Bid
                </div>
                <p className="text-sm text-neutral-400 mb-4">
                  Enter your bid amount. Your bid will be encrypted and remain private until the auction closes.
                </p>
                <div className="space-y-3 mb-4">
                  <input
                    type="number"
                    placeholder={`Minimum: ${minBid.toFixed(3)} SOL`}
                    step="0.001"
                    min={minBid}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-200 focus:border-purple-600 focus:outline-none"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                </div>
                <button
                  onClick={handlePlaceBid}
                  disabled={loading || !bidAmount || parseFloat(bidAmount) < minBid}
                  className="w-full px-6 py-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '⏳ Placing Bid...' : '💰 Place Encrypted Bid'}
                </button>
              </div>
            )}

            {/* Check Win Status */}
            {canCheckWin && (
              <div className="rounded-lg border border-blue-800/50 bg-blue-950/30 p-6">
                <div className="text-lg font-medium text-blue-200 mb-3">
                  🔍 Check Win Status
                </div>
                <p className="text-sm text-neutral-400 mb-4">
                  Check if you won the auction. This will decrypt your win status on-chain.
                </p>
                <button
                  onClick={handleCheckWin}
                  disabled={loading || decrypting}
                  className="w-full px-6 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {decrypting ? '⏳ Checking...' : '🔍 Check Win Status'}
                </button>
              </div>
            )}

            {/* Decrypt Winner */}
            {hasChecked && !decryptResult && (
              <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-6">
                <div className="text-lg font-medium text-amber-200 mb-3">
                  🔓 Decrypt Winner Status
                </div>
                <p className="text-sm text-neutral-400 mb-4">
                  Decrypt your win status to see if you won the auction.
                </p>
                <button
                  onClick={handleDecryptWinner}
                  disabled={decrypting}
                  className="w-full px-6 py-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {decrypting ? '⏳ Decrypting...' : '🔓 Decrypt Winner Status'}
                </button>
              </div>
            )}

            {/* Winner/Loser Status */}
            {decryptResult && (
              <div className={`rounded-lg border p-6 ${
                isWinner
                  ? 'border-green-800/50 bg-green-950/30'
                  : 'border-red-800/50 bg-red-950/30'
              }`}>
                <div className={`text-lg font-medium mb-3 ${
                  isWinner ? 'text-green-200' : 'text-red-200'
                }`}>
                  {isWinner ? '🎉 You Won!' : '😔 You Did Not Win'}
                </div>
                <p className="text-sm text-neutral-400 mb-4">
                  {isWinner
                    ? 'Congratulations! You had the highest bid. Your bid amount stays in the vault as payment.'
                    : 'You did not win this auction. You can withdraw your bid amount.'}
                </p>
                {canWithdraw && (
                  <button
                    onClick={handleWithdraw}
                    disabled={loading}
                    className="w-full px-6 py-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? '⏳ Withdrawing...' : isWinner ? '✅ Confirm Payment' : '💰 Withdraw Bid'}
                  </button>
                )}
                {hasWithdrawn && (
                  <div className="text-sm text-neutral-400 text-center mt-2">
                    ✓ Funds have been withdrawn
                  </div>
                )}
              </div>
            )}

            {/* Already Bid */}
            {bid && !hasChecked && (
              <div className="rounded-lg border border-blue-800/50 bg-blue-950/30 p-6">
                <div className="text-lg font-medium text-blue-200 mb-3">
                  ✅ Bid Placed
                </div>
                <p className="text-sm text-neutral-400">
                  You have already placed a bid in this auction. Wait for the auction to close to check your win status.
                </p>
              </div>
            )}

            {/* Connect Wallet */}
            {!wallet.publicKey && (
              <div className="rounded-lg border border-purple-800/50 bg-purple-950/30 p-6">
                <div className="text-lg font-medium text-purple-200 mb-3">
                  👆 Connect Wallet
                </div>
                <p className="text-sm text-neutral-400 mb-4">
                  Connect your wallet to place bids and participate in this auction.
                </p>
                <div className="text-xs text-center text-neutral-500">
                  Connect your wallet using the button in the top-right corner
                </div>
              </div>
            )}

            {/* Close Auction (Authority Only) */}
            {canClose && (
              <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-6">
                <div className="text-lg font-medium text-red-200 mb-3">
                  🔒 Close Auction
                </div>
                <p className="text-sm text-neutral-400 mb-4">
                  As the auction authority, you can close this auction now that it has ended.
                </p>
                <button
                  onClick={handleCloseAuction}
                  disabled={loading}
                  className="w-full px-6 py-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '⏳ Closing...' : '🔒 Close Auction'}
                </button>
              </div>
            )}

            {/* Additional Info */}
            <div className="rounded-lg border border-neutral-800 p-4 bg-neutral-900/30">
              <div className="text-sm font-medium mb-3">📋 Auction Information</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Privacy</span>
                  <span className="text-green-400">✓ Encrypted Bids</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Blockchain</span>
                  <span className="text-neutral-200">Solana</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Encryption</span>
                  <span className="text-green-400">✓ Inco Lightning</span>
                </div>
                {isAuthority && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Your Role</span>
                    <span className="text-purple-400">Authority</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
