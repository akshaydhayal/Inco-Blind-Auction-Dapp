"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-md shadow-indigo-500/50 hover:shadow-indigo-500/70 hover:scale-105"
      >
        Connect Wallet
      </button>
    );
  }

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150">
        <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-white/90 font-bold font-mono">
          {shortAddress}
        </span>
      </div>
      <button
        onClick={() => disconnect()}
        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300"
      >
        Disconnect
      </button>
    </div>
  );
}
