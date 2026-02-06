# BlindBids - Privacy-Preserving Blind Auction on Solana

Live Project Link: [https://inco-blind-auction.vercel.app](https://inco-blind-auction.vercel.app)

A privacy-preserving blind auction system built on Solana using **Inco Lightning Rust SDK** for encrypted computation. Bidders submit encrypted bids that remain completely private until the auction closes, ensuring fairness and preventing bid manipulation.


---
## 📺 Project Demo

### 🎥 Presentation Video
[https://drive.google.com/file/d/14YcDFWejDX3U-uRmo3FxuUtVDqCmWaf-/view?usp=drive_link](https://drive.google.com/file/d/14YcDFWejDX3U-uRmo3FxuUtVDqCmWaf-/view?usp=drive_link)


### 📸 Product Screenshots

<div align="center">
  <p><b>1. Homepage - Active Auctions</b></p>
  <img src="https://github.com/akshaydhayal/Inco-Blind-Auction-Dapp/blob/main/demo/Blind-Auction.png" alt="Homepage" width="600">
  <br>
  <p><i>Browse active and closed auctions with real-time countdown timers</i></p>
  
  <p><b>2. Auction Detail Page</b></p>
  <img src="https://github.com/akshaydhayal/Inco-Blind-Auction-Dapp/blob/main/demo/Blind-Auction%20(3).png" alt="Auction Detail" width="600">
  <br>
  <p><i>View auction details, place encrypted bids, and participate in discussions</i></p>

  <p><b>3. Create Auction Modal</b></p>
  <img src="https://github.com/akshaydhayal/Inco-Blind-Auction-Dapp/blob/main/demo/Blind-Auction%20(2).png" alt="Create Auction" width="600">
  <br>
  <p><i>Create new blind auctions with encrypted bids</i></p>
  
</div>

---

### 🏆 Post-Auction Flow: Winner Determination & Withdrawal

This visual guide shows the complete flow after an auction ends - from closing the auction to determining winners and processing payments/refunds.

<div align="center">

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                        🏁 AUCTION END-TO-WITHDRAW FLOW                            ║
╚═══════════════════════════════════════════════════════════════════════════════════╝

   ┌─────────────────────┐
   │  ⏰ AUCTION ENDED   │
   │  Waiting for Close  │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │  🔐 CLOSE AUCTION   │
   │  (By Auctioneer)    │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │  🔍 CHECK WIN       │
   │  STATUS             │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │  🔓 DECRYPT WINNER  │
   │  STATUS             │
   └──────────┬──────────┘
              │
       ┌──────┴──────┐
       ▼             ▼
┌─────────────┐ ┌─────────────┐
│  🎉 WINNER  │ │  😔 LOSER   │
│  Confirm    │ │  Withdraw   │
│  Payment    │ │  Refund     │
└─────────────┘ └─────────────┘
```

</div>

#### Phase-by-Phase Screenshots

<table align="center">
<tr>
<td align="center" width="50%">
<b>Phase 1: Auction Ended - Waiting for Closure</b>
<br><br>
<img src="https://github.com/akshaydhayal/Inco-Blind-Auction-Dapp/blob/main/demo/Blind-Auction%20(5).png" alt="Phase 1" width="400">
<br>
<i>Auction time has expired. Waiting for the auctioneer to close the auction.</i>
</td>
<td align="center" width="50%">
<b>Phase 2: Close Auction (Auctioneer)</b>
<br><br>
<img src="https://github.com/akshaydhayal/Inco-Blind-Auction-Dapp/blob/main/demo/Blind-Auction%20(6).png" alt="Phase 2" width="400">
<br>
<i>Auctioneer closes the auction to enable winner determination.</i>
</td>
</tr>
<tr>
<td colspan="2" align="center">
<h3>⬇️</h3>
</td>
</tr>
<tr>
<td align="center" width="50%">
<b>Phase 3: Check Win Status</b>
<br><br>
<img src="https://github.com/akshaydhayal/Inco-Blind-Auction-Dapp/blob/main/demo/Blind-Auction%20(10).png" alt="Phase 3" width="400">
<br>
<i>Bidders check their encrypted win status on-chain.</i>
</td>
<td align="center" width="50%">
<b>Phase 4: Decrypt Winner Status</b>
<br><br>
<img src="https://github.com/akshaydhayal/Inco-Blind-Auction-Dapp/blob/main/demo/Blind-Auction%20(9).png" alt="Phase 4" width="400">
<br>
<i>Decrypt the encrypted result to reveal win/loss status.</i>
</td>
</tr>
<tr>
<td colspan="2" align="center">
<h3>⬇️</h3>
</td>
</tr>
<tr>
<td align="center" width="50%">
<b>Phase 5a: 🎉 You Won!</b>
<br><br>
<img src="https://github.com/akshaydhayal/Inco-Blind-Auction-Dapp/blob/main/demo/Blind-Auction%20(7).png" alt="Winner" width="400">
<br>
<i>Winner confirms payment - bid amount stays in vault as payment.</i>
</td>
<td align="center" width="50%">
<b>Phase 5b: 😔 You Did Not Win</b>
<br><br>
<img src="https://github.com/akshaydhayal/Inco-Blind-Auction-Dapp/blob/main/demo/Blind-Auction%20(8).png" alt="Loser" width="400">
<br>
<i>Non-winners can withdraw their full bid amount as refund.</i>
</td>
</tr>
</table>

#### Flow Summary

| Step | Action | Who | What Happens |
|------|--------|-----|--------------|
| 1️⃣ | Auction Ends | System | Time expires, bidding stops |
| 2️⃣ | Close Auction | Auctioneer | Finalizes auction, enables withdrawals |
| 3️⃣ | Check Win Status | Each Bidder | Encrypted comparison: your bid vs highest |
| 4️⃣ | Decrypt Result | Each Bidder | Reveals your personal win/loss status |
| 5️⃣ | Confirm/Withdraw | Each Bidder | Winner pays, losers get refund |

---

## ✨ Features

### Privacy Features (Powered by Inco Lightning)
- **🔒 Encrypted Bids** - Bid amounts are encrypted and hidden from everyone
- **🎭 Anonymous Bidding** - Only bidders can decrypt their own bid amounts
- **⚖️ Fair Comparison** - Highest bid determined through encrypted comparison without revealing amounts
- **🔐 Private Results** - Win/loss status is encrypted and only visible to the bidder

### Auction Features
- **📦 Rich Metadata** - Title, description, category, image, and tags for each auction
- **⏱️ Time-Based Auctions** - Set precise end dates with real-time countdown timers
- **💰 Minimum Bid Threshold** - Set minimum bid amounts to filter serious bidders
- **💬 Comments System** - Discuss auctions with other users (max 500 characters)
- **🔄 Refund System** - Automatic refunds for non-winning bidders

### Frontend Features
- **🎨 Modern Dark UI** - Beautiful, responsive dark-themed interface
- **📱 Mobile Friendly** - Fully responsive design for all screen sizes
- **⚡ Real-time Updates** - Live countdown timers and instant transaction feedback
- **🔗 Wallet Integration** - Seamless Solana wallet connection (Phantom, Solflare, etc.)
- **📋 Transaction Status** - Clear feedback with transaction links to Solana Explorer

---

## 🏗️ Architecture

### Privacy Model

| Data | Visibility | Who Can Decrypt |
|------|------------|-----------------|
| Bid Amount | Encrypted | Only the bidder |
| Highest Bid | Encrypted | No one (used for comparison only) |
| Win/Loss Status | Encrypted | Only the bidder |
| Refund Amount | Encrypted | Only the bidder |

### Program Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           BLIND AUCTION FLOW                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CREATE AUCTION                                                           │
│     ├── Authority creates auction                                            │
│     ├── Sets minimum bid, end time, metadata                                 │
│     └── Auction is now OPEN for bids                                         │
│                                                                              │
│  2. PLACE BID (can be done multiple times by different bidders)              │
│     ├── Bidder encrypts their bid amount locally                             │
│     ├── Deposits SOL to vault                                                │
│     ├── Encrypted bid stored on-chain                                        │
│     └── Highest bid updated (encrypted comparison)                           │
│                                                                              │
│  3. AUCTION ENDS (time passes)                                               │
│     └── Bidding stops, waiting for authority to close                        │
│                                                                              │
│  4. CLOSE AUCTION (by authority only)                                        │
│     ├── Authority finalizes the auction                                      │
│     └── Enables winner checking and withdrawals                              │
│                                                                              │
│  5. CHECK WIN STATUS (each bidder does this)                                 │
│     ├── Encrypted comparison: bid >= highest_bid                             │
│     ├── Result stored as encrypted boolean                                   │
│     └── Permission granted to bidder to decrypt                              │
│                                                                              │
│  6. DECRYPT & WITHDRAW                                                       │
│     ├── Bidder decrypts their win status                                     │
│     ├── Winner: Confirms payment (bid stays in vault)                        │
│     └── Losers: Withdraw full refund                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Encrypted Operations (Inco Lightning)

| Operation | Purpose |
|-----------|---------|
| `new_euint128` | Create encrypted value from ciphertext |
| `e_ge` | Encrypted greater-than-or-equal comparison |
| `e_select` | Encrypted conditional selection |
| `allow` | Grant decryption permission to specific address |
| `is_validsignature` | Verify decryption proof on-chain |

---

## 📊 Account Structures

### Auction Account

```rust
pub struct Auction {
    pub authority: Pubkey,           // Creator of the auction
    pub auction_id: u64,             // Unique identifier
    pub minimum_bid: u64,            // Minimum bid in lamports
    pub end_time: i64,               // Unix timestamp when auction ends
    pub bidder_count: u32,           // Number of bidders
    pub is_open: bool,               // Can still place bids?
    pub is_closed: bool,             // Closed by authority?
    pub highest_bid_handle: u128,    // Encrypted highest bid
    pub winner_determined: bool,     // Winner determined?
    pub bump: u8,
    // Metadata
    pub title: String,               // Max 100 chars
    pub description: String,         // Max 1000 chars
    pub category: String,            // Max 50 chars
    pub image_url: String,           // Max 200 chars
    pub tags: Vec<String>,           // Max 10 tags, 30 chars each
}
```

### Bid Account

```rust
pub struct Bid {
    pub auction: Pubkey,             // Associated auction
    pub bidder: Pubkey,              // Bidder's public key
    pub deposit_amount: u64,         // SOL deposited (lamports)
    pub bid_amount_handle: u128,     // Encrypted bid amount
    pub is_winner_handle: u128,      // Encrypted win status
    pub refund_amount_handle: u128,  // Encrypted refund amount
    pub checked: bool,               // Win status checked?
    pub withdrawn: bool,             // Funds withdrawn?
    pub bump: u8,
}
```

### Comment Account

```rust
pub struct Comment {
    pub auction: Pubkey,             // Associated auction
    pub commenter: Pubkey,           // Commenter's public key
    pub comment: String,             // Comment text (max 500 chars)
    pub timestamp: i64,              // Unix timestamp
    pub bump: u8,
}
```

---

## 🛠️ Tech Stack

- **Blockchain**: Solana
- **Smart Contract Framework**: Anchor 0.31.1
- **Privacy Layer**: Inco Lightning SDK
- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Wallet**: Solana Wallet Adapter
- **Language**: Rust (Contracts) + TypeScript (Frontend)

---

## 📋 Prerequisites

- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.31.1
- Node.js 18+
- Bun or Yarn

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/Inco-fhevm/raffle-example-solana
cd raffle-example-solana
```

### 2. Install Dependencies

```bash
# Install Anchor dependencies
yarn install

# Install frontend dependencies
cd app
bun install
```

### 3. Build Program

```bash
anchor build
```

### 4. Get Program Address

```bash
solana address -k target/deploy/blind_auction-keypair.json
```

### 5. Update Program ID

Update the program ID in:
- `programs/blind-auction/src/lib.rs`
- `Anchor.toml`

### 6. Rebuild & Deploy

```bash
anchor build
anchor deploy --provider.cluster devnet
```

---

## 🎮 Running the Frontend

```bash
cd app

# Install dependencies
bun install

# Start development server
bun run dev
```

The app will be available at `http://localhost:3000`

---

## 🧪 Testing

```bash
# Run Anchor tests
anchor test
```

### Test Scenarios

| Scenario | Description |
|----------|-------------|
| Winner Flow | Bidder places highest bid → wins → confirms payment |
| Loser Flow | Bidder places lower bid → loses → withdraws refund |
| Comments | Users can add comments to auctions |
| Close Auction | Authority closes auction after end time |

---

## 💻 Client Integration

### Encrypting and Placing a Bid

```typescript
import { encryptValue } from "@inco/solana-sdk/encryption";
import { hexToBuffer } from "@inco/solana-sdk/utils";

// Encrypt bid amount (e.g., 0.1 SOL)
const myBid = 0.1;
const encryptedBid = await encryptValue(BigInt(myBid * 1e9));

// Place bid
await program.methods
  .placeBid(hexToBuffer(encryptedBid), new BN(myBid * 1e9))
  .accounts({
    bidder: wallet.publicKey,
    auction: auctionPDA,
    bid: bidPDA,
    vault: vaultPDA,
    systemProgram: SystemProgram.programId,
    incoLightningProgram: INCO_LIGHTNING_ID,
  })
  .rpc();
```

### Checking Win Status

```typescript
const [allowancePda] = PublicKey.findProgramAddressSync(
  [handleBuffer, walletPublicKey.toBuffer()],
  INCO_LIGHTNING_PROGRAM_ID
);

await program.methods
  .checkWin()
  .accounts({
    bidder: wallet.publicKey,
    auction: auctionPDA,
    bid: bidPDA,
    systemProgram: SystemProgram.programId,
    incoLightningProgram: INCO_LIGHTNING_ID,
  })
  .remainingAccounts([
    { pubkey: allowancePda, isSigner: false, isWritable: true },
    { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
  ])
  .rpc();
```

### Decrypting Result

```typescript
import { decrypt } from "@inco/solana-sdk/attested-decrypt";

const result = await decrypt([isWinnerHandle], {
  address: wallet.publicKey,
  signMessage: async (msg) => nacl.sign.detached(msg, wallet.secretKey),
});

const isWinner = result.plaintexts[0] === "1";
```

### Withdrawing Funds

```typescript
// Build transaction with Ed25519 signature + withdraw instruction
const tx = new Transaction();
result.ed25519Instructions.forEach(ix => tx.add(ix));
tx.add(await program.methods
  .withdrawBid(isWinnerHandle, isWinnerPlaintext)
  .accounts({...})
  .instruction()
);

await sendAndConfirmTransaction(connection, tx, [wallet]);
```

---

## 📦 Dependencies

### Rust (Smart Contract)

```toml
[dependencies]
anchor-lang = "0.31.1"
inco-lightning = { version = "0.1.4", features = ["cpi"] }
```

### Frontend

```json
{
  "@coral-xyz/anchor": "^0.31.1",
  "@inco/solana-sdk": "latest",
  "@solana/wallet-adapter-react": "^0.15.35",
  "@solana/web3.js": "^1.98.0",
  "next": "15.1.4",
  "react": "^19.0.0",
  "tailwindcss": "^3.4.17"
}
```

---

## 📁 Project Structure

```
raffle-example-solana/
├── programs/
│   └── blind-auction/
│       ├── src/
│       │   ├── instructions/
│       │   │   ├── create_auction.rs
│       │   │   ├── place_bid.rs
│       │   │   ├── close_auction.rs
│       │   │   ├── check_win.rs
│       │   │   ├── withdraw_bid.rs
│       │   │   ├── add_comment.rs
│       │   │   └── mod.rs
│       │   ├── state/
│       │   │   └── mod.rs
│       │   ├── error.rs
│       │   └── lib.rs
│       └── Cargo.toml
├── app/
│   └── src/
│       ├── app/
│       │   ├── page.tsx           # Homepage (auction listing)
│       │   ├── auction/[id]/
│       │   │   └── page.tsx       # Auction detail page
│       │   └── layout.tsx
│       ├── components/
│       │   ├── navbar.tsx
│       │   ├── create-auction-modal.tsx
│       │   ├── wallet-button.tsx
│       │   └── ...
│       ├── hooks/
│       │   └── useAuction.ts      # Auction interactions hook
│       └── lib/
│           ├── program.ts         # Program helpers
│           └── idl.json           # Anchor IDL
├── tests/
│   └── blind-auction.ts
├── Anchor.toml
└── README.md
```

---

## 🔐 Security Considerations

1. **Bid Privacy**: All bid amounts are encrypted using Inco Lightning's FHE (Fully Homomorphic Encryption)
2. **On-Chain Verification**: Decryption proofs are verified on-chain before fund withdrawal
3. **Authority Control**: Only the auction authority can close auctions
4. **Time-Locked**: Auctions cannot be closed before the end time
5. **PDA Security**: All accounts use Program Derived Addresses for security

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🔗 Links

- [Inco Network](https://inco.org)
- [Solana](https://solana.com)
- [Anchor Framework](https://www.anchor-lang.com)

---

<p align="center">
  <strong>Built with ❤️ using Inco Lightning on Solana</strong>
</p>
