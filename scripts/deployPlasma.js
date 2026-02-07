const hre = require("hardhat");

async function main() {
  console.log("Deploying to Plasma Network...");
  console.log("Network:", hre.network.name);

  // On Plasma, we only need to deploy a mock USDC if it doesn't exist
  // In production, use the official Plasma USDC address

  console.log("\n1. Deploying Mock USDC on Plasma...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log("MockUSDC deployed to:", await usdc.getAddress());

  // Mint some USDC to deployer for testing
  const [deployer] = await hre.ethers.getSigners();
  const mintTx = await usdc.mint(deployer.address, hre.ethers.parseUnits("100000", 6));
  await mintTx.wait();
  console.log("Minted 100,000 USDC to deployer");

  console.log("\n=== Plasma Deployment Complete ===");
  console.log("USDC Address:", await usdc.getAddress());
  console.log("\nUse this address in the ResearchGraph deployment on Flare");

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    USDC: await usdc.getAddress(),
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    'deployment-plasma.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment-plasma.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
