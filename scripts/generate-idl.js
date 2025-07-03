const fs = require('fs');
const path = require('path');

// Possible paths for the IDL file
const idlPaths = [
  path.join(__dirname, '../solana-program/target/idl/omnivault.json'),
  path.join(__dirname, '../solana-program/target/types/omnivault.json')
];
const outputPath = path.join(__dirname, '../frontend/src/idl/omnivault.ts');

// Read the IDL JSON file
try {
  let idlPath;
  for (const possiblePath of idlPaths) {
    if (fs.existsSync(possiblePath)) {
      idlPath = possiblePath;
      break;
    }
  }

  if (!idlPath) {
    console.error('IDL file not found in any of these locations:');
    idlPaths.forEach(p => console.error(`- ${p}`));
    console.error('Please run "anchor build" first to generate the IDL');
    process.exit(1);
  }

  console.log(`Found IDL file at ${idlPath}`);
  const idlJson = fs.readFileSync(idlPath, 'utf8');
  const idl = JSON.parse(idlJson);
  
  // Create TypeScript file content
  const tsContent = `// This file is auto-generated from the IDL
// Do not edit manually

export type OmnivaultIDL = ${JSON.stringify(idl, null, 2)};

export const OmnivaultIDL: OmnivaultIDL = ${JSON.stringify(idl, null, 2)};

export const IDL: OmnivaultIDL = OmnivaultIDL;
`;

  // Create the output directory if it doesn't exist
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the TypeScript file
  fs.writeFileSync(outputPath, tsContent);
  console.log(`✅ IDL TypeScript file generated at ${outputPath}`);
  console.log(`📋 Program ID: ${idl.metadata?.address || 'Not found'}`);
  console.log(`🏗️  Instructions: ${idl.instructions?.length || 0}`);
  console.log(`📊 Accounts: ${idl.accounts?.length || 0}`);
} catch (error) {
  console.error('❌ Error generating IDL TypeScript file:', error.message);
  process.exit(1);
} 