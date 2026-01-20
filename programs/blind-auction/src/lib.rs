#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("8Z2LM7Anbe8N4LdPgDG9ri4wS8uhEHZggUzovdxBYYMH"); 

#[program]
pub mod blind_auction {
    use super::*;

    pub fn create_auction(
        ctx: Context<CreateAuction>, 
        auction_id: u64, 
        minimum_bid: u64,
        end_time: i64,
        title: String,
        description: String,
        category: String,
        image_url: String,
        tags: Vec<String>
    ) -> Result<()> {
        instructions::create_auction::handler(ctx, auction_id, minimum_bid, end_time, title, description, category, image_url, tags)
    }

    pub fn place_bid<'info>(
        ctx: Context<'_, '_, '_, 'info, PlaceBid<'info>>,
        encrypted_bid_amount: Vec<u8>,
        deposit_amount: u64,
    ) -> Result<()> {
        instructions::place_bid::handler(ctx, encrypted_bid_amount, deposit_amount)
    }

    pub fn close_auction(ctx: Context<CloseAuction>) -> Result<()> {
        instructions::close_auction::handler(ctx)
    }

    pub fn determine_winner<'info>(ctx: Context<'_, '_, '_, 'info, DetermineWinner<'info>>) -> Result<()> {
        instructions::determine_winner::handler(ctx)
    }

    pub fn check_win<'info>(ctx: Context<'_, '_, '_, 'info, CheckWin<'info>>) -> Result<()> {
        instructions::check_win::handler(ctx)
    }

    pub fn withdraw_bid(
        ctx: Context<WithdrawBid>,
        is_winner_handle: Vec<u8>,
        is_winner_plaintext: Vec<u8>,
    ) -> Result<()> {
        instructions::withdraw_bid::handler(ctx, is_winner_handle, is_winner_plaintext)
    }
}
