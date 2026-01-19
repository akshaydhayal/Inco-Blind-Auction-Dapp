use anchor_lang::prelude::*;
use inco_lightning::{
    cpi::{self, accounts::{Allow, Operation}},
    program::IncoLightning,
    types::{Ebool, Euint128},
    ID as INCO_LIGHTNING_ID,
};
use crate::state::{Auction, Bid};
use crate::error::AuctionError;

#[derive(Accounts)]
pub struct DetermineWinner<'info> {
    #[account(mut)]
    pub checker: Signer<'info>,

    #[account(mut)]
    pub auction: Account<'info, Auction>,

    #[account(mut)]
    pub bid: Account<'info, Bid>,

    pub system_program: Program<'info, System>,

    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: Program<'info, IncoLightning>,
}

pub fn handler<'info>(ctx: Context<'_, '_, '_, 'info, DetermineWinner<'info>>) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let bid = &mut ctx.accounts.bid;

    require!(auction.is_closed, AuctionError::AuctionNotClosed);
    require!(!auction.winner_determined, AuctionError::WinnerAlreadyDetermined);
    require!(bid.auction == auction.key(), AuctionError::NotBidder);

    let inco = ctx.accounts.inco_lightning_program.to_account_info();
    let cpi_ctx = CpiContext::new(inco.clone(), Operation { 
        signer: ctx.accounts.checker.to_account_info() 
    });

    // Encrypted comparison: bid_amount >= highest_bid?
    // If true, this bidder is the winner (or tied for highest)
    let is_winner: Ebool = cpi::e_ge(
        cpi_ctx,
        Euint128(bid.bid_amount_handle),
        Euint128(auction.highest_bid_handle),
        0,
    )?;

    bid.is_winner_handle = is_winner.0;

    // Allow bidder to see result
    if ctx.remaining_accounts.len() >= 2 {
        let cpi_ctx = CpiContext::new(inco, Allow {
            allowance_account: ctx.remaining_accounts[0].clone(),
            signer: ctx.accounts.checker.to_account_info(),
            allowed_address: ctx.remaining_accounts[1].clone(),
            system_program: ctx.accounts.system_program.to_account_info(),
        });

        cpi::allow(cpi_ctx, is_winner.0, true, bid.bidder)?;
    }

    msg!("Winner determination checked!");
    msg!("   Result handle: {}", is_winner.0);
    msg!("   Bidder: {}", bid.bidder);
    Ok(())
}
