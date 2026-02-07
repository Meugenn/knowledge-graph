const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking wallet balance...\n");

  const [deployer] = await hre.ethers.getSigners();
  const address = await deployer.getAddress();

  console.log("Wallet Address:", address);

  // Check Flare Coston2 balance
  try {
    const provider = new hre.ethers.JsonRpcProvider(
      "https://coston2-api.flare.network/ext/C/rpc"
    );
    const balance = await provider.getBalance(address);
    const balanceInFLR = hre.ethers.formatEther(balance);

    console.log("\n💰 Flare Coston2 Testnet:");
    console.log(`   Balance: ${balanceInFLR} C2FLR`);

    if (parseFloat(balanceInFLR) > 0) {
      console.log("   ✅ You have tokens! Ready to deploy.");
    } else {
      console.log("   ❌ No tokens yet. Visit: https://faucet.flare.network/coston2");
    }
  } catch (error) {
    console.log("   ⚠️  Could not connect to Flare testnet");
  }

  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
