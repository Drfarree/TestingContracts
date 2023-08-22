const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat"); // Cambia esta línea para importar ethers desde Hardhat

describe("FLToken", function () {
  async function deployFLTokenFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const FLToken = await ethers.getContractFactory("FLToken");
    const flToken = await FLToken.deploy(
      "My Token",
      "MTK",
      100000,
      owner.address,
      18
    );

    return { flToken, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the correct name, symbol, and decimals", async function () {
      const { flToken } = await loadFixture(deployFLTokenFixture);
      expect(await flToken.name()).to.equal("My Token");
      expect(await flToken.symbol()).to.equal("MTK");
      expect(await flToken.decimals()).to.equal(18);
    });
  });

  describe("Minting tokens", function () {
    it("Should mint tokens and increase balance", async function () {
      const mintAmount = 1000;
      const { flToken, owner } = await loadFixture(deployFLTokenFixture);

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
      const mintAmount = 1000;
      const { flToken, otherAccount } = await loadFixture(deployFLTokenFixture);

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
      const burnAmount = 500;
      const { flToken, owner } = await loadFixture(deployFLTokenFixture);

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
      const burnAmount = 500;
      const { flToken, otherAccount } = await loadFixture(deployFLTokenFixture);

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
      const transferAmount = 500;
      const { flToken, owner, otherAccount } = await loadFixture(
        deployFLTokenFixture
      );

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
        const transferAmount = 800;
        const { flToken, owner, otherAccount } = await loadFixture(
          deployFLTokenFixture
        );
    
        // El owner le envía tokens a otherAccount
        await flToken.connect(owner).transfer(otherAccount.address, transferAmount);
    
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
