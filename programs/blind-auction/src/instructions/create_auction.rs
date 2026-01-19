use anchor_lang::prelude::*;
use crate::state::Auction;
use crate::error::AuctionError;

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct CreateAuction<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = Auction::SIZE,
        seeds = [b"auction", auction_id.to_le_bytes().as_ref()],
        bump
    )]
    pub auction: Account<'info, Auction>,

    /// CHECK: vault PDA for holding bid funds
    #[account(mut, seeds = [b"vault", auction.key().as_ref()], bump)]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateAuction>, auction_id: u64, minimum_bid: u64, end_time: i64) -> Result<()> {
    let clock = Clock::get()?;
    require!(end_time > clock.unix_timestamp, AuctionError::AuctionEnded);

    let auction = &mut ctx.accounts.auction;
    auction.authority = ctx.accounts.authority.key();
    auction.auction_id = auction_id;
    auction.minimum_bid = minimum_bid;
    auction.end_time = end_time;
    auction.bidder_count = 0;
    auction.is_open = true;
    auction.is_closed = false;
    auction.highest_bid_handle = 0;
    auction.winner_determined = false;
    auction.bump = ctx.bumps.auction;

    msg!("Auction {} created", auction_id);
    msg!("   Minimum bid: {} lamports", minimum_bid);
    msg!("   End time: {} (unix timestamp)", end_time);
    Ok(())
}
