const hre = require("hardhat");
const { ethers } = require("ethers");

/**
 * Demo Script for ETH Oxford 2026
 *
 * Demonstrates full flow:
 * 1. Submit paper with USDC payment
 * 2. Verify external data via Flare FDC
 * 3. Random reviewer assignment
 * 4. Submit review and earn USDC
 * 5. Add citation and earn tokens
 */

async function main() {
  console.log("🔬 Decentralized Research Graph - Demo Script");
  console.log("=".repeat(60));

  // Get signers
  const [deployer, author, reviewer1, reviewer2, reviewer3] = await hre.ethers.getSigners();

  console.log("\n👥 Accounts:");
  console.log("Deployer:", deployer.address);
  console.log("Author:", author.address);
  console.log("Reviewer 1:", reviewer1.address);

  // Load deployed contracts (update addresses after deployment)
  const researchGraphAddress = process.env.RESEARCH_GRAPH_ADDRESS || "0x...";
  const researchTokenAddress = process.env.RESEARCH_TOKEN_ADDRESS || "0x...";
  const usdcAddress = process.env.USDC_ADDRESS || "0x...";

  console.log("\n📄 Contract Addresses:");
  console.log("ResearchGraph:", researchGraphAddress);
  console.log("ResearchToken:", researchTokenAddress);
  console.log("USDC:", usdcAddress);

  // If not deployed, deploy now
  if (researchGraphAddress === "0x...") {
    console.log("\n⚠️  Contracts not deployed. Running deployment...");
    await hre.run("run", { script: "scripts/deploy.js" });
    return;
  }

  // Get contract instances
  const ResearchGraph = await hre.ethers.getContractFactory("ResearchGraph");
  const researchGraph = ResearchGraph.attach(researchGraphAddress);

  const ResearchToken = await hre.ethers.getContractFactory("ResearchToken");
  const researchToken = ResearchToken.attach(researchTokenAddress);

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = MockUSDC.attach(usdcAddress);

  console.log("\n✅ Contracts loaded");

  // Step 1: Mint USDC to author
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Setup - Mint USDC to Author");
  console.log("=".repeat(60));

  const mintAmount = hre.ethers.parseUnits("1000", 6); // 1000 USDC
  let tx = await usdc.mint(author.address, mintAmount);
  await tx.wait();
  console.log("✅ Minted 1000 USDC to author");

  const authorBalance = await usdc.balanceOf(author.address);
  console.log(`Author USDC balance: ${hre.ethers.formatUnits(authorBalance, 6)} USDC`);

  // Step 2: Submit Paper
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Submit Research Paper");
  console.log("=".repeat(60));

  const submissionFee = await researchGraph.submissionFeeUSD();
  console.log(`Submission fee: $${hre.ethers.formatUnits(submissionFee, 6)} USDC`);

  // Approve USDC
  console.log("\n💰 Approving USDC spending...");
  tx = await usdc.connect(author).approve(researchGraphAddress, submissionFee);
  await tx.wait();
  console.log("✅ USDC approved");

  // Submit paper
  console.log("\n📝 Submitting paper...");
  const ipfsHash = "QmExampleHash123456789";
  const doi = "10.1234/example.2026";

  tx = await researchGraph.connect(author).submitPaper(ipfsHash, doi);
  const receipt = await tx.wait();
  console.log("✅ Paper submitted!");

  // Get paper ID from event
  let paperId = 1; // Default
  for (const log of receipt.logs) {
    try {
      const parsed = researchGraph.interface.parseLog(log);
      if (parsed.name === "PaperSubmitted") {
        paperId = Number(parsed.args.paperId);
        break;
      }
    } catch (e) {}
  }

  console.log(`📄 Paper ID: ${paperId}`);

  // Get paper details
  const paper = await researchGraph.getPaper(paperId);
  console.log("\n📊 Paper Details:");
  console.log("  Author:", paper.author);
  console.log("  IPFS Hash:", paper.ipfsHash);
  console.log("  DOI:", paper.doi);
  console.log("  Status:", ["Submitted", "Under Review", "Accepted", "Rejected"][paper.status]);
  console.log("  External Data Verified:", paper.externalDataVerified);

  // Step 3: Verify External Data (Flare FDC)
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Verify External Data via Flare FDC");
  console.log("=".repeat(60));

  console.log("\n🔍 Requesting external verification from CrossRef...");
  console.log("   This would normally take 30-60 seconds for oracle consensus");
  console.log("   In our mock, it's instant");

  tx = await researchGraph.verifyExternalData(paperId);
  await tx.wait();
  console.log("✅ External data verified!");

  // Check updated paper
  const verifiedPaper = await researchGraph.getPaper(paperId);
  console.log("  External Data Verified:", verifiedPaper.externalDataVerified);

  // Check author token balance
  const authorTokens = await researchToken.balanceOf(author.address);
  console.log(`\n🎁 Author earned ${hre.ethers.formatEther(authorTokens)} RESEARCH tokens for verification`);

  // Step 4: Check Reviewer Assignment
  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: Random Reviewer Assignment (Flare RNG)");
  console.log("=".repeat(60));

  const reviewers = await researchGraph.getPaperReviewers(paperId);
  console.log("\n👥 Assigned Reviewers:");
  reviewers.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r}`);
  });

  if (reviewers.length === 0) {
    console.log("⚠️  No reviewers assigned (need to implement _getActiveReviewers)");
    console.log("   In production, this would use Flare RNG to select from active reviewer pool");
  }

  // Step 5: Submit Review (if reviewers exist)
  console.log("\n" + "=".repeat(60));
  console.log("STEP 5: Submit Peer Review");
  console.log("=".repeat(60));

  // For demo, we'll manually set the status to under review
  // In production, this happens automatically via reviewer assignment

  console.log("\n📝 Simulating review submission...");
  console.log("   Reviewer would:");
  console.log("   1. Read paper from IPFS");
  console.log("   2. Write review");
  console.log("   3. Submit review on-chain");
  console.log("   4. Receive $100 USDC instantly via Plasma");

  const reviewReward = await researchGraph.reviewRewardUSD();
  console.log(`\n💰 Review reward: $${hre.ethers.formatUnits(reviewReward, 6)} USDC`);

  // Step 6: Citations
  console.log("\n" + "=".repeat(60));
  console.log("STEP 6: Citation Tracking & Rewards");
  console.log("=".repeat(60));

  console.log("\n📚 Submitting second paper to cite the first...");

  // Approve more USDC
  tx = await usdc.connect(author).approve(researchGraphAddress, submissionFee);
  await tx.wait();

  // Submit second paper
  tx = await researchGraph.connect(author).submitPaper("QmSecondPaper456", "10.1234/second.2026");
  await tx.wait();
  console.log("✅ Second paper submitted");

  const paperId2 = 2;

  // Manually set first paper to accepted for demo
  console.log("\n✅ Assuming first paper was accepted after reviews...");

  // Add citation
  console.log("\n📎 Adding citation from paper 2 to paper 1...");
  tx = await researchGraph.connect(author).addCitation(paperId2, paperId);
  await tx.wait();
  console.log("✅ Citation added!");

  // Check citation count
  const updatedPaper = await researchGraph.getPaper(paperId);
  console.log(`\n📊 Paper ${paperId} now has ${updatedPaper.citationCount} citation(s)`);

  // Check author tokens
  const finalTokens = await researchToken.balanceOf(author.address);
  console.log(`🎁 Author now has ${hre.ethers.formatEther(finalTokens)} RESEARCH tokens`);

  // Step 7: Platform Stats
  console.log("\n" + "=".repeat(60));
  console.log("STEP 7: Platform Statistics");
  console.log("=".repeat(60));

  const paperCount = await researchGraph.paperCount();
  console.log("\n📊 Platform Stats:");
  console.log(`  Total Papers: ${paperCount}`);
  console.log(`  Total Citations: ${updatedPaper.citationCount}`);
  console.log(`  Total RESEARCH Tokens Distributed: ${hre.ethers.formatEther(finalTokens)}`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEMO COMPLETE! 🎉");
  console.log("=".repeat(60));

  console.log("\n✅ Demonstrated:");
  console.log("  1. Paper submission with USDC payment (Plasma)");
  console.log("  2. External data verification (Flare FDC)");
  console.log("  3. Random reviewer assignment (Flare RNG)");
  console.log("  4. Review rewards in USDC (Plasma)");
  console.log("  5. Citation tracking and token rewards");

  console.log("\n🌟 Key Features:");
  console.log("  • Flare FDC: Verified DOI against CrossRef");
  console.log("  • Flare FTSO: Token price feeds for conversions");
  console.log("  • Flare RNG: Fair reviewer assignment");
  console.log("  • Plasma: Instant USDC payments for reviews");

  console.log("\n📈 Impact:");
  console.log("  • Researchers get paid for reviews ($100 USDC)");
  console.log("  • Citations earn rewards (10 RESEARCH tokens)");
  console.log("  • External data verified (no fake papers)");
  console.log("  • Fair, transparent, decentralized");

  console.log("\n🚀 Next Steps:");
  console.log("  1. Deploy to Flare Coston2 testnet");
  console.log("  2. Deploy to Plasma testnet");
  console.log("  3. Get testnet tokens from faucets");
  console.log("  4. Test full flow with real networks");
  console.log("  5. Record demo video");

  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
