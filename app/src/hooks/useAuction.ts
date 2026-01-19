"use client";

import { useCallback, useState, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import {
  getAuctionPDA,
  getBidPDA,
  getVaultPDA,
  INCO_LIGHTNING_PROGRAM_ID,
  AuctionAccount,
  BidAccount,
} from "@/lib/program";
import { decrypt } from "@inco/solana-sdk/attested-decrypt";
import { handleToBuffer, plaintextToBuffer, hexToBuffer } from "@inco/solana-sdk/utils";
import { encryptValue } from "@inco/solana-sdk/encryption";

// Derive allowance PDA from handle and allowed address
function deriveAllowancePda(
  handle: bigint,
  allowedAddress: PublicKey
): [PublicKey, number] {
  const buf = Buffer.alloc(16);
  let v = handle;
  for (let i = 0; i < 16; i++) {
    buf[i] = Number(v & BigInt(0xff));
    v >>= BigInt(8);
  }
  return PublicKey.findProgramAddressSync(
    [buf, allowedAddress.toBuffer()],
    INCO_LIGHTNING_PROGRAM_ID
  );
}

export function useAuction() {
  const program = useProgram();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize wallet properties to avoid dependency issues
  const publicKey = useMemo(
    () => wallet?.publicKey ?? null,
    [wallet?.publicKey]
  );
  const signMessage = useMemo(
    () => wallet?.signMessage ?? null,
    [wallet?.signMessage]
  );
  const signTransaction = useMemo(
    () => wallet?.signTransaction ?? null,
    [wallet?.signTransaction]
  );

  // Fetch all auctions
  const fetchAuctions = useCallback(async (): Promise<
    { publicKey: PublicKey; account: AuctionAccount }[]
  > => {
    if (!program) return [];

    try {
      const accounts = await program.account.auction.all();
      return accounts as unknown as {
        publicKey: PublicKey;
        account: AuctionAccount;
      }[];
    } catch (err) {
      console.error("Error fetching auctions:", err);
      return [];
    }
  }, [program]);

  // Fetch single auction by ID
  const fetchAuction = useCallback(
    async (
      auctionId: BN
    ): Promise<{ publicKey: PublicKey; account: AuctionAccount } | null> => {
      if (!program) return null;

      try {
        const [auctionPDA] = getAuctionPDA(auctionId);
        const account = await program.account.auction.fetch(auctionPDA);
        return {
          publicKey: auctionPDA,
          account: account as unknown as AuctionAccount,
        };
      } catch (err) {
        console.error("Error fetching auction:", err);
        return null;
      }
    },
    [program]
  );

  // Fetch auction by PDA
  const fetchAuctionByPDA = useCallback(
    async (auctionPDA: PublicKey): Promise<AuctionAccount | null> => {
      if (!program) return null;

      try {
        const account = await program.account.auction.fetch(auctionPDA);
        return account as unknown as AuctionAccount;
      } catch (err) {
        console.error("Error fetching auction:", err);
        return null;
      }
    },
    [program]
  );

  // Fetch user's bid for an auction
  const fetchBid = useCallback(
    async (
      auctionPDA: PublicKey,
      bidder: PublicKey
    ): Promise<BidAccount | null> => {
      if (!program) return null;

      try {
        const [bidPDA] = getBidPDA(auctionPDA, bidder);
        const account = await program.account.bid.fetch(bidPDA);
        return account as unknown as BidAccount;
      } catch {
        return null;
      }
    },
    [program]
  );

  // Create a new auction
  const createAuction = useCallback(
    async (
      auctionId: BN,
      minimumBid: BN,
      endTime: BN
    ): Promise<string | null> => {
      if (!program || !publicKey) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const [auctionPDA] = getAuctionPDA(auctionId);
        const [vaultPDA] = getVaultPDA(auctionPDA);

        const tx = await program.methods
          .createAuction(auctionId, minimumBid, endTime)
          .accounts({
            authority: publicKey,
            auction: auctionPDA,
            vault: vaultPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log("Auction created:", tx);
        return tx;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error creating auction:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, publicKey]
  );

  // Place a bid with encrypted bid amount
  const placeBid = useCallback(
    async (
      auctionPDA: PublicKey,
      bidAmount: number, // in SOL
      depositAmount: number // in SOL (should be >= bidAmount)
    ): Promise<string | null> => {
      if (!program || !publicKey) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Encrypt the bid amount
        const encryptedBid = await encryptValue(BigInt(bidAmount * 1e9));
        const encryptedBidBuffer = hexToBuffer(encryptedBid);

        const [bidPDA] = getBidPDA(auctionPDA, publicKey);
        const [vaultPDA] = getVaultPDA(auctionPDA);

        const tx = await program.methods
          .placeBid(encryptedBidBuffer, new BN(depositAmount * 1e9))
          .accounts({
            bidder: publicKey,
            auction: auctionPDA,
            bid: bidPDA,
            vault: vaultPDA,
            systemProgram: SystemProgram.programId,
            incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
          })
          .rpc();

        console.log("Bid placed:", tx);
        return tx;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error placing bid:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, publicKey]
  );

  // Close auction (authority only)
  const closeAuction = useCallback(
    async (auctionPDA: PublicKey): Promise<string | null> => {
      if (!program || !publicKey) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const tx = await program.methods
          .closeAuction()
          .accounts({
            authority: publicKey,
            auction: auctionPDA,
          })
          .rpc();

        console.log("Auction closed:", tx);
        return tx;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error closing auction:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, publicKey]
  );

  // Get result handle from simulation logs
  const getHandleFromSimulation = useCallback(
    async (
      auctionPDA: PublicKey,
      prefix: string = "Result handle:"
    ): Promise<bigint | null> => {
      if (!program || !publicKey) return null;

      try {
        const [bidPDA] = getBidPDA(auctionPDA, publicKey);

        // Build the instruction
        const ix = await program.methods
          .checkWin()
          .accounts({
            bidder: publicKey,
            auction: auctionPDA,
            bid: bidPDA,
            systemProgram: SystemProgram.programId,
            incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
          })
          .instruction();

        const { blockhash } = await connection.getLatestBlockhash();

        // Create a VersionedTransaction for simulation
        const messageV0 = new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: blockhash,
          instructions: [ix],
        }).compileToV0Message();

        const versionedTx = new VersionedTransaction(messageV0);

        // Simulate without signatures
        const sim = await connection.simulateTransaction(versionedTx, {
          sigVerify: false,
        });

        for (const log of sim.value.logs || []) {
          if (log.includes(prefix)) {
            const match = log.match(/(\d+)/);
            if (match) return BigInt(match[1]);
          }
        }
        return null;
      } catch (err) {
        console.error("Simulation error:", err);
        return null;
      }
    },
    [program, publicKey, connection]
  );

  // Check if bid is winner - with proper allowance setup
  const checkWin = useCallback(
    async (
      auctionPDA: PublicKey
    ): Promise<{ tx: string; isWinnerHandle: bigint } | null> => {
      if (!program || !publicKey) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const [bidPDA] = getBidPDA(auctionPDA, publicKey);

        // Step 1: Simulate to get the result handle
        const resultHandle = await getHandleFromSimulation(auctionPDA);

        if (!resultHandle) {
          setError("Could not get result handle from simulation");
          return null;
        }

        // Step 2: Derive allowance PDA
        const [allowancePda] = deriveAllowancePda(resultHandle, publicKey);

        // Step 3: Call checkWin with remaining accounts for allowance
        const tx = await program.methods
          .checkWin()
          .accounts({
            bidder: publicKey,
            auction: auctionPDA,
            bid: bidPDA,
            systemProgram: SystemProgram.programId,
            incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
          })
          .remainingAccounts([
            { pubkey: allowancePda, isSigner: false, isWritable: true },
            { pubkey: publicKey, isSigner: false, isWritable: false },
          ])
          .rpc();

        console.log("Win status checked:", tx);

        return { tx, isWinnerHandle: resultHandle };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error checking win:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, publicKey, getHandleFromSimulation]
  );

  // Decrypt is_winner_handle to check if user won
  const decryptIsWinner = useCallback(
    async (
      isWinnerHandle: bigint | BN
    ): Promise<{
      isWinner: boolean;
      plaintext: string;
      ed25519Instructions: unknown[];
    } | null> => {
      if (!publicKey || !signMessage) {
        setError("Wallet not connected or doesn't support signing");
        return null;
      }

      try {
        const handleStr =
          typeof isWinnerHandle === "bigint"
            ? isWinnerHandle.toString()
            : isWinnerHandle.toString();

        // Wait a bit for the chain to update
        await new Promise((r) => setTimeout(r, 2000));

        const result = await decrypt([handleStr], {
          address: publicKey,
          signMessage: signMessage,
        });

        const isWinner = result.plaintexts[0] === "1";
        return {
          isWinner,
          plaintext: result.plaintexts[0] as string,
          ed25519Instructions: result.ed25519Instructions,
        };
      } catch (err) {
        console.error("Error decrypting:", err);
        return null;
      }
    },
    [publicKey, signMessage]
  );

  // Withdraw bid - requires ed25519 instructions from decrypt
  const withdrawBid = useCallback(
    async (
      auctionPDA: PublicKey,
      isWinnerHandle: string,
      plaintext: string,
      ed25519Instructions: unknown[]
    ): Promise<string | null> => {
      if (!program || !publicKey || !signTransaction) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const [bidPDA] = getBidPDA(auctionPDA, publicKey);
        const [vaultPDA] = getVaultPDA(auctionPDA);

        // Build withdraw instruction
        const withdrawIx = await program.methods
          .withdrawBid(
            handleToBuffer(isWinnerHandle),
            plaintextToBuffer(plaintext)
          )
          .accounts({
            bidder: publicKey,
            auction: auctionPDA,
            bid: bidPDA,
            vault: vaultPDA,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            systemProgram: SystemProgram.programId,
            incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
          })
          .instruction();

        // Build transaction with ed25519 instructions first
        const tx = new Transaction();

        // Add ed25519 signature verification instructions
        ed25519Instructions.forEach((ix) => {
          tx.add(ix as Parameters<typeof tx.add>[0]);
        });

        // Add withdraw instruction
        tx.add(withdrawIx);

        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;

        // Sign and send
        const signedTx = await signTransaction(tx);
        const sig = await connection.sendRawTransaction(signedTx.serialize());
        await connection.confirmTransaction(sig, "confirmed");

        console.log("Bid withdrawn:", sig);
        return sig;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error withdrawing bid:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, publicKey, signTransaction, connection]
  );

  return {
    program,
    loading,
    error,
    fetchAuctions,
    fetchAuction,
    fetchAuctionByPDA,
    fetchBid,
    createAuction,
    placeBid,
    closeAuction,
    checkWin,
    decryptIsWinner,
    withdrawBid,
  };
}
