const { ethers } = require('ethers');

async function test() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const contractAddress = '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82';
  
  // Try to call submissionFeeUSD()
  const abi = ['function submissionFeeUSD() external view returns (uint256)'];
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  try {
    const fee = await contract.submissionFeeUSD();
    console.log('✅ Contract call successful!');
    console.log('Submission fee:', ethers.formatUnits(fee, 6), 'USDC');
  } catch (error) {
    console.log('❌ Contract call failed!');
    console.log('Error:', error.message);
  }
}

test().catch(console.error);
