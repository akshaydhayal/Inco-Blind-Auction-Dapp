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
    // Metadata fields     
    pub title: String,                  // Auction title (max 100 chars)
    pub description: String,            // Auction description (max 1000 chars)
    pub category: String,               // Auction category (max 50 chars)
    pub image_url: String,              // Image URL (max 200 chars)
    pub tags: Vec<String>,              // Tags (max 10 tags, each max 30 chars)
}

impl Auction {
    // Base size: 8 (discriminator) + 32 (authority) + 8 (auction_id) + 8 (minimum_bid) + 8 (end_time) 
    // + 4 (bidder_count) + 1 (is_open) + 1 (is_closed) + 16 (highest_bid_handle) + 1 (winner_determined) 
    // + 1 (bump) = 87 bytes
    // Metadata: 4+100 (title) + 4+1000 (description) + 4+50 (category) + 4+200 (image_url) 
    // + 4+10*(4+30) (tags) = 104 + 1004 + 54 + 204 + 344 = 1710 bytes
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 8 + 4 + 1 + 1 + 16 + 1 + 1 + 4 + 100 + 4 + 1000 + 4 + 50 + 4 + 200 + 4 + 10 * (4 + 30);
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

/// Comment account - stores comments on auctions
#[account]
pub struct Comment {
    pub auction: Pubkey,
    pub commenter: Pubkey,
    pub comment: String,              // Comment text (max 500 chars)
    pub timestamp: i64,                // Unix timestamp when comment was created
    pub bump: u8,
}

impl Comment {
    // Base size: 8 (discriminator) + 32 (auction) + 32 (commenter) + 4+500 (comment) + 8 (timestamp) + 1 (bump) = 585 bytes
    pub const SIZE: usize = 8 + 32 + 32 + 4 + 500 + 8 + 1;
}
