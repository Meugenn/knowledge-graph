const { ethers } = require('ethers');

async function test() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const address = '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82';
  
  console.log('Testing contract at:', address);
  
  // Check if contract exists
  const code = await provider.getCode(address);
  
  if (code === '0x') {
    console.log('❌ No contract at this address!');
    console.log('\nThe blockchain might have restarted.');
    console.log('You need to redeploy contracts.');
  } else {
    console.log('✅ Contract exists!');
    console.log('Code length:', code.length, 'bytes');
  }
}

test().catch(console.error);
