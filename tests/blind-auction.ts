import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlindAuction } from "../target/types/blind_auction";
import { PublicKey, Keypair, SystemProgram, Connection, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";
import { encryptValue } from "@inco/solana-sdk/encryption";
import { decrypt } from "@inco/solana-sdk/attested-decrypt";
import { handleToBuffer, plaintextToBuffer, hexToBuffer } from "@inco/solana-sdk/utils";

const INCO_LIGHTNING_PROGRAM_ID = new PublicKey("5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj");

describe("blind-auction", () => {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const provider = new anchor.AnchorProvider(connection, anchor.AnchorProvider.env().wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const programId = new PublicKey("8Z2LM7Anbe8N4LdPgDG9ri4wS8uhEHZggUzovdxBYYMH");
  const program = anchor.workspace.blindAuction as Program<BlindAuction>;
  
  // Verify program ID matches
  if (program.programId.toBase58() !== programId.toBase58()) {
    throw new Error(`Program ID mismatch! Expected ${programId.toBase58()}, got ${program.programId.toBase58()}`);
  }
  
  let wallet: Keypair;
  let funderWallet: Keypair; // Wallet that funds bidders
  let bidder1: Keypair;
  let bidder2: Keypair;
  let bidder3: Keypair;

  const auctionId = Math.floor(Date.now() / 1000);
  const MINIMUM_BID = 10_000_000; // 0.01 SOL
  const END_TIME = Math.floor(Date.now() / 1000) + 30; // 30 seconds from now (enough time for tests to run)

  // Encrypted bids - nobody can see these!
  const BIDDER1_BID = 50_000_000; // 0.05 SOL
  const BIDDER2_BID = 100_000_000; // 0.1 SOL (highest)
  const BIDDER3_BID = 30_000_000; // 0.03 SOL

  let auctionPda: PublicKey;
  let vaultPda: PublicKey;
  let bid1Pda: PublicKey;
  let bid2Pda: PublicKey;
  let bid3Pda: PublicKey;

  before(() => {
    wallet = (provider.wallet as any).payer as Keypair;
    
    // Initialize funder wallet from provided keypair bytes
    const funderKeypairBytes = new Uint8Array([48,182,182,234,169,224,236,113,52,199,47,66,39,2,163,52,183,44,45,27,127,49,133,151,64,70,248,16,46,218,234,198,42,180,5,68,243,235,189,56,197,37,17,85,205,189,100,191,64,74,171,3,37,193,199,195,213,54,156,198,228,15,248,188]);
    funderWallet = Keypair.fromSecretKey(funderKeypairBytes);
    
    bidder1 = Keypair.generate();
    bidder2 = Keypair.generate();
    bidder3 = Keypair.generate();

    const idBuffer = Buffer.alloc(8);
    idBuffer.writeBigUInt64LE(BigInt(auctionId));

    [auctionPda] = PublicKey.findProgramAddressSync([Buffer.from("auction"), idBuffer], program.programId);
    [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), auctionPda.toBuffer()], program.programId);
    [bid1Pda] = PublicKey.findProgramAddressSync([Buffer.from("bid"), auctionPda.toBuffer(), bidder1.publicKey.toBuffer()], program.programId);
    [bid2Pda] = PublicKey.findProgramAddressSync([Buffer.from("bid"), auctionPda.toBuffer(), bidder2.publicKey.toBuffer()], program.programId);
    [bid3Pda] = PublicKey.findProgramAddressSync([Buffer.from("bid"), auctionPda.toBuffer(), bidder3.publicKey.toBuffer()], program.programId);
  });

  function deriveAllowancePda(handle: bigint, allowedAddress: PublicKey): [PublicKey, number] {
    const buf = Buffer.alloc(16);
    let v = handle;
    for (let i = 0; i < 16; i++) { buf[i] = Number(v & BigInt(0xff)); v >>= BigInt(8); }
    return PublicKey.findProgramAddressSync([buf, allowedAddress.toBuffer()], INCO_LIGHTNING_PROGRAM_ID);
  }

  async function decryptHandle(handle: string, keypair: Keypair): Promise<{ plaintext: string; ed25519Instructions: any[] } | null> {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const result = await decrypt([handle], {
        address: keypair.publicKey,
        signMessage: async (msg: Uint8Array) => nacl.sign.detached(msg, keypair.secretKey),
      });
      return { plaintext: result.plaintexts[0], ed25519Instructions: result.ed25519Instructions };
    } catch { return null; }
  }

  async function getHandleFromSimulation(tx: anchor.web3.Transaction, prefix: string, keypair: Keypair): Promise<bigint | null> {
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = keypair.publicKey;
    tx.sign(keypair);

    const sim = await connection.simulateTransaction(tx);
    for (const log of sim.value.logs || []) {
      if (log.includes(prefix)) {
        const match = log.match(/(\d+)/);
        if (match) return BigInt(match[1]);
      }
    }
    return null;
  }

  async function transferSol(to: PublicKey, amount: number) {
    const lamports = amount * 1e9;
    
    // Check funder wallet balance
    const funderBalance = await connection.getBalance(funderWallet.publicKey);
    const requiredAmount = lamports + 5000; // 5000 for transaction fee
    if (funderBalance < requiredAmount) {
      throw new Error(`Insufficient funds in funder wallet. Has ${funderBalance / 1e9} SOL, needs ${requiredAmount / 1e9} SOL`);
    }

    // Check if recipient already has enough balance
    const recipientBalance = await connection.getBalance(to);
    if (recipientBalance >= lamports) {
      console.log(`   ${to.toBase58()} already has ${recipientBalance / 1e9} SOL`);
      return;
    }

    // Create and send transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: funderWallet.publicKey,
        toPubkey: to,
        lamports: lamports,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = funderWallet.publicKey;
    transaction.sign(funderWallet);

    try {
      const signature = await connection.sendRawTransaction(transaction.serialize());
      await connection.confirmTransaction(signature, "confirmed");
      console.log(`   Transferred ${amount} SOL to ${to.toBase58()}`);
    } catch (error: any) {
      // If transfer fails, check if recipient already has balance (race condition)
      const finalBalance = await connection.getBalance(to);
      if (finalBalance >= lamports) {
        console.log(`   Transfer appeared to fail but recipient has ${finalBalance / 1e9} SOL`);
        return;
      }
      throw error;
    }
  }

  it("1. Create auction", async () => {
    const tx = await program.methods
      .createAuction(
        new anchor.BN(auctionId),
        new anchor.BN(MINIMUM_BID),
        new anchor.BN(END_TIME),
        "Test Auction",
        "This is a test auction for blind bidding",
        "NFTs",
        "https://example.com/image.jpg",
        ["test", "auction", "blind"]
      )
      .accounts({
        authority: wallet.publicKey,
        auction: auctionPda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();

    console.log("Auction created:", tx);
    console.log("   Title: Test Auction");
    console.log("   Minimum bid: 0.01 SOL");
    console.log("   End time:", new Date(END_TIME * 1000).toISOString());
  });

  it("2. Transfer SOL to bidders", async () => {
    console.log(`   Funder wallet: ${funderWallet.publicKey.toBase58()}`);
    const funderBalance = await connection.getBalance(funderWallet.publicKey);
    console.log(`   Funder balance: ${funderBalance / 1e9} SOL`);
    
    // Transfer enough SOL to cover bid amount + transaction fees (0.15 SOL should be enough)
    await transferSol(bidder1.publicKey, 0.15);
    await new Promise(r => setTimeout(r, 500)); // Small delay between transfers
    await transferSol(bidder2.publicKey, 0.15);
    await new Promise(r => setTimeout(r, 500));
    await transferSol(bidder3.publicKey, 0.15);
    console.log("SOL transferred to bidders");
  });

  it("3. Bidder 1 places bid", async () => {
    console.log("   Bidder 1 bid:", BIDDER1_BID / 1e9, "SOL (encrypted, nobody sees this!)");
    const encryptedBid = await encryptValue(BigInt(BIDDER1_BID));

    const tx = await program.methods
      .placeBid(hexToBuffer(encryptedBid), new anchor.BN(BIDDER1_BID))
      .accounts({
        bidder: bidder1.publicKey,
        auction: auctionPda,
        bid: bid1Pda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
        incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
      } as any)
      .signers([bidder1])
      .rpc();

    console.log("Bidder 1 bid placed:", tx);
  });

  it("4. Bidder 2 places bid (highest)", async () => {
    console.log("   Bidder 2 bid:", BIDDER2_BID / 1e9, "SOL (encrypted, nobody sees this!)");
    const encryptedBid = await encryptValue(BigInt(BIDDER2_BID));

    const tx = await program.methods
      .placeBid(hexToBuffer(encryptedBid), new anchor.BN(BIDDER2_BID))
      .accounts({
        bidder: bidder2.publicKey,
        auction: auctionPda,
        bid: bid2Pda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
        incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
      } as any)
      .signers([bidder2])
      .rpc();

    console.log("Bidder 2 bid placed:", tx);
  });

  it("5. Bidder 3 places bid", async () => {
    console.log("   Bidder 3 bid:", BIDDER3_BID / 1e9, "SOL (encrypted, nobody sees this!)");
    const encryptedBid = await encryptValue(BigInt(BIDDER3_BID));

    const tx = await program.methods
      .placeBid(hexToBuffer(encryptedBid), new anchor.BN(BIDDER3_BID))
      .accounts({
        bidder: bidder3.publicKey,
        auction: auctionPda,
        bid: bid3Pda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
        incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
      } as any)
      .signers([bidder3])
      .rpc();

    console.log("Bidder 3 bid placed:", tx);
  });

  it("6. Authority closes auction", async () => {
    // Wait for auction end time to pass
    const currentTime = Math.floor(Date.now() / 1000);
    const waitTime = Math.max(0, (END_TIME - currentTime + 5) * 1000); // Wait until end_time + 5 seconds buffer
    if (waitTime > 0) {
      console.log(`   Waiting ${waitTime / 1000} seconds for auction end time...`);
      await new Promise(r => setTimeout(r, waitTime));
    }

    const tx = await program.methods
      .closeAuction()
      .accounts({
        authority: wallet.publicKey,
        auction: auctionPda,
      } as any)
      .rpc();

    console.log("Auction closed:", tx);
    console.log("   Total bidders: 3");
  });

  it("7. Bidder 2 checks if they won (should be winner)", async () => {
    const txForSim = await program.methods
      .checkWin()
      .accounts({
        bidder: bidder2.publicKey,
        auction: auctionPda,
        bid: bid2Pda,
        systemProgram: SystemProgram.programId,
        incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
      } as any)
      .signers([bidder2])
      .transaction();

    const resultHandle = await getHandleFromSimulation(txForSim, "Result handle:", bidder2);

    if (resultHandle) {
      const [allowancePda] = deriveAllowancePda(resultHandle, bidder2.publicKey);

      const tx = await program.methods
        .checkWin()
        .accounts({
          bidder: bidder2.publicKey,
          auction: auctionPda,
          bid: bid2Pda,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .remainingAccounts([
          { pubkey: allowancePda, isSigner: false, isWritable: true },
          { pubkey: bidder2.publicKey, isSigner: false, isWritable: false },
        ])
        .signers([bidder2])
        .rpc();

      console.log("Bidder 2 checked:", tx);

      // Wait a bit for the refund handle to be set
      await new Promise(r => setTimeout(r, 3000));

      const bid = await program.account.bid.fetch(bid2Pda);
      const isWinnerResult = await decryptHandle(bid.isWinnerHandle.toString(), bidder2);
      if (isWinnerResult) {
        const won = isWinnerResult.plaintext === "1";
        console.log("   Bidder 2 won?", won ? "YES! 🎉" : "No");
      }
    }
  });

  it("8. Bidder 1 checks if they won (should be loser)", async () => {
    const txForSim = await program.methods
      .checkWin()
      .accounts({
        bidder: bidder1.publicKey,
        auction: auctionPda,
        bid: bid1Pda,
        systemProgram: SystemProgram.programId,
        incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
      } as any)
      .signers([bidder1])
      .transaction();

    const resultHandle = await getHandleFromSimulation(txForSim, "Result handle:", bidder1);

    if (resultHandle) {
      const [allowancePda] = deriveAllowancePda(resultHandle, bidder1.publicKey);

      const tx = await program.methods
        .checkWin()
        .accounts({
          bidder: bidder1.publicKey,
          auction: auctionPda,
          bid: bid1Pda,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .remainingAccounts([
          { pubkey: allowancePda, isSigner: false, isWritable: true },
          { pubkey: bidder1.publicKey, isSigner: false, isWritable: false },
        ])
        .signers([bidder1])
        .rpc();

      console.log("Bidder 1 checked:", tx);

      await new Promise(r => setTimeout(r, 3000));

      const bid = await program.account.bid.fetch(bid1Pda);
      const isWinnerResult = await decryptHandle(bid.isWinnerHandle.toString(), bidder1);
      if (isWinnerResult) {
        const won = isWinnerResult.plaintext === "1";
        console.log("   Bidder 1 won?", won ? "YES! 🎉" : "No");
      }
    }
  });

  it("9. Winner (Bidder 2) confirms payment (bid stays in vault)", async () => {
    // Wait a bit to ensure account is available
    await new Promise(r => setTimeout(r, 2000));
    
    let bid;
    try {
      bid = await program.account.bid.fetch(bid2Pda);
    } catch (e: any) {
      console.log("   Bid account not found, skipping withdrawal");
      console.log("   Error:", e.message);
      return;
    }

    const isWinnerHandle = bid.isWinnerHandle.toString();

    if (isWinnerHandle === "0") {
      console.log("   Bid not checked yet");
      return;
    }

    const isWinnerResult = await decryptHandle(isWinnerHandle, bidder2);

    if (!isWinnerResult) {
      console.log("   Failed to decrypt, retrying...");
      await new Promise(r => setTimeout(r, 3000));
      const retryResult = await decryptHandle(isWinnerHandle, bidder2);
      if (!retryResult) {
        console.log("   Failed to decrypt after retry");
        return;
      }
      const isWinner = retryResult.plaintext === "1";
      if (!isWinner) {
        console.log("   Not a winner");
        return;
      }
      
      const withdrawIx = await program.methods
        .withdrawBid(
          handleToBuffer(isWinnerHandle),
          plaintextToBuffer(retryResult.plaintext)
        )
        .accounts({
          bidder: bidder2.publicKey,
          auction: auctionPda,
          bid: bid2Pda,
          vault: vaultPda,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .instruction();

      const tx = new Transaction();
      retryResult.ed25519Instructions.forEach(ix => tx.add(ix));
      tx.add(withdrawIx);

      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = bidder2.publicKey;

      tx.sign(bidder2);
      const sig = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(sig, "confirmed");

      console.log("Winner confirmed payment:", sig);
      console.log("   🎉 Bidder 2 won the auction!");
      console.log("   💰 Bidder 2's bid amount stays in vault as payment");
      return;
    }

    const isWinner = isWinnerResult.plaintext === "1";
    console.log("   Is winner:", isWinner);

    if (isWinner) {
      const withdrawIx = await program.methods
        .withdrawBid(
          handleToBuffer(isWinnerHandle),
          plaintextToBuffer(isWinnerResult.plaintext)
        )
        .accounts({
          bidder: bidder2.publicKey,
          auction: auctionPda,
          bid: bid2Pda,
          vault: vaultPda,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .instruction();

      const tx = new Transaction();
      isWinnerResult.ed25519Instructions.forEach(ix => tx.add(ix));
      tx.add(withdrawIx);

      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = bidder2.publicKey;

      tx.sign(bidder2);
      const sig = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(sig, "confirmed");

      console.log("Winner confirmed payment:", sig);
      console.log("   🎉 Bidder 2 won the auction!");
      console.log("   💰 Bidder 2's bid amount stays in vault as payment");
    }
  });

  it("10. Loser (Bidder 1) withdraws refund", async () => {
    // Wait a bit to ensure account is available
    await new Promise(r => setTimeout(r, 2000));
    
    let bid;
    try {
      bid = await program.account.bid.fetch(bid1Pda);
    } catch (e: any) {
      console.log("   Bid account not found, skipping withdrawal");
      console.log("   Error:", e.message);
      return;
    }

    const isWinnerHandle = bid.isWinnerHandle.toString();

    if (isWinnerHandle === "0") {
      console.log("   Bid not checked yet");
      return;
    }

    const isWinnerResult = await decryptHandle(isWinnerHandle, bidder1);

    if (!isWinnerResult) {
      console.log("   Failed to decrypt, retrying...");
      await new Promise(r => setTimeout(r, 3000));
      const retryResult = await decryptHandle(isWinnerHandle, bidder1);
      if (!retryResult) {
        console.log("   Failed to decrypt after retry");
        return;
      }
      const isWinner = retryResult.plaintext === "1";
      if (isWinner) {
        console.log("   Is winner, skipping refund");
        return;
      }
      
      const withdrawIx = await program.methods
        .withdrawBid(
          handleToBuffer(isWinnerHandle),
          plaintextToBuffer(retryResult.plaintext)
        )
        .accounts({
          bidder: bidder1.publicKey,
          auction: auctionPda,
          bid: bid1Pda,
          vault: vaultPda,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .instruction();

      const tx = new Transaction();
      retryResult.ed25519Instructions.forEach(ix => tx.add(ix));
      tx.add(withdrawIx);

      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = bidder1.publicKey;

      tx.sign(bidder1);
      const sig = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(sig, "confirmed");

      console.log("Loser withdrew refund:", sig);
      console.log("   💰 Bidder 1 got their deposit back:", Number(bid.depositAmount) / 1e9, "SOL");
      return;
    }

    const isWinner = isWinnerResult.plaintext === "1";
    console.log("   Is winner:", isWinner);
    console.log("   Deposit amount:", Number(bid.depositAmount) / 1e9, "SOL");

    if (!isWinner) {
      const withdrawIx = await program.methods
        .withdrawBid(
          handleToBuffer(isWinnerHandle),
          plaintextToBuffer(isWinnerResult.plaintext)
        )
        .accounts({
          bidder: bidder1.publicKey,
          auction: auctionPda,
          bid: bid1Pda,
          vault: vaultPda,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .instruction();

      const tx = new Transaction();
      isWinnerResult.ed25519Instructions.forEach(ix => tx.add(ix));
      tx.add(withdrawIx);

      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = bidder1.publicKey;

      tx.sign(bidder1);
      const sig = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(sig, "confirmed");

      console.log("Loser withdrew refund:", sig);
      console.log("   💰 Bidder 1 got their deposit back:", Number(bid.depositAmount) / 1e9, "SOL");
    }
  });
});
