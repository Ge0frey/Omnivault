#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Generating IDL and copying to frontend...');

// Build the Anchor program first
const { execSync } = require('child_process');

try {
  console.log('📦 Building Anchor program...');
  execSync('cd ../solana-program && anchor build', { stdio: 'inherit' });
  
  console.log('📋 Copying IDL files to frontend...');
  
  // Source paths
  const sourceIdlPath = path.join(__dirname, '../solana-program/target/idl/omnivault.json');
  const sourceTypesPath = path.join(__dirname, '../solana-program/target/types/omnivault.ts');
  
  // Destination paths
  const destIdlPath = path.join(__dirname, '../frontend/src/idl/omnivault.json');
  const destTypesPath = path.join(__dirname, '../frontend/src/idl/omnivault.ts');
  
  // Ensure destination directory exists
  const destDir = path.join(__dirname, '../frontend/src/idl');
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copy files
  fs.copyFileSync(sourceIdlPath, destIdlPath);
  fs.copyFileSync(sourceTypesPath, destTypesPath);
  
  console.log('✅ IDL and types copied successfully!');
  console.log(`   - IDL: ${destIdlPath}`);
  console.log(`   - Types: ${destTypesPath}`);
  
} catch (error) {
  console.error('❌ Error generating IDL:', error.message);
  process.exit(1);
} 