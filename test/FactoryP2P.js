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
});
