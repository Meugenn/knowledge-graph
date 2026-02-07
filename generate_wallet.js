const { Wallet } = require('ethers');

// Generate a new random wallet
const wallet = Wallet.createRandom();

console.log('\n🎉 New Wallet Generated!\n');
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('\n⚠️  SAVE THIS PRIVATE KEY SECURELY!');
console.log('⚠️  This is a TEST wallet for hackathon only.\n');
console.log('📋 Copy the private key WITHOUT the 0x prefix for .env\n');
