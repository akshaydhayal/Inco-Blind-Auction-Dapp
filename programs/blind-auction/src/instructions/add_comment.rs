use anchor_lang::prelude::*;
use crate::state::{Auction, Comment};
use crate::error::AuctionError;

#[derive(Accounts)]
#[instruction(comment_id: u64)]
pub struct AddComment<'info> {
    #[account(mut)]
    pub commenter: Signer<'info>,

    /// CHECK: Auction account
    pub auction: Account<'info, Auction>,

    #[account(
        init,
        payer = commenter,
        space = Comment::SIZE,
        seeds = [b"comment", auction.key().as_ref(), comment_id.to_le_bytes().as_ref()],
        bump
    )]
    pub comment: Account<'info, Comment>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<AddComment>,
    comment_id: u64,
    comment_text: String,
) -> Result<()> {
    // Validate comment length
    require!(comment_text.len() <= 500, AuctionError::InvalidInput);
    require!(comment_text.len() > 0, AuctionError::InvalidInput);

    let clock = Clock::get()?;
    let comment = &mut ctx.accounts.comment;

    comment.auction = ctx.accounts.auction.key();
    comment.commenter = ctx.accounts.commenter.key();
    comment.comment = comment_text;
    comment.timestamp = clock.unix_timestamp;
    comment.bump = ctx.bumps.comment;

    msg!("Comment {} added to auction {}", comment_id, ctx.accounts.auction.auction_id);
    Ok(())
}
