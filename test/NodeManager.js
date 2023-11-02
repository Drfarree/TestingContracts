const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const LPABI = require("./../ABIs/LPABI.json");

describe("Node Manager deploy", function () {
  async function deployContractsFixture() {
    const [owner, otherAccount, otherAccount2] = await ethers.getSigners();

    // Deploy token to have liquidity for testing
    const Token = await ethers.getContractFactory("FLTokenV2");
    const token = await Token.deploy("Pikake", "PK", 100000, owner.address, 18);

    const tokenAddress = token.target;

    const NodeManager = await ethers.getContractFactory("NodeManager");
    const nodeManager = await NodeManager.deploy(tokenAddress);

    const nodeManagerAddress = nodeManager.target;

    return {
      owner,
      otherAccount,
      nodeManager,
      otherAccount2,
      nodeManagerAddress,
      tokenAddress,
      token,
    };
  }

  describe("Deployment", function () {
    it("Should deploy correct contract", async function () {
      const { owner, nodeManager, tokenAddress } = await loadFixture(
        deployContractsFixture
      );
      ownerContract = await nodeManager.owner();
      tokenAddressUsed = await nodeManager.tokenDistributed();
      expect(owner).to.equal(owner);
      expect(tokenAddress).to.equal(tokenAddressUsed);
    });
  });

  describe("Initialize", function () {
    it("Should initiallize node manager with specific %", async function () {
      const { owner, nodeManager, otherAccount } = await loadFixture(
        deployContractsFixture
      );
      const ownerPercent = 70;
      const otherPercent = 30;

      const participants = [owner, otherAccount];
      const percentages = [ownerPercent, otherPercent];
      await nodeManager.setUserShares(participants, percentages);

      const percentOwner = await nodeManager.userPercentages(owner);

      expect(percentOwner).to.equal(ownerPercent);
    });

    it("Total percent must equal 100", async function () {
      const { owner, nodeManager, otherAccount } = await loadFixture(
        deployContractsFixture
      );
      const ownerPercent = 70;
      const otherPercent = 40;

      const participants = [owner, otherAccount];
      const percentages = [ownerPercent, otherPercent];

      await expect(
        nodeManager.setUserShares(participants, percentages)
      ).to.be.revertedWith("Total percentage must equal 100.");
    });

    it("Arrays must have same length", async function () {
        const { owner, nodeManager, otherAccount } = await loadFixture(
          deployContractsFixture
        );
        const ownerPercent = 70;
        const otherPercent = 20;
        const otherPercert2 = 10
  
        const participants = [owner, otherAccount];
        const percentages = [ownerPercent, otherPercent, otherPercert2];
  
        await expect(
          nodeManager.setUserShares(participants, percentages)
        ).to.be.revertedWith("Arrays must have the same length.");
      });
  });

  describe("Interact with nodeManager", function () {
    let otherAccount2;
    let otherAccount;
    let nodeManager;
    let owner;
    let token;
    let tokenAddress;

    beforeEach(async function () {
      const {
        otherAccount2: _otherAccount2,
        owner: _owner,
        otherAccount: _otherAccount,
        nodeManager: _nodeManager,
        token: _token,
        tokenAddress: _tokenAddress,
      } = await loadFixture(deployContractsFixture);

      (otherAccount2 = _otherAccount2),
        (owner = _owner),
        (otherAccount = _otherAccount),
        (nodeManager = _nodeManager);
      token = _token;
      tokenAddress = _tokenAddress;

      const ownerPercent = 70;
      const otherPercent = 30;

      const participants = [owner, otherAccount];
      const percentages = [ownerPercent, otherPercent];
      await nodeManager.setUserShares(participants, percentages);
    });

    describe("Test deposit function", function () {
      it("Should deposit tokens on node manager by owner", async function () {
        const decimals = await token.decimals();
        const token_amount = BigInt(10) * BigInt(10) ** decimals;
        await token.approve(nodeManager.target, token_amount);
        await nodeManager.deposit(token_amount);
        expect(await nodeManager.checkFullBalance()).to.equal(token_amount);
      });
      it("Should deposit tokens on node manager by other account", async function () {
        const decimals = await token.decimals();
        const token_amount = BigInt(10) * BigInt(10) ** decimals;
        await token.transfer(otherAccount, token_amount);
        await token
          .connect(otherAccount)
          .approve(nodeManager.target, token_amount);
        await nodeManager.connect(otherAccount).deposit(token_amount);
        expect(await nodeManager.checkFullBalance()).to.equal(token_amount);
      });
      it("Multiple accounts should deposit tokens", async function () {
        const decimals = await token.decimals();
        const token_amountA = BigInt(10) * BigInt(10) ** decimals;
        const token_amountB = BigInt(25) * BigInt(10) ** decimals;
        await token.transfer(otherAccount, token_amountA);
        await token
          .connect(otherAccount)
          .approve(nodeManager.target, token_amountA);
        await nodeManager.connect(otherAccount).deposit(token_amountA);
        expect(await nodeManager.checkFullBalance()).to.equal(token_amountA);
        await token.approve(nodeManager.target, token_amountB);
        await nodeManager.deposit(token_amountB);
        expect(await nodeManager.checkFullBalance()).to.equal(
          token_amountA + token_amountB
        );
      });
      it("Should revert with insufficient balance", async function () {
        const decimals = await token.decimals();
        const token_amount = BigInt(10) * BigInt(10) ** decimals;
        await token
          .connect(otherAccount)
          .approve(nodeManager.target, token_amount);
        await expect(
          nodeManager.connect(otherAccount).deposit(token_amount)
        ).to.be.revertedWith("Insufficient token balance.");
      });
    });

    describe("Test claimTokens function", function () {
      it("Should claim amount", async function () {
        const decimals = await token.decimals();
        const token_amount = BigInt(10) * BigInt(10) ** decimals;
        const recieve_amount = BigInt(3) * BigInt(10) ** decimals;
        await token.approve(nodeManager.target, token_amount);
        await nodeManager.deposit(token_amount);
        expect(await nodeManager.checkFullBalance()).to.equal(token_amount);
        await nodeManager.connect(otherAccount).claimTokens();
        expect(await token.balanceOf(otherAccount)).to.equal(recieve_amount);
      });

      it("Should claim amount multiple deposits", async function () {
        const decimals = await token.decimals();
        const token_amount = BigInt(10) * BigInt(10) ** decimals;
        const recieve_amount = BigInt(9) * BigInt(10) ** decimals;

        for (let i = 0; i < 3; i++) {
          await token.approve(nodeManager.target, token_amount);
          await nodeManager.deposit(token_amount);
        }
        await nodeManager.connect(otherAccount).claimTokens();
        expect(await token.balanceOf(otherAccount)).to.equal(recieve_amount);
      });

      it("Should claim amount each account", async function () {
        const decimals = await token.decimals();
        const token_amount = BigInt(10) * BigInt(10) ** decimals;
        const recieve_amount = BigInt(3) * BigInt(10) ** decimals;
        const recieve_amount_owner = BigInt(7) * BigInt(10) ** decimals;

        await token.approve(nodeManager.target, token_amount);
        await nodeManager.deposit(token_amount);
        expect(await nodeManager.checkFullBalance()).to.equal(token_amount);
        await nodeManager.connect(otherAccount).claimTokens();
        expect(await token.balanceOf(otherAccount)).to.equal(recieve_amount);

        const balanceOwner = await token.balanceOf(owner);
        await nodeManager.connect(owner).claimTokens();
        const balanceOwnerAfter = await token.balanceOf(owner);
        expect(balanceOwnerAfter).to.equal(balanceOwner + recieve_amount_owner);
      });

      it("Should revert if nothing to claim", async function () {
        await expect(nodeManager.claimTokens()).to.be.revertedWith(
          "No tokens to claim."
        );
      });
    });
  });
});
