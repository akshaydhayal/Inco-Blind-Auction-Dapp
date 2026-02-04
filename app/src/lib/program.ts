import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";

// Program ID from the deployed contract
export const PROGRAM_ID = new PublicKey(
  "GzVHoPfCw5gW2YN3hqGHg6pkgp7ygcNyhu3mjTqzMBRv"
);

// Inco Lightning Program ID
export const INCO_LIGHTNING_PROGRAM_ID = new PublicKey(
  "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"
);

// IDL import
import idl from "./idl.json";     

export type BlindAuctionIDL = typeof idl;

export function getProgram(
  connection: Connection,
  wallet: AnchorProvider["wallet"]
) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(idl as any, provider);
}

// PDA derivation functions for blind auction
export function getAuctionPDA(auctionId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("auction"), auctionId.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
}

export function getBidPDA(
  auction: PublicKey,
  bidder: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bid"), auction.toBuffer(), bidder.toBuffer()],
    PROGRAM_ID
  );
}

export function getVaultPDA(auction: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), auction.toBuffer()],
    PROGRAM_ID
  );
}

export function getCommentPDA(
  auction: PublicKey,
  commentId: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("comment"), auction.toBuffer(), commentId.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
}

// Convert u128 handle to Buffer
export function handleToBuffer(handle: BN | bigint): Buffer {
  const bn = typeof handle === "bigint" ? new BN(handle.toString()) : handle;
  return bn.toArrayLike(Buffer, "le", 16);
}

// Auction account type
export interface AuctionAccount {
  authority: PublicKey;
  auctionId: BN;
  minimumBid: BN;
  endTime: BN;
  bidderCount: number;
  isOpen: boolean;
  isClosed: boolean;
  highestBidHandle: BN;
  winnerDetermined: boolean;
  bump: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  tags: string[];
}

// Bid account type
export interface BidAccount {
  auction: PublicKey;
  bidder: PublicKey;
  depositAmount: BN;
  bidAmountHandle: BN;
  isWinnerHandle: BN;
  refundAmountHandle: BN;
  checked: boolean;
  withdrawn: boolean;
  bump: number;
}

// Comment account type
export interface CommentAccount {
  auction: PublicKey;
  commenter: PublicKey;
  comment: string;
  timestamp: BN;
  bump: number;
}

export { SystemProgram };
