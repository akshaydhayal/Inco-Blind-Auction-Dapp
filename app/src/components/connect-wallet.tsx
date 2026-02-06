"use client";

import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function ConnectWallet() {
  const { setVisible } = useWalletModal();

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 mt-4">
      {/* Hero Section with How It Works */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-900/50 bg-gradient-to-br from-purple-950/40 via-neutral-900 to-neutral-950 p-8 md:p-12">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          {/* Centered header section */}
          <div className="text-center mb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="px-3 py-1 text-xs font-medium bg-purple-600/30 text-purple-300 rounded-full border border-purple-500/30">
                🔐 Powered by Inco Lightning
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-blue-600/30 text-blue-300 rounded-full border border-blue-500/30">
                ⚡ On Solana
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              Private Blind Auctions
            </h1>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto mb-3">
              Bid with confidence. Your bid amount stays encrypted until the auction ends. No one sees what you bid — not even the auctioneer.
            </p>
            
            {/* Connect Wallet CTA */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600/20 border border-indigo-500/50 text-indigo-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-medium">Connect your wallet above to get started</span>
            </div>
          </div>
          
          {/* How It Works - Flow Chart */}
          <div className="mt-0">
            <div className="text-sm text-neutral-500 mb-3 flex items-center justify-center gap-3">
              <span className="flex-1 h-px bg-neutral-700"></span>
              <span className="uppercase tracking-wider font-medium">How It Works</span>
              <span className="flex-1 h-px bg-neutral-700"></span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Step 1 */}
              <div className="relative group">
                <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50 hover:border-purple-500/50 transition-all h-full">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-xl mb-3">
                    🎯
                  </div>
                  <div className="text-xs text-purple-400 font-medium mb-1">Step 1</div>
                  <div className="font-medium text-sm text-white mb-1">Browse Auctions</div>
                  <p className="text-xs text-neutral-500">Find items you want to bid on</p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-neutral-600 z-10">→</div>
              </div>
              
              {/* Step 2 */}
              <div className="relative group">
                <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50 hover:border-blue-500/50 transition-all h-full">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xl mb-3">
                    🔒
                  </div>
                  <div className="text-xs text-blue-400 font-medium mb-1">Step 2</div>
                  <div className="font-medium text-sm text-white mb-1">Place Encrypted Bid</div>
                  <p className="text-xs text-neutral-500">Your bid is encrypted on-chain</p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-neutral-600 z-10">→</div>
              </div>
              
              {/* Step 3 */}
              <div className="relative group">
                <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50 hover:border-amber-500/50 transition-all h-full">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl mb-3">
                    ⏰
                  </div>
                  <div className="text-xs text-amber-400 font-medium mb-1">Step 3</div>
                  <div className="font-medium text-sm text-white mb-1">Auction Closes</div>
                  <p className="text-xs text-neutral-500">Winner determined privately</p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-neutral-600 z-10">→</div>
              </div>
              
              {/* Step 4 */}
              <div className="relative group">
                <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50 hover:border-green-500/50 transition-all h-full">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xl mb-3">
                    🏆
                  </div>
                  <div className="text-xs text-green-400 font-medium mb-1">Step 4</div>
                  <div className="font-medium text-sm text-white mb-1">Claim or Refund</div>
                  <p className="text-xs text-neutral-500">Winner pays, losers get refund</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Key Features */}
          <div className="mt-2 flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Bid amounts hidden from everyone
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Fully on-chain & trustless
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              FHE-powered encryption
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Automatic refunds for losers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
