use anchor_lang::prelude::*;
use inco_lightning::{
    cpi::{self, accounts::VerifySignature},
    program::IncoLightning,
    ID as INCO_LIGHTNING_ID,
};
use crate::state::{Auction, Bid};
use crate::error::AuctionError;

#[derive(Accounts)]
pub struct WithdrawBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,

    #[account(mut)]
    pub auction: Account<'info, Auction>,

    #[account(mut)]
    pub bid: Account<'info, Bid>,

    /// CHECK: vault PDA
    #[account(
        mut,
        seeds = [b"vault", auction.key().as_ref()],
        bump
    )]
    pub vault: AccountInfo<'info>,

    /// CHECK: Instructions sysvar for Ed25519 signature verification
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: Program<'info, IncoLightning>,
}

/// Withdraw funds: winner pays (bid stays in vault), losers get refund (their deposit back)
pub fn handler(
    ctx: Context<WithdrawBid>,
    is_winner_handle: Vec<u8>,
    is_winner_plaintext: Vec<u8>,
) -> Result<()> {
    let bid = &mut ctx.accounts.bid;
    let auction = &ctx.accounts.auction;

    require!(bid.bidder == ctx.accounts.bidder.key(), AuctionError::NotBidder);
    require!(bid.checked, AuctionError::NotChecked);
    require!(!bid.withdrawn, AuctionError::AlreadyWithdrawn);
    require!(auction.is_closed, AuctionError::AuctionNotClosed);

    // Verify the decryption signature on-chain for is_winner
    let cpi_ctx = CpiContext::new(
        ctx.accounts.inco_lightning_program.to_account_info(),
        VerifySignature {
            instructions: ctx.accounts.instructions.to_account_info(),
            signer: ctx.accounts.bidder.to_account_info(),
        },
    );

    // Verify signature for is_winner
    cpi::is_validsignature(
        cpi_ctx,
        1,
        Some(vec![is_winner_handle.clone()]),
        Some(vec![is_winner_plaintext.clone()]),
    )?;

    // Parse the verified plaintext
    let is_winner = parse_plaintext_to_bool(&is_winner_plaintext)?;

    msg!("Verified is_winner: {}", is_winner);

    bid.withdrawn = true;

    // Calculate transfer amount
    let transfer_amount = if is_winner {
        // Winner pays - their bid amount stays in vault, they get nothing back
        0
    } else {
        // Loser gets their full deposit back (refund)
        require!(bid.deposit_amount > 0, AuctionError::NoFunds);
        bid.deposit_amount
    };

    // Only transfer if there's something to transfer (losers get refund)
    if transfer_amount > 0 {
        let auction_key = auction.key();
        let vault_seeds: &[&[u8]] = &[
            b"vault",
            auction_key.as_ref(),
            &[ctx.bumps.vault],
        ];

        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.vault.key(),
                &ctx.accounts.bidder.key(),
                transfer_amount,
            ),
            &[
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.bidder.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[vault_seeds],
        )?;

        msg!("Funds withdrawn: {} lamports!", transfer_amount);
        msg!("   💰 Your bid has been refunded.");
    } else {
        // Winner - their payment stays in vault
        msg!("   🎉 Congratulations! You won the auction!");
        msg!("   Your bid amount ({}) remains in vault as payment.", bid.deposit_amount);
    }
    Ok(())
}

/// Parse decrypted boolean plaintext
fn parse_plaintext_to_bool(plaintext: &[u8]) -> Result<bool> {
    if plaintext.is_empty() {
        return Ok(false);
    }

    let any_nonzero = plaintext.iter().any(|&b| b != 0 && b != b'0');

    if let Ok(s) = std::str::from_utf8(plaintext) {
        if s == "0" || s == "false" {
            return Ok(false);
        }
        if s == "1" || s == "true" {
            return Ok(true);
        }
    }

    Ok(any_nonzero)
}

