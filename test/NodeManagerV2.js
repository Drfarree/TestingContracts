const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("NodeManager (n decimals)", function () {
  async function deployContractsFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    // Deploy token FLToken
    const FLToken = await ethers.getContractFactory("FLTokenV2");
    const flToken = await FLToken.deploy(
      "Pikake",
      "PK",
      100000,
      owner.address,
      18
    );

    // Deploy whitelist SC
    const Whitelist = await ethers.getContractFactory("ControlWhitelist");
    const whitelist = await Whitelist.deploy();

    // Deploy NodeManager
    const NodeManager = await ethers.getContractFactory("NodeManager");
    const nodeManager = await NodeManager.deploy(
      flToken.target,
      whitelist.target
    );

    // console.log("NodeManager deployed at:", nodeManager.target); // Imprime la dirección de NodeManager

    const decimals = await flToken.decimals();

    return { flToken, nodeManager, owner, otherAccount, whitelist, decimals };
  }

  describe("Deployment", function () {
    it("Should deploy NodeManager contract", async function () {
      const { flToken, nodeManager } = await loadFixture(
        deployContractsFixture
      );

      expect(await flToken.name()).to.equal("Pikake");
      expect(await nodeManager.owner()).to.equal(await flToken.owner());
      expect(await nodeManager.checkFullBalance()).to.equal(0);
    });
  });

  describe("Test deposit function", function () {
    it("Should deposit tokens on the contract by Owner", async function () {
      const { flToken, nodeManager, owner, otherAccount, decimals } =
        await loadFixture(deployContractsFixture);

      deposit_balance = BigInt(1000) * BigInt(10) ** decimals;

      await flToken.connect(owner).approve(nodeManager.target, deposit_balance);

      await nodeManager.connect(owner).deposit(deposit_balance);

      nodeBalance = await nodeManager.checkFullBalance();

      expect(deposit_balance).to.equal(nodeBalance);
    });

    it("Should deposit tokens by other account (not owner)", async function () {
      it("Should deposit tokens on the contract by Owner", async function () {
        const { flToken, nodeManager, owner, otherAccount, decimals } =
          await loadFixture(deployContractsFixture);

        deposit_balance = BigInt(500) * BigInt(10) ** decimals;

        await flToken.connect(owner).transfer(otherAccount, deposit_balance);

        await flToken
          .connect(otherAccount)
          .approve(nodeManager.target, deposit_balance);

        await nodeManager.connect(otherAccount).deposit(deposit_balance);

        nodeBalance = await nodeManager.checkFullBalance();

        expect(deposit_balance).to.equal(nodeBalance);
      });
    });
  });

  describe("Test transfer function", function () {
    let deposit_amount;
    let flToken;
    let nodeManager;
    let owner;
    let otherAccount;
    let whitelist;
    let decimals;

    beforeEach(async function () {
      const {
        flToken: _flToken,
        owner: _owner,
        otherAccount: _otherAccount,
        nodeManager: _nodeManager,
        whitelist: _whitelist,
        decimals: _decimals
      } = await loadFixture(deployContractsFixture);

      flToken = _flToken;
      owner = _owner;
      otherAccount = _otherAccount;
      nodeManager = _nodeManager;
      whitelist = _whitelist;
      decimals = _decimals;
      deposit_amount = BigInt(10000) * BigInt(10) ** decimals;;

      await flToken.connect(owner).approve(nodeManager.target, deposit_amount);
      await nodeManager.connect(owner).deposit(deposit_amount);

      balance = await nodeManager.checkFullBalance();

      expect(balance).to.equal(deposit_amount);
    });

    it("Should transfer tokens to user", async function () {
      projectID = 1;
      transfer_amount = BigInt(100) * BigInt(10) ** decimals;;
      // add user to whitelist
      await whitelist.connect(owner).addWhitelistUser(projectID, otherAccount);

      balanceBefore = await nodeManager.checkFullBalance();

      await nodeManager
        .connect(owner)
        .transfer(otherAccount, transfer_amount, projectID);

      balanceAfter = await nodeManager.checkFullBalance();

      expect(balanceAfter).to.equal(balanceBefore - transfer_amount);

      walletBalance = await flToken
        .connect(otherAccount)
        .balanceOf(otherAccount);

      expect(walletBalance).to.equal(transfer_amount);
    });

    it("Shouldn't transfer to user that is not on WL", async function () {
      projectID = 1;
      transfer_amount = BigInt(100) * BigInt(10) ** decimals;;

      balanceBefore = await nodeManager.checkFullBalance();

      await expect(
        nodeManager
          .connect(owner)
          .transfer(otherAccount, transfer_amount, projectID)
      ).to.be.revertedWith("Sender is not in the whitelist");

      balanceAfter = await nodeManager.checkFullBalance();

      expect(balanceAfter).to.equal(balanceBefore);

      walletBalance = await flToken
        .connect(otherAccount)
        .balanceOf(otherAccount);

      expect(walletBalance).to.equal(0);
    });

    it("Just owner can call this function", async function () {
      projectID = 12;
      transfer_amount = BigInt(100) * BigInt(10) ** decimals;;

      await whitelist.connect(owner).addWhitelistUser(projectID, otherAccount);

      await expect(
        nodeManager
          .connect(otherAccount)
          .transfer(otherAccount, transfer_amount, projectID)
      ).to.be.revertedWith("Only owner can call this function.");
    });
  });
});
