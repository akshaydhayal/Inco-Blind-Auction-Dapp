use anchor_lang::prelude::*;

#[error_code]
pub enum AuctionError {
    #[msg("Auction is closed")]
    AuctionClosed,
    #[msg("Auction is still open")]
    AuctionStillOpen,
    #[msg("Auction has not been closed by authority")]
    AuctionNotClosed,
    #[msg("Auction has already ended")]
    AuctionEnded,
    #[msg("Auction has not ended yet")]
    AuctionNotEnded,
    #[msg("Bid amount is below minimum")]
    BidTooLow,
    #[msg("No bidders")]
    NoBidders,
    #[msg("Not bidder")]
    NotBidder,
    #[msg("Already checked")]
    AlreadyChecked,
    #[msg("Bid not checked yet")]
    NotChecked,
    #[msg("Already withdrawn")]
    AlreadyWithdrawn,
    #[msg("Not withdrawn yet")]
    NotWithdrawn,
    #[msg("Not the winner")]
    NotWinner,
    #[msg("Winner already determined")]
    WinnerAlreadyDetermined,
    #[msg("Winner not determined yet")]
    WinnerNotDetermined,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("No funds in vault")]
    NoFunds,
}
