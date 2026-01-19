# Blind Auction

A privacy-preserving blind auction system built on Solana using Inco Lightning rust SDK for encrypted computation. Bidders submit encrypted bids, and bid amounts remain completely private until the auction closes, ensuring complete privacy throughout the bidding process.

## Overview

This program implements a blind auction where:

- Bid amounts are encrypted and hidden from everyone
- Highest bid is determined through encrypted comparison
- Winner's payment stays in vault, losers get refunded
- Only bidders can decrypt their own bid and win status

## Architecture

### Privacy Model

| Data | Visibility |
|------|------------|
| Bidder's bid amount | Encrypted (only bidder can decrypt) |
| Highest bid | Encrypted (determined through encrypted comparison) |
| Win/loss result | Encrypted (only bidder can decrypt) |
| Refund amount | Encrypted (only bidder can decrypt) |

### Program Flow

```
1. create_auction    -> Authority creates auction with minimum bid and end time
2. place_bid         -> Bidder submits encrypted bid amount + deposit
3. close_auction     -> Authority closes auction after end time
4. check_win         -> Encrypted comparison: bid >= highest_bid
5. withdraw_bid      -> Winner pays (bid stays in vault), losers get refund
```

### Key Encrypted Operations

- `new_euint128`: Create encrypted value from ciphertext
- `e_ge`: Encrypted greater-than-or-equal comparison
- `e_select`: Encrypted conditional selection
- `allow`: Grant decryption permission to specific address
- `is_validsignature`: Verify decryption proof on-chain

## Account Structures

### Auction

```rust
pub struct Auction {
    pub authority: Pubkey,
    pub auction_id: u64,
    pub minimum_bid: u64,
    pub end_time: i64,
    pub bidder_count: u32,
    pub is_open: bool,
    pub is_closed: bool,
    pub highest_bid_handle: u128,  // Encrypted highest bid
    pub winner_determined: bool,
    pub bump: u8,
}
```

### Bid

```rust
pub struct Bid {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub deposit_amount: u64,        // SOL deposited
    pub bid_amount_handle: u128,     // Encrypted bid amount
    pub is_winner_handle: u128,      // Encrypted: is this the highest bid?
    pub refund_amount_handle: u128,   // Encrypted refund (0 for winner)
    pub checked: bool,
    pub withdrawn: bool,
    pub bump: u8,
}
```

## Prerequisites

- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.31.1
- Node.js 18+
- Yarn

## Installation

```bash
# Clone repository
git clone https://github.com/Inco-fhevm/raffle-example-solana
cd raffle-example-solana

# Install dependencies
yarn install

# Build program
anchor build
```

## Deployment

```bash
# Get program keypair address
solana address -k target/deploy/blind_auction-keypair.json

# Update program ID in lib.rs and Anchor.toml with the address above

# Rebuild with correct program ID
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Testing

```bash
# Run tests (after deployment)
anchor test
```

### Test Scenarios

The test suite covers:

1. **Winner Flow**: Bidder places highest bid, wins, and confirms payment
2. **Loser Flow**: Bidder places lower bid, loses, and withdraws refund

## Usage

### Client Integration

```typescript
import { encryptValue } from "@inco/solana-sdk/encryption";
import { decrypt } from "@inco/solana-sdk/attested-decrypt";
import { hexToBuffer } from "@inco/solana-sdk/utils";

// Encrypt bid amount
const myBid = 0.1; // SOL
const encryptedBid = await encryptValue(BigInt(myBid * 1e9));

// Place bid
await program.methods
  .placeBid(hexToBuffer(encryptedBid), new BN(myBid * 1e9))
  .accounts({...})
  .rpc();

// Decrypt result after checking
const result = await decrypt([isWinnerHandle], {
  address: wallet.publicKey,
  signMessage: async (msg) => nacl.sign.detached(msg, wallet.secretKey),
});

const isWinner = result.plaintexts[0] === "1";
```

### Allow Pattern for Decryption

To decrypt encrypted values, the program must grant permission via the `allow` instruction. This is done through remaining accounts:

```typescript
const [allowancePda] = PublicKey.findProgramAddressSync(
  [handleBuffer, walletPublicKey.toBuffer()],
  INCO_LIGHTNING_PROGRAM_ID
);

await program.methods
  .checkWin()
  .accounts({...})
  .remainingAccounts([
    { pubkey: allowancePda, isSigner: false, isWritable: true },
    { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
  ])
  .rpc();
```

### On-Chain Verification

Bid withdrawal requires on-chain verification of the decryption proof:

```typescript
const result = await decrypt([isWinnerHandle], {...});

// Build transaction with Ed25519 signature + withdraw instruction
const tx = new Transaction();
result.ed25519Instructions.forEach(ix => tx.add(ix));
tx.add(withdrawInstruction);
```

## Dependencies

### Rust

```toml
[dependencies]
anchor-lang = "0.31.1"
inco-lightning = { version = "0.1.4", features = ["cpi"] }
```

## Setting up Frontend:

Navigate to the app folder:

```bash
cd app
```

Install the dependencies:
```bash
bun install
```

Start the app:

```bash
bun run dev
```

The app will start on localhost:3000
