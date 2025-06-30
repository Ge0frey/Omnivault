#!/bin/bash

# OmniVault Deployment Script
# This script builds and deploys the OmniVault program to Solana devnet

set -e

echo "🚀 Starting OmniVault deployment..."

# Change to the solana-program directory
cd "$(dirname "$0")/../solana-program"

echo "📦 Building the program..."
anchor build

echo "🌐 Deploying to Solana devnet..."
solana program deploy target/deploy/omnivault.so \
  --program-id target/deploy/omnivault-keypair.json \
  --url devnet

echo "📋 Generating IDL TypeScript file..."
cd ../scripts
node generate-idl.js

echo "✅ Deployment completed successfully!"
echo "📍 Program ID: HAGPttZ592S5xv5TPrkVLPQpkNGrNPAw42kGjdR9vUc4"
echo "🌐 Network: Solana Devnet"
echo "🔗 Explorer: https://explorer.solana.com/address/HAGPttZ592S5xv5TPrkVLPQpkNGrNPAw42kGjdR9vUc4?cluster=devnet" 