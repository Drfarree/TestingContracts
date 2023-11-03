const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { eth } = require("web3");

describe("P2PDEX implementation", function () {
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

    const LiquidityPool = await ethers.getContractFactory("LPImplementation");
    const liquidityPool = await LiquidityPool.deploy(token.target, owner);

    const decimals = await token.decimals();

    const P2PDEX = await ethers.getContractFactory("TokenExchangeP2P");
    const p2pdex = await P2PDEX.deploy(liquidityPool.target);

    return {
      token,
      liquidityPool,
      owner,
      otherAccount,
      decimals,
      p2pdex,
      otherAccount2,
    };
  }

  describe("Deployment", function () {
    it("Should deploy P2PDEX smart contract", async function () {
      const { owner, p2pdex, token } = await loadFixture(
        deployContractsFixture
      );
      tokenAddress = await p2pdex.getTokenAddress();
      expect(tokenAddress).to.equal(token.target);
    });
  });

  describe("Initiallize LP to use P2PDEX", function () {
    let otherAccount2;
    let otherAccount;
    let p2pdex;
    let owner;
    let token;
    let liquidityPool;
    let decimals;

    beforeEach(async function () {
      const {
        otherAccount2: _otherAccount2,
        owner: _owner,
        otherAccount: _otherAccount,
        p2pdex: _p2pdex,
        liquidityPool: _liquidityPool,
        token: _token,
        decimals: _decimals,
      } = await loadFixture(deployContractsFixture);

      (otherAccount2 = _otherAccount2),
        (owner = _owner),
        (otherAccount = _otherAccount),
        (liquidityPool = _liquidityPool),
        (p2pdex = _p2pdex),
        (token = _token),
        (decimals = _decimals);

      const eth_amount = "10";
      const token_amount = BigInt(10000) * BigInt(10) ** decimals;
      const eth_amount_wei = ethers.parseEther(eth_amount);

      await token.connect(owner).approve(liquidityPool.target, token_amount);
      await liquidityPool.connect(owner).initializePool(token_amount, {
        value: eth_amount_wei,
      });

      const [_tokens, _ether] = await liquidityPool.getPoolBalance();
      expect(_tokens).to.equal(token_amount);
      expect(_ether).to.equal(eth_amount_wei);
    });

    describe("Test create sell token offer function", function () {
      it("Should create an offer", async function () {
        offer_amount = BigInt(10) * BigInt(10) ** decimals;
        await token.approve(p2pdex.target, offer_amount);
        await p2pdex.createOfferToken(offer_amount);

        arrayOffers = await p2pdex.getOffers();
        expect(arrayOffers.length).to.equal(1);
        [seller, tokenAmount, etherAmount, status] = await p2pdex.getOfferById(
          0
        );
        expect(seller).to.equal(owner.address);
        expect(tokenAmount).to.equal(offer_amount);
        expect(status).to.equal(1);
      });

      it("Should approve a offer created", async function () {
        offer_amount = BigInt(10) * BigInt(10) ** decimals;
        await token.approve(p2pdex.target, offer_amount);
        await p2pdex.createOfferToken(offer_amount);
        [seller, tokenAmount, etherAmount, status] = await p2pdex.getOfferById(
          0
        );

        await p2pdex
          .connect(otherAccount)
          .completeTradeToken(0, { value: etherAmount });
        [seller, tokenAmount, etherAmount, status] = await p2pdex.getOfferById(
          0
        );
        // Status 2 --> Offer confirmed
        expect(status).to.equal(2);

        balance = await token.connect(otherAccount).balanceOf(otherAccount);
        expect(balance).to.equal(tokenAmount);
      });

      it("Can't confirm an offert already confirmed", async function () {
        offer_amount = BigInt(10) * BigInt(10) ** decimals;
        await token.approve(p2pdex.target, offer_amount);
        await p2pdex.connect(owner).createOfferToken(offer_amount);
        [seller, tokenAmount, etherAmount, status] = await p2pdex.getOfferById(
          0
        );
        await p2pdex
          .connect(otherAccount)
          .completeTradeToken(0, { value: etherAmount });

        await expect(
          p2pdex.connect(owner).completeTradeToken(0, { value: etherAmount })
        ).to.be.revertedWith("Offer is not active");
      });

      it("Shouldn't confirm an offert with invalid ID", async function () {
        offer_amount = BigInt(10) * BigInt(10) ** decimals;
        await token.approve(p2pdex.target, offer_amount);
        await p2pdex.connect(owner).createOfferToken(offer_amount);
        await expect(
          p2pdex.connect(owner).completeTradeToken(1, { value: etherAmount })
        ).to.be.revertedWith("Invalid offer ID");
      });

      it("Should create an offer by other user (not owner)", async function () {
        offer_amount = BigInt(10) * BigInt(10) ** decimals;
        await token.transfer(otherAccount, offer_amount);

        await token.connect(otherAccount).approve(p2pdex.target, offer_amount);

        await p2pdex.connect(otherAccount).createOfferToken(offer_amount);

        [seller, tokenAmount, etherAmount, status] = await p2pdex.getOfferById(
          0
        );

        expect(seller).to.equal(otherAccount.address);
        await p2pdex
          .connect(otherAccount2)
          .completeTradeToken(0, { value: etherAmount });

        [seller, tokenAmount, etherAmount, status] = await p2pdex.getOfferById(
          0
        );

        expect(status).to.equal(2);
      });

      it("Should cancel an offert created by himself", async function () {
        offer_amount = BigInt(10) * BigInt(10) ** decimals;
        await token.approve(p2pdex.target, offer_amount);
        await p2pdex.createOfferToken(offer_amount);

        arrayOffers = await p2pdex.getOffers();
        expect(arrayOffers.length).to.equal(1);
        [seller, tokenAmount, etherAmount, status] = await p2pdex.getOfferById(
          0
        );

        await p2pdex.connect(owner).cancelOfferToken(0);
        [seller, tokenAmount, etherAmount, status] = await p2pdex.getOfferById(
          0
        );
        // Status 0 --> Offert cancelled
        expect(status).to.equal(0);
      });

      it("Only offert owner should cancel that", async function () {
        offer_amount = BigInt(10) * BigInt(10) ** decimals;
        await token.approve(p2pdex.target, offer_amount);
        await p2pdex.createOfferToken(offer_amount);

        arrayOffers = await p2pdex.getOffers();
        expect(arrayOffers.length).to.equal(1);
        [seller, tokenAmount, etherAmount, status] = await p2pdex.getOfferById(
          0
        );

        await expect(
          p2pdex.connect(otherAccount).cancelOfferToken(0)
        ).to.be.revertedWith("Only the offert owner can cancel that");
      });

      it("Shouldn't cancel an offer with invalid ID", async function () {
        offer_amount = BigInt(10) * BigInt(10) ** decimals;
        await token.approve(p2pdex.target, offer_amount);
        await p2pdex.createOfferToken(offer_amount);

        await expect(
          p2pdex.connect(owner).cancelOfferToken(1)
        ).to.be.revertedWith("Invalid offer ID");
      });
    });

    describe("Test create buy token offer", function () {
      it("Should create a buy offer", async function () {
        eth_amount = "0.01";
        eth_amount_wei = ethers.parseEther(eth_amount);
        await p2pdex.createOfferBuyTokens({ value: eth_amount_wei });
        [seller, tokenAmount, etherAmount, status] =
          await p2pdex.getOfferBuyTokensById(0);

        expect(seller).to.equal(owner.address);
        expect(etherAmount).to.equal(eth_amount_wei);
      });

      it("Should create buy offer by not a owner address", async function () {
        eth_amount = "0.1";
        eth_amount_wei = ethers.parseEther(eth_amount);
        await p2pdex
          .connect(otherAccount)
          .createOfferBuyTokens({ value: eth_amount_wei });
        [seller, tokenAmount, etherAmount, status] =
          await p2pdex.getOfferBuyTokensById(0);

        expect(seller).to.equal(otherAccount.address);
        expect(etherAmount).to.equal(eth_amount_wei);
      });

      it("Shouldn't create a offer with 0 amount", async function () {
        eth_amount = "0";
        eth_amount_wei = ethers.parseEther(eth_amount);
        await expect(
          p2pdex.createOfferBuyTokens({ value: eth_amount_wei })
        ).to.be.revertedWith("Invalid offer amounts");
      });

      it("Should confirm buy token offer", async function () {
        eth_amount = "0.1";
        eth_amount_wei = ethers.parseEther(eth_amount);
        await p2pdex
          .connect(owner)
          .createOfferBuyTokens({ value: eth_amount_wei });

        [seller, tokenAmount, etherAmount, status] =
          await p2pdex.getOfferBuyTokensById(0);
        await token.transfer(otherAccount, tokenAmount);

        const balance_be4 = await token.balanceOf(owner.address);

        await token.connect(otherAccount).approve(p2pdex.target, tokenAmount);

        await p2pdex
          .connect(otherAccount)
          .completeOfferBuyTokens(0, tokenAmount);

        [seller, tokenAmount, etherAmount, status] =
          await p2pdex.getOfferBuyTokensById(0);

        const balance_after = await token.balanceOf(owner.address);
        expect(status).to.equal(2);

        expect(balance_be4 + tokenAmount).to.equal(balance_after);
      });

      it("Shouldn't confirm buy token offer with invalid ID", async function () {
        eth_amount = "0.1";
        eth_amount_wei = ethers.parseEther(eth_amount);
        await p2pdex
          .connect(owner)
          .createOfferBuyTokens({ value: eth_amount_wei });

        [seller, tokenAmount, etherAmount, status] =
          await p2pdex.getOfferBuyTokensById(0);

        await expect(
          p2pdex.connect(otherAccount).completeOfferBuyTokens(1, tokenAmount)
        ).to.be.revertedWith("Invalid offer ID");
      });

      it("Shouldn't confirm buy token offer if is already confirmed", async function () {
        eth_amount = "0.1";
        eth_amount_wei = ethers.parseEther(eth_amount);
        await p2pdex
          .connect(owner)
          .createOfferBuyTokens({ value: eth_amount_wei });

        [seller, tokenAmount, etherAmount, status] =
          await p2pdex.getOfferBuyTokensById(0);

        await token.transfer(otherAccount, tokenAmount);
        await token.connect(otherAccount).approve(p2pdex.target, tokenAmount);

        await p2pdex
          .connect(otherAccount)
          .completeOfferBuyTokens(0, tokenAmount);
        await expect(
          p2pdex.connect(otherAccount).completeOfferBuyTokens(0, tokenAmount)
        ).to.be.revertedWith("Offer is not active");
      });

      it("Shouldn't approve buy token offer without approve amount before", async function () {
        eth_amount = "0.1";
        eth_amount_wei = ethers.parseEther(eth_amount);
        await p2pdex
          .connect(owner)
          .createOfferBuyTokens({ value: eth_amount_wei });

        [seller, tokenAmount, etherAmount, status] =
          await p2pdex.getOfferBuyTokensById(0);

        await expect(
          p2pdex.connect(otherAccount).completeOfferBuyTokens(0, tokenAmount)
        ).to.be.revertedWith("ERC20: insufficient allowance");
      });

      it("Insufficient balance", async function () {
        eth_amount = "0.1";
        eth_amount_wei = ethers.parseEther(eth_amount);
        await p2pdex
          .connect(owner)
          .createOfferBuyTokens({ value: eth_amount_wei });

        [seller, tokenAmount, etherAmount, status] =
          await p2pdex.getOfferBuyTokensById(0);
        await token.connect(otherAccount).approve(p2pdex.target, tokenAmount);
        await expect(
          p2pdex.connect(otherAccount).completeOfferBuyTokens(0, tokenAmount)
        ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      });
    });

    it("Shouldn't confirm his own offert", async function () {
      eth_amount = "0.1";
      eth_amount_wei = ethers.parseEther(eth_amount);
      await p2pdex
        .connect(owner)
        .createOfferBuyTokens({ value: eth_amount_wei });

      [seller, tokenAmount, etherAmount, status] =
        await p2pdex.getOfferBuyTokensById(0);
      await token.connect(owner).approve(p2pdex.target, tokenAmount);
      await expect(
        p2pdex.connect(owner).completeOfferBuyTokens(0, tokenAmount)
      ).to.be.revertedWith("Seller cannot buy their own offer");
    });

    describe("Testing cancel buy token offer", function () {
      it("Should cancel buy tokken offert", async function () {
        eth_amount = "0.1";
        eth_amount_wei = ethers.parseEther(eth_amount);
        await p2pdex
          .connect(owner)
          .createOfferBuyTokens({ value: eth_amount_wei });

        await p2pdex.connect(owner).cancelOfferBuyTokens(0);
        [seller, tokenAmount, etherAmount, status] =
          await p2pdex.getOfferBuyTokensById(0);

        expect(status).to.equal(0);
      });

      it("Should cancel one buy tokken offert", async function () {
        eth_amount = "0.1";
        eth_amount_wei = ethers.parseEther(eth_amount);
        eth_amount = "0.05";
        eth_amount_wei2 = ethers.parseEther(eth_amount);
        await p2pdex
          .connect(owner)
          .createOfferBuyTokens({ value: eth_amount_wei });

        await p2pdex
          .connect(owner)
          .createOfferBuyTokens({ value: eth_amount_wei2 });

        await p2pdex.connect(owner).cancelOfferBuyTokens(0);

        [seller, tokenAmount, etherAmount, status] =
          await p2pdex.getOfferBuyTokensById(0);

        expect(status).to.equal(0);

        [seller, tokenAmount, etherAmount, status] =
          await p2pdex.getOfferBuyTokensById(1);

        expect(status).to.equal(1);
      });

      it("Shouldn't be able to cancel an offer not made by us. ", async function () {
        eth_amount = "0.1";
        eth_amount_wei = ethers.parseEther(eth_amount);
        await p2pdex
          .connect(owner)
          .createOfferBuyTokens({ value: eth_amount_wei });

        await expect(p2pdex.connect(otherAccount).cancelOfferBuyTokens(0)).to.be
          .reverted;
      });
    });
  });
});
