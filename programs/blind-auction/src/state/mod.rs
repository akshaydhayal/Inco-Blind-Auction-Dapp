use anchor_lang::prelude::*;

/// Auction account
#[account]
pub struct Auction {
    pub authority: Pubkey,
    pub auction_id: u64,
    pub minimum_bid: u64,              // Minimum bid amount in lamports
    pub end_time: i64,                  // Unix timestamp when auction ends
    pub bidder_count: u32,              // Number of bidders
    pub is_open: bool,                  // Can still place bids?
    pub is_closed: bool,                 // Auction has been closed by authority
    pub highest_bid_handle: u128,        // Encrypted highest bid amount
    pub winner_determined: bool,         // Has winner been determined?
    pub bump: u8,
}

impl Auction {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 8 + 4 + 1 + 1 + 16 + 1 + 1 + 32;
}

/// Bid account - stores each bidder's encrypted bid
#[account]
pub struct Bid {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub deposit_amount: u64,            // SOL amount deposited (lamports)
    pub bid_amount_handle: u128,         // Encrypted bid amount
    pub is_winner_handle: u128,          // Encrypted: is this the highest bid?
    pub refund_amount_handle: u128,       // Encrypted refund (0 for winner, bid amount for losers)
    pub checked: bool,                    // Whether winner status has been checked
    pub withdrawn: bool,                 // Whether funds have been withdrawn
    pub bump: u8,
}

impl Bid {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 16 + 16 + 16 + 1 + 1 + 1 + 32;
}
