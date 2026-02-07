const hre = require("hardhat");

async function main() {
  console.log("Deploying Decentralized Research Graph to Flare...");

  // Deploy Mock contracts for testing (replace with real addresses on mainnet)
  console.log("\n1. Deploying Mock Flare Contracts...");
  const MockFtsoRegistry = await hre.ethers.getContractFactory("MockFtsoRegistry");
  const ftsoRegistry = await MockFtsoRegistry.deploy();
  await ftsoRegistry.waitForDeployment();
  console.log("MockFtsoRegistry deployed to:", await ftsoRegistry.getAddress());

  const MockFlareDataConnector = await hre.ethers.getContractFactory("MockFlareDataConnector");
  const fdcHub = await MockFlareDataConnector.deploy();
  await fdcHub.waitForDeployment();
  console.log("MockFlareDataConnector deployed to:", await fdcHub.getAddress());

  const MockRandomProvider = await hre.ethers.getContractFactory("MockRandomProvider");
  const randomProvider = await MockRandomProvider.deploy();
  await randomProvider.waitForDeployment();
  console.log("MockRandomProvider deployed to:", await randomProvider.getAddress());

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log("MockUSDC deployed to:", await usdc.getAddress());

  // Deploy Research Token
  console.log("\n2. Deploying Research Token...");
  const ResearchToken = await hre.ethers.getContractFactory("ResearchToken");
  const researchToken = await ResearchToken.deploy();
  await researchToken.waitForDeployment();
  console.log("ResearchToken deployed to:", await researchToken.getAddress());

  // Deploy Research Graph
  console.log("\n3. Deploying Research Graph...");
  const ResearchGraph = await hre.ethers.getContractFactory("ResearchGraph");
  const researchGraph = await ResearchGraph.deploy(
    await researchToken.getAddress(),
    await usdc.getAddress(),
    await ftsoRegistry.getAddress(),
    await fdcHub.getAddress(),
    await randomProvider.getAddress()
  );
  await researchGraph.waitForDeployment();
  console.log("ResearchGraph deployed to:", await researchGraph.getAddress());

  // Setup: Add ResearchGraph as minter for ResearchToken
  console.log("\n4. Setting up permissions...");
  const tx = await researchToken.addMinter(await researchGraph.getAddress());
  await tx.wait();
  console.log("ResearchGraph added as minter");

  // Mint some USDC to deployer for testing
  const [deployer] = await hre.ethers.getSigners();
  const mintTx = await usdc.mint(deployer.address, hre.ethers.parseUnits("10000", 6));
  await mintTx.wait();
  console.log("\n5. Minted 10,000 USDC to deployer for testing");

  console.log("\n=== Deployment Complete ===");
  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log("ResearchToken:", await researchToken.getAddress());
  console.log("ResearchGraph:", await researchGraph.getAddress());
  console.log("MockUSDC:", await usdc.getAddress());
  console.log("FtsoRegistry:", await ftsoRegistry.getAddress());
  console.log("FDC Hub:", await fdcHub.getAddress());
  console.log("Random Provider:", await randomProvider.getAddress());

  console.log("\n=== Next Steps ===");
  console.log("1. Update frontend/.env with these addresses");
  console.log("2. Approve USDC spending: usdc.approve(researchGraph.address, amount)");
  console.log("3. Submit a paper: researchGraph.submitPaper(ipfsHash, doi)");

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    ResearchToken: await researchToken.getAddress(),
    ResearchGraph: await researchGraph.getAddress(),
    MockUSDC: await usdc.getAddress(),
    FtsoRegistry: await ftsoRegistry.getAddress(),
    FDCHub: await fdcHub.getAddress(),
    RandomProvider: await randomProvider.getAddress(),
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    'deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
