use anchor_lang::prelude::*;
use crate::state::Auction;
use crate::error::AuctionError;

#[derive(Accounts)]
pub struct CloseAuction<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub auction: Account<'info, Auction>,
}

pub fn handler(ctx: Context<CloseAuction>) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let clock = Clock::get()?;

    require!(auction.authority == ctx.accounts.authority.key(), AuctionError::Unauthorized);
    require!(!auction.is_closed, AuctionError::AuctionClosed);
    require!(clock.unix_timestamp >= auction.end_time, AuctionError::AuctionNotEnded);
    require!(auction.bidder_count > 0, AuctionError::NoBidders);

    auction.is_open = false;
    auction.is_closed = true;

    msg!("Auction closed!");
    msg!("   Total bidders: {}", auction.bidder_count);
    Ok(())
}
