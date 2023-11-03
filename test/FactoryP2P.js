const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { eth } = require("web3");
const P2PABI = require("./../ABIs/P2PABI.json");

describe("Factor P2PDEX", function () {
  async function deployContractsFixture() {
    const [owner, otherAccount, otherAccount2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("FLTokenV2");
    const token = await Token.deploy(
      "Pikake",
      "PK",
      1000000,
      owner.address,
      18
    );

    const decimals = await token.decimals();

    const LiquidityPool = await ethers.getContractFactory("LPImplementation");
    const liquidityPool = await LiquidityPool.deploy(token.target, owner);

    const eth_amount = "10";
    const token_amount = BigInt(10000) * BigInt(10) ** decimals;
    const eth_amount_wei = ethers.parseEther(eth_amount);

    await token.connect(owner).approve(liquidityPool.target, token_amount);
    await liquidityPool.connect(owner).initializePool(token_amount, {
      value: eth_amount_wei,
    });

    const P2PFactory = await ethers.getContractFactory(
      "TokenExchangeP2PFactory"
    );

    const p2pfactory = await P2PFactory.deploy();

    return {
      token,
      liquidityPool,
      owner,
      otherAccount,
      p2pfactory,
      otherAccount2,
      decimals,
    };
  }

  describe("Create P2P", function () {
    it("Should deploy a P2P contract", async function () {
      const { owner, p2pfactory, otherAccount, liquidityPool } =
        await loadFixture(deployContractsFixture);

      await p2pfactory.createTokenExchangeP2P(liquidityPool.target);
      arrayP2P = await p2pfactory.getDeployedExchanges();

      expect(arrayP2P.length).to.equal(1);
    });

    it("Should interact with P2P contract created", async function () {
      const { owner, p2pfactory, otherAccount, liquidityPool, token } =
        await loadFixture(deployContractsFixture);

      await p2pfactory.createTokenExchangeP2P(liquidityPool.target);
      arrayP2P = await p2pfactory.getDeployedExchanges();

      const P2PContract = new ethers.Contract(
        arrayP2P[0],
        P2PABI,
        ethers.provider
      );
      tokenAddress = await P2PContract.getTokenAddress();
      expect(tokenAddress).to.equal(token.target);
    });

    it("Should create an offer with P2P contract created", async function () {
      const { owner, p2pfactory, liquidityPool } = await loadFixture(
        deployContractsFixture
      );

      eth_amount = "0.8";
      eth_amount_wei = ethers.parseEther(eth_amount);

      await p2pfactory.createTokenExchangeP2P(liquidityPool.target);
      arrayP2P = await p2pfactory.getDeployedExchanges();

      const P2PContract = new ethers.Contract(
        arrayP2P[0],
        P2PABI,
        ethers.provider
      );

      await P2PContract.connect(owner).createOfferBuyTokens({
        value: eth_amount_wei,
      });
      [seller, tokenAmount, etherAmount, status] =
        await P2PContract.getOfferBuyTokensById(0);

      expect(status).to.equal(1);
      expect(seller).to.equal(owner.address);
    });

    it("Should deploy a P2P contract by other user (not owner)", async function () {
      const { p2pfactory, otherAccount, liquidityPool } = await loadFixture(
        deployContractsFixture
      );

      await p2pfactory
        .connect(otherAccount)
        .createTokenExchangeP2P(liquidityPool.target);
      arrayP2P = await p2pfactory.getDeployedExchanges();

      expect(arrayP2P.length).to.equal(1);
    });

    it("Shouldn't deploy a P2P if is existing", async function () {
        const { p2pfactory, otherAccount, liquidityPool } = await loadFixture(
          deployContractsFixture
        );
  
        await p2pfactory
          .connect(otherAccount)
          .createTokenExchangeP2P(liquidityPool.target);
        arrayP2P = await p2pfactory.getDeployedExchanges();
  
        expect(arrayP2P.length).to.equal(1);

        await expect(p2pfactory.createTokenExchangeP2P(liquidityPool.target)).to.be.revertedWith("P2P already created")
      });
    
  });
});
