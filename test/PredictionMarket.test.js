const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictionMarket (LMSR)", function () {
  let market, token, owner, alice, bob;
  const WAD = 10n ** 18n;
  const B = 100n * WAD; // liquidity parameter: 100 WAD

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    // Deploy ResearchToken — owner gets 10M initial supply
    const Token = await ethers.getContractFactory("ResearchToken");
    token = await Token.deploy();
    await token.waitForDeployment();

    // Transfer tokens from owner to alice and bob
    await token.transfer(alice.address, ethers.parseEther("100000"));
    await token.transfer(bob.address, ethers.parseEther("100000"));

    // Deploy LMSR market
    const Market = await ethers.getContractFactory("PredictionMarket");
    market = await Market.deploy(await token.getAddress());
    await market.waitForDeployment();

    // Approve market to spend tokens
    const marketAddr = await market.getAddress();
    await token.connect(alice).approve(marketAddr, ethers.parseEther("100000"));
    await token.connect(bob).approve(marketAddr, ethers.parseEther("100000"));
  });

  it("should create a market with liquidity parameter b", async function () {
    await market.createMarket(1, "Will transformers dominate?", 86400, B);
    const m = await market.getMarket(1);
    expect(m.paperId).to.equal(1);
    expect(m.resolved).to.be.false;
    expect(m.b).to.equal(B);
  });

  it("should return 50% price for empty market", async function () {
    await market.createMarket(1, "Test?", 86400, B);
    const price = await market.getYesPrice(1);
    // 0.5 WAD
    expect(price).to.equal(WAD / 2n);
  });

  it("should allow buying YES shares", async function () {
    await market.createMarket(1, "Test?", 86400, B);
    const shares = 10n * WAD;
    await market.connect(alice).buyYes(1, shares);
    const pos = await market.getUserPosition(1, alice.address);
    expect(pos.yesShares).to.equal(shares);
  });

  it("should allow buying NO shares", async function () {
    await market.createMarket(1, "Test?", 86400, B);
    const shares = 10n * WAD;
    await market.connect(bob).buyNo(1, shares);
    const pos = await market.getUserPosition(1, bob.address);
    expect(pos.noShares).to.equal(shares);
  });

  it("should move price after YES purchase", async function () {
    await market.createMarket(1, "Test?", 86400, B);
    const priceBefore = await market.getYesPrice(1);
    await market.connect(alice).buyYes(1, 50n * WAD);
    const priceAfter = await market.getYesPrice(1);
    expect(priceAfter).to.be.gt(priceBefore);
  });

  it("should resolve market", async function () {
    await market.createMarket(1, "Test?", 86400, B);
    await market.connect(alice).buyYes(1, 10n * WAD);
    await market.resolveMarket(1, true);
    const m = await market.getMarket(1);
    expect(m.resolved).to.be.true;
    expect(m.outcome).to.be.true;
  });

  it("should reject buying on resolved market", async function () {
    await market.createMarket(1, "Test?", 86400, B);
    await market.resolveMarket(1, true);
    await expect(market.connect(alice).buyYes(1, 10n * WAD)).to.be.revertedWith("Market already resolved");
  });

  it("should reject double resolution", async function () {
    await market.createMarket(1, "Test?", 86400, B);
    await market.resolveMarket(1, true);
    await expect(market.resolveMarket(1, false)).to.be.revertedWith("Already resolved");
  });
});
