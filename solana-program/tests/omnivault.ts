import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Omnivault } from "../target/types/omnivault";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("OmniVault", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.omnivault as Program<Omnivault>;
  
  // Test accounts
  let vaultStore: PublicKey;
  let authority: Keypair;

  before(async () => {
    // Generate keypairs
    authority = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(authority.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );

    // Find PDA for vault store
    [vaultStore] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_store")],
      program.programId
    );
  });

  it("Initializes the vault store", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        vaultStore,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    console.log("Initialize transaction signature:", tx);

    // Verify vault store was created correctly
    const vaultStoreAccount = await program.account.vaultStore.fetch(vaultStore);
    expect(vaultStoreAccount.authority.toString()).to.equal(authority.publicKey.toString());
    expect(vaultStoreAccount.totalVaults.toNumber()).to.equal(0);
    expect(vaultStoreAccount.totalTvl.toNumber()).to.equal(0);
    expect(vaultStoreAccount.feeRate).to.equal(100); // 1%
    expect(vaultStoreAccount.emergencyPause).to.equal(false);
    console.log("✅ Vault store initialized successfully");
  });

  it("Creates a new vault", async () => {
    // Find PDA for vault (vault ID will be 0)
    const [vault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        authority.publicKey.toBuffer(),
        new anchor.BN(0).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    // Find PDA for yield tracker
    const [yieldTracker] = PublicKey.findProgramAddressSync(
      [Buffer.from("yield_tracker"), vault.toBuffer()],
      program.programId
    );

    const riskProfile = { conservative: {} };
    const minDeposit = new anchor.BN(1 * 10**9); // 1 token
    const targetChains = [101, 110]; // Ethereum and Arbitrum

    const tx = await program.methods
      .createVault(riskProfile, minDeposit, targetChains)
      .accounts({
        vault,
        yieldTracker,
        vaultStore,
        owner: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    console.log("Create vault transaction signature:", tx);

    // Verify vault was created correctly
    const vaultAccount = await program.account.vault.fetch(vault);
    expect(vaultAccount.id.toNumber()).to.equal(0);
    expect(vaultAccount.owner.toString()).to.equal(authority.publicKey.toString());
    expect(vaultAccount.riskProfile).to.deep.equal(riskProfile);
    expect(vaultAccount.totalDeposits.toNumber()).to.equal(0);
    expect(vaultAccount.minDeposit.toNumber()).to.equal(minDeposit.toNumber());
    expect(vaultAccount.isActive).to.equal(true);
    expect(vaultAccount.targetChains).to.deep.equal(targetChains);

    // Verify yield tracker was created
    const yieldTrackerAccount = await program.account.yieldTracker.fetch(yieldTracker);
    expect(yieldTrackerAccount.vault.toString()).to.equal(vault.toString());
    expect(yieldTrackerAccount.chainYields).to.be.empty;
    expect(yieldTrackerAccount.queryNonce.toNumber()).to.equal(0);

    // Verify vault store was updated
    const vaultStoreAccount = await program.account.vaultStore.fetch(vaultStore);
    expect(vaultStoreAccount.totalVaults.toNumber()).to.equal(1);
    
    console.log("✅ Vault created successfully");
  });

  it("Updates vault configuration", async () => {
    // Find the vault we created
    const [vault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        authority.publicKey.toBuffer(),
        new anchor.BN(0).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    const newMinDeposit = new anchor.BN(2 * 10**9); // 2 tokens
    const newActiveStatus = true;
    const newRebalanceThreshold = new anchor.BN(200); // 2%
    const newTargetChains = [101, 110, 109]; // Add Polygon

    const tx = await program.methods
      .updateVaultConfig(
        newMinDeposit,
        newActiveStatus,
        newRebalanceThreshold,
        newTargetChains
      )
      .accounts({
        vault,
        owner: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log("Update vault config transaction signature:", tx);

    // Verify vault configuration was updated
    const vaultAccount = await program.account.vault.fetch(vault);
    expect(vaultAccount.minDeposit.toNumber()).to.equal(newMinDeposit.toNumber());
    expect(vaultAccount.isActive).to.equal(newActiveStatus);
    expect(vaultAccount.rebalanceThreshold.toNumber()).to.equal(newRebalanceThreshold.toNumber());
    expect(vaultAccount.targetChains).to.deep.equal(newTargetChains);
    
    console.log("✅ Vault configuration updated successfully");
  });

  it("Handles emergency pause and resume", async () => {
    // Emergency pause
    const pauseTx = await program.methods
      .emergencyPause()
      .accounts({
        vaultStore,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log("Emergency pause transaction signature:", pauseTx);

    // Verify emergency pause was activated
    let vaultStoreAccount = await program.account.vaultStore.fetch(vaultStore);
    expect(vaultStoreAccount.emergencyPause).to.equal(true);
    console.log("✅ Emergency pause activated");

    // Resume operations
    const resumeTx = await program.methods
      .resumeOperations()
      .accounts({
        vaultStore,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log("Resume operations transaction signature:", resumeTx);

    // Verify operations were resumed
    vaultStoreAccount = await program.account.vaultStore.fetch(vaultStore);
    expect(vaultStoreAccount.emergencyPause).to.equal(false);
    console.log("✅ Operations resumed successfully");
  });
});
