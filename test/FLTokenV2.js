const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat"); // Cambia esta línea para importar ethers desde Hardhat

describe("FLTokenV2 (n decimals)", function () {
  async function deployFLTokenFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const FLToken = await ethers.getContractFactory("FLTokenV2");
    const flToken = await FLToken.deploy(
      "Pikake",
      "PK",
      100000,
      owner.address,
      18
    );

    const decimals = await flToken.decimals();

    return { flToken, owner, otherAccount, decimals };
  }

  describe("Deployment", function () {
    it("Should set the correct name, symbol, and decimals", async function () {
      const { flToken } = await loadFixture(deployFLTokenFixture);
      expect(await flToken.name()).to.equal("Pikake");
      expect(await flToken.symbol()).to.equal("PK");
      expect(await flToken.decimals()).to.equal(18);
    });
  });

  describe("Minting tokens", function () {
    it("Should mint tokens and increase balance", async function () {
      const { flToken, owner, decimals } = await loadFixture(
        deployFLTokenFixture
      );

      // decimals == BigInt
      const mintAmount = BigInt(1000) * BigInt(10) ** decimals;

      const previousTotalSupply = await flToken.totalSupply();
      await flToken.mintTokens(owner.address, mintAmount);

      const totalSupply = await flToken.totalSupply();
      const ownerBalance = await flToken.balanceOf(owner.address);

      const expectedTotalSupply =
        BigInt(previousTotalSupply.toString()) + BigInt(mintAmount);

      expect(totalSupply).to.equal(expectedTotalSupply);
    });

    it("Should set the right owner balance", async function () {
      const { flToken, owner } = await loadFixture(deployFLTokenFixture);
      const totalSupply = await flToken.totalSupply();
      const ownerBalance = await flToken.balanceOf(owner.address);
      expect(totalSupply).to.equal(ownerBalance);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const { flToken, otherAccount, decimals } = await loadFixture(
        deployFLTokenFixture
      );
      const mintAmount = BigInt(1000) * BigInt(10) ** decimals;

      // Intentamos mintear desde una cuenta que no es el propietario
      await expect(
        flToken
          .connect(otherAccount)
          .mintTokens(otherAccount.address, mintAmount)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // Verificamos que el balance de la cuenta no cambie
      const ownerBalance = await flToken.balanceOf(otherAccount.address);
      const totalSupply = await flToken.totalSupply();
      expect(ownerBalance).to.equal(0);
    });
  });

  describe("Burning tokens", function () {
    it("Should burn tokens and decrease balance", async function () {
      const { flToken, owner, decimals } = await loadFixture(
        deployFLTokenFixture
      );
      const burnAmount = BigInt(500) * BigInt(10) ** decimals;

      const previousTotalSupply = await flToken.totalSupply();
      const previousOwnerBalance = await flToken.balanceOf(owner.address);

      await flToken.burnTokens(owner.address, burnAmount);

      const totalSupply = await flToken.totalSupply();
      const ownerBalance = await flToken.balanceOf(owner.address);

      const expectedTotalSupply =
        BigInt(previousTotalSupply.toString()) - BigInt(burnAmount);

      expect(totalSupply).to.equal(expectedTotalSupply);
      expect(ownerBalance).to.equal(totalSupply);
    });

    it("Should not allow non-owner to burn tokens", async function () {
      const { flToken, otherAccount, decimals } = await loadFixture(
        deployFLTokenFixture
      );
      const burnAmount = BigInt(777) * BigInt(10) ** decimals;

      // Intentamos quemar tokens desde una cuenta que no es el propietario
      await expect(
        flToken
          .connect(otherAccount)
          .burnTokens(otherAccount.address, burnAmount)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // Verificamos que el balance de la cuenta no cambie
      const otherBalance = await flToken.balanceOf(otherAccount.address);
      expect(otherBalance).to.equal(0);
    });
  });

  describe("Transferring tokens", function () {
    it("Should transfer tokens from owner to another account", async function () {
      const { flToken, owner, otherAccount, decimals } = await loadFixture(
        deployFLTokenFixture
      );
      const transferAmount = BigInt(500) * BigInt(10) ** decimals;

      const previousOwnerBalance = await flToken.balanceOf(owner.address);
      await flToken
        .connect(owner)
        .transfer(otherAccount.address, transferAmount);

      const ownerBalance = await flToken.balanceOf(owner.address);
      const recipientBalance = await flToken.balanceOf(otherAccount.address);

      expect(ownerBalance).to.equal(
        BigInt(previousOwnerBalance.toString()) - BigInt(transferAmount)
      );
      expect(recipientBalance).to.equal(transferAmount);
    });

    it("Should transfer tokens from otherAccount to owner", async function () {
      const { flToken, owner, otherAccount, decimals } = await loadFixture(
        deployFLTokenFixture
      );
      const transferAmount = BigInt(800) * BigInt(10) ** decimals;

      // El owner le envía tokens a otherAccount
      await flToken
        .connect(owner)
        .transfer(otherAccount.address, transferAmount);

      // Realiza la transferencia desde otherAccount hacia el owner
      const previousOwnerBalance = await flToken.balanceOf(owner.address);
      await flToken
        .connect(otherAccount)
        .transfer(owner.address, transferAmount);

      const ownerBalance = await flToken.balanceOf(owner.address);
      const otherAccountBalance = await flToken.balanceOf(otherAccount.address);

      // Verifica que los balances se hayan actualizado correctamente
      expect(ownerBalance).to.equal(
        BigInt(previousOwnerBalance.toString()) + BigInt(transferAmount)
      );
      expect(otherAccountBalance).to.equal(0);
    });
  });
});
