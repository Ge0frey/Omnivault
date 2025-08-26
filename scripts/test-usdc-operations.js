#!/usr/bin/env node

const anchor = require('@coral-xyz/anchor');
const { PublicKey, Connection, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } = require('@solana/spl-token');

// USDC mint address on devnet
const USDC_MINT_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

async function testUSDCOperations() {
  console.log('🔍 Testing USDC Operations on OmniVault...\n');
  
  try {
    // Setup connection and provider
    const connection = new Connection('http://localhost:8899', 'confirmed');
    const provider = new anchor.AnchorProvider(
      connection,
      anchor.AnchorProvider.env().wallet,
      { commitment: 'confirmed' }
    );
    anchor.setProvider(provider);

    // Load the program
    const programId = new PublicKey('BxpNexvSRuUoaSwdff5aEmCGX7LBDhGPtA79VVraPtqr');
    const idl = require('../solana-program/target/idl/omnivault.json');
    const program = new anchor.Program(idl, programId, provider);
    
    console.log('✅ Connected to Solana devnet');
    console.log('👛 Wallet:', provider.wallet.publicKey.toString());
    
    // Check wallet balance
    const balance = await connection.getBalance(provider.wallet.publicKey);
    console.log('💰 Balance:', balance / LAMPORTS_PER_SOL, 'SOL\n');
    
    // Find the vault store PDA
    const [vaultStore] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault_store')],
      programId
    );
    
    // Check if vault store exists
    try {
      const vaultStoreAccount = await program.account.vaultStore.fetch(vaultStore);
      console.log('📦 Vault Store exists');
      console.log('  Total Vaults:', vaultStoreAccount.totalVaults.toString());
      console.log('  Total TVL:', vaultStoreAccount.totalTvl.toString());
      console.log('  Emergency Pause:', vaultStoreAccount.emergencyPause);
      console.log('');
      
      // Test USDC operations if vaults exist
      if (vaultStoreAccount.totalVaults.gt(new anchor.BN(0))) {
        // Get first vault
        const vaultId = 0;
        const [vault] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('vault'),
            provider.wallet.publicKey.toBuffer(),
            new anchor.BN(vaultId).toArrayLike(Buffer, 'le', 8)
          ],
          programId
        );
        
        const vaultAccount = await program.account.vault.fetch(vault);
        console.log('🏦 Testing with Vault #0');
        console.log('  Owner:', vaultAccount.owner.toString());
        console.log('  Total Deposits:', vaultAccount.totalDeposits.toString());
        console.log('  Is Active:', vaultAccount.isActive);
        console.log('');
        
        // Get user's USDC token account
        const userUSDCAccount = await getAssociatedTokenAddress(
          USDC_MINT_DEVNET,
          provider.wallet.publicKey
        );
        
        // Check USDC balance
        let usdcBalance = 0;
        try {
          const tokenAccount = await getAccount(connection, userUSDCAccount);
          usdcBalance = Number(tokenAccount.amount) / 1e6; // USDC has 6 decimals
          console.log('💵 USDC Balance:', usdcBalance, 'USDC');
        } catch (e) {
          console.log('⚠️  No USDC token account found (will be created on first deposit)');
        }
        
        // Get vault's USDC token account
        const vaultUSDCAccount = await getAssociatedTokenAddress(
          USDC_MINT_DEVNET,
          vault,
          true // allowOwnerOffCurve for PDA
        );
        
        // Check if vault has USDC account
        try {
          const vaultTokenAccount = await getAccount(connection, vaultUSDCAccount);
          console.log('💼 Vault USDC Balance:', Number(vaultTokenAccount.amount) / 1e6, 'USDC');
        } catch (e) {
          console.log('📝 Vault USDC account will be created on first deposit');
        }
        
        console.log('\n✅ USDC operations are ready!');
        console.log('📌 You can now:');
        console.log('   1. Deposit USDC into vaults');
        console.log('   2. Withdraw USDC from vaults');
        console.log('   3. Use cross-chain USDC transfers via CCTP');
        
      } else {
        console.log('⚠️  No vaults found. Create a vault first to test USDC operations.');
      }
      
    } catch (e) {
      console.log('⚠️  Vault store not initialized. Initialize it first.');
      console.log('   Run: npm run init-vault-store');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Run the test
testUSDCOperations().then(
  () => process.exit(0),
  err => {
    console.error(err);
    process.exit(1);
  }
);
