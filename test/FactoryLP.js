const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const LPABI = require("./../ABIs/LPABI.json");

describe("Factory LP deploy", function () {
  async function deployContractsFixture() {
    const [owner, otherAccount, otherAccount2] = await ethers.getSigners();

    const LiquidityPoolFactory = await ethers.getContractFactory(
      "LiquidityPoolFactory"
    );
    const lpFactory = await LiquidityPoolFactory.deploy();

    const factoryAddress = lpFactory.target;

    return {
      owner,
      otherAccount,
      lpFactory,
      otherAccount2,
      factoryAddress,
    };
  }

  describe("Deployment", function () {
    it("Should deploy FactoryLP contract", async function () {
      const { owner, lpFactory, factoryAddress } = await loadFixture(
        deployContractsFixture
      );

      expect(factoryAddress).to.equal(factoryAddress);
    });
  });

  describe("Initialize", function () {
    it("Pool arrays should be zero", async function () {
      const { owner, lpFactory, factoryAddress } = await loadFixture(
        deployContractsFixture
      );

      const pools = await lpFactory.getAllPools();

      expect(pools.length).to.equal(0);
    });
  });

  describe("Create liquidity pool and interact with it", function () {
    let otherAccount2;
    let otherAccount;
    let lpFactory;
    let owner;

    beforeEach(async function () {
      const {
        otherAccount2: _otherAccount2,
        owner: _owner,
        otherAccount: _otherAccount,
        lpFactory: _lpFactory,
      } = await loadFixture(deployContractsFixture);

      (otherAccount2 = _otherAccount2),
        (owner = _owner),
        (otherAccount = _otherAccount),
        (lpFactory = _lpFactory);
    });

    it("Should create a LP", async function () {
      const Token = await ethers.getContractFactory("FLTokenV2");
      const token = await Token.deploy(
        "Pikake",
        "PK",
        100000,
        owner.address,
        18
      );

      const tokenAddress = token.target;
      await lpFactory.createLiquidityPool(tokenAddress);
      const LPArray = await lpFactory.getPoolsByOwner(owner.address);
      const LPArrayV2 = await lpFactory.getAllPools();
      expect(LPArrayV2[0]).to.equal(LPArray[0]);
    });
    it("We can interact with LP deployed", async function () {
      const Token = await ethers.getContractFactory("FLTokenV2");
      const token = await Token.deploy(
        "Pikake",
        "PK",
        100000,
        owner.address,
        18
      );
      const decimals = await token.decimals();
      const tokenAddress = token.target;
      const token_amount = BigInt(10) * BigInt(10) ** decimals;
      const eth_amount = "1.0";
      const eth_amount_wei = ethers.parseEther(eth_amount);
      await lpFactory.createLiquidityPool(tokenAddress);
      const LPArray = await lpFactory.getPoolsByOwner(owner);
      const LPAddress = LPArray[0];

      const LPContract = new ethers.Contract(LPAddress, LPABI, ethers.provider);

      await token.connect(owner).approve(LPAddress, token_amount);

      //Initialize LP deployed
      await LPContract.connect(owner).initializePool(token_amount, {
        value: eth_amount_wei,
      });

      const [tokenBalance, eth] = await LPContract.getPoolBalance();
      expect(eth).to.equal(eth_amount_wei);
      expect(tokenBalance).to.equal(token_amount);
    });

    it("Should create a LP by not an owner user", async function () {
      const Token = await ethers.getContractFactory("FLTokenV2");
      const token = await Token.connect(otherAccount).deploy(
        "PikakeV2",
        "PK",
        100000,
        owner.address,
        18
      );

      const tokenAddress = token.target;
      await lpFactory.connect(otherAccount).createLiquidityPool(tokenAddress);
      const LPArray = await lpFactory.getPoolsByOwner(otherAccount);
      const LPArrayV2 = await lpFactory.getAllPools();
      expect(LPArrayV2[0]).to.equal(LPArray[0]);
    });

    it("Should show only owner LP", async function () {
      const Token = await ethers.getContractFactory("FLTokenV2");
      const token = await Token.connect(otherAccount).deploy(
        "PikakeV2",
        "PK",
        100000,
        owner.address,
        18
      );
      const tokenAddress = token.target;
      await lpFactory.connect(otherAccount).createLiquidityPool(tokenAddress);
      const LPArray = await lpFactory.getPoolsByOwner(owner);
      const LPArrayV2 = await lpFactory.getAllPools();
      expect(LPArray.length).to.equal(0);
      expect(LPArrayV2.length).to.equal(1);
    });

    it("User can interact with LP deployed (not owner)", async function () {
      const Token = await ethers.getContractFactory("FLTokenV2");
      const token = await Token.deploy(
        "Pikake",
        "PK",
        100000,
        owner.address,
        18
      );
      const decimals = await token.decimals();
      const tokenAddress = token.target;
      const token_amount = BigInt(10) * BigInt(10) ** decimals;
      const buy_amount_eth = "0.05";
      const buy_amount_wei = ethers.parseEther(buy_amount_eth);
      const eth_amount = "1.0";
      const eth_amount_wei = ethers.parseEther(eth_amount);
      await lpFactory.createLiquidityPool(tokenAddress);
      const LPArray = await lpFactory.getPoolsByOwner(owner);
      const LPAddress = LPArray[0];

      const LPContract = new ethers.Contract(LPAddress, LPABI, ethers.provider);

      await token.connect(owner).approve(LPAddress, token_amount);

      //Initialize LP deployed
      await LPContract.connect(owner).initializePool(token_amount, {
        value: eth_amount_wei,
      });

      const [tokenBalance, eth] = await LPContract.getPoolBalance();
      expect(eth).to.equal(eth_amount_wei);
      expect(tokenBalance).to.equal(token_amount);

      await LPContract.connect(otherAccount).swapETHForTokens({
        value: buy_amount_wei,
      });

      balance = await token.balanceOf(otherAccount);

      expect(balance).to.be.above(0);
    });

    it("We can create more than one LP", async function () {
      const Token = await ethers.getContractFactory("FLTokenV2");
      const token = await Token.deploy(
        "Pikake",
        "PK",
        100000,
        owner.address,
        18
      );

      const Token2 = await ethers.getContractFactory("FLTokenV2");
      const token2 = await Token.deploy(
        "PikakeV2",
        "PK2",
        100000,
        owner.address,
        18
      );

      const tokenAddress = token.target
      const tokenAddress2 = token2.target

      await lpFactory.createLiquidityPool(tokenAddress);
      await lpFactory.createLiquidityPool(tokenAddress2);

      const allPools = await lpFactory.getAllPools();
      expect(allPools.length).to.equal(2);
    });
  });
});
