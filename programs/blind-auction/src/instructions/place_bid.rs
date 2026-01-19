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
pub struct PlaceBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,

    #[account(mut)]
    pub auction: Account<'info, Auction>,

    #[account(
        init,
        payer = bidder,
        space = Bid::SIZE,
        seeds = [b"bid", auction.key().as_ref(), bidder.key().as_ref()],
        bump
    )]
    pub bid: Account<'info, Bid>,

    /// CHECK: vault PDA
    #[account(mut, seeds = [b"vault", auction.key().as_ref()], bump)]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: Program<'info, IncoLightning>,
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, PlaceBid<'info>>,
    encrypted_bid_amount: Vec<u8>,
    deposit_amount: u64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let clock = Clock::get()?;
    
    require!(auction.is_open, AuctionError::AuctionClosed);
    require!(!auction.is_closed, AuctionError::AuctionClosed);
    require!(clock.unix_timestamp < auction.end_time, AuctionError::AuctionEnded);
    require!(deposit_amount >= auction.minimum_bid, AuctionError::BidTooLow);

    // Transfer deposit to vault
    anchor_lang::solana_program::program::invoke(
        &anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.bidder.key(),
            &ctx.accounts.vault.key(),
            deposit_amount,
        ),
        &[
            ctx.accounts.bidder.to_account_info(),
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Create encrypted bid amount handle
    let inco = ctx.accounts.inco_lightning_program.to_account_info();
    let cpi_ctx = CpiContext::new(inco.clone(), Operation { 
        signer: ctx.accounts.bidder.to_account_info() 
    });
    let bid_handle: Euint128 = cpi::new_euint128(cpi_ctx, encrypted_bid_amount, 0)?;

    // Store bid
    let bid = &mut ctx.accounts.bid;
    bid.auction = auction.key();
    bid.bidder = ctx.accounts.bidder.key();
    bid.deposit_amount = deposit_amount;
    bid.bid_amount_handle = bid_handle.0;
    bid.bump = ctx.bumps.bid;

    auction.bidder_count += 1;

    // Update highest bid: if first bid, set it; otherwise compare encrypted and update if higher
    if auction.highest_bid_handle == 0 {
        auction.highest_bid_handle = bid_handle.0;
    } else {
        // Encrypted comparison: new_bid >= current_highest?
        let cpi_ctx_compare = CpiContext::new(inco.clone(), Operation { 
            signer: ctx.accounts.bidder.to_account_info() 
        });
        let is_higher: Ebool = cpi::e_ge(
            cpi_ctx_compare,
            bid_handle,
            Euint128(auction.highest_bid_handle),
            0,
        )?;

        // Use e_select to update: if higher, use new bid; else keep current
        let cpi_ctx_select = CpiContext::new(inco.clone(), Operation { 
            signer: ctx.accounts.bidder.to_account_info() 
        });
        let new_highest: Euint128 = cpi::e_select(
            cpi_ctx_select,
            is_higher,
            bid_handle,
            Euint128(auction.highest_bid_handle),
            0,
        )?;
        auction.highest_bid_handle = new_highest.0;
    }

    // Allow bidder to decrypt their bid amount
    if ctx.remaining_accounts.len() >= 2 {
        let cpi_ctx = CpiContext::new(inco, Allow {
            allowance_account: ctx.remaining_accounts[0].clone(),
            signer: ctx.accounts.bidder.to_account_info(),
            allowed_address: ctx.remaining_accounts[1].clone(),
            system_program: ctx.accounts.system_program.to_account_info(),
        });
        cpi::allow(cpi_ctx, bid_handle.0, true, ctx.accounts.bidder.key())?;
    }

    msg!("Bid placed!");
    msg!("   Bid handle: {}", bid_handle.0);
    msg!("   (Your bid is encrypted - nobody can see it!)");
    Ok(())
}
