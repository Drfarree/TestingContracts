const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("Whitelist Implementation deploy", function () {
  async function deployContractsFixture() {
    const [owner, otherAccount, otherAccount2] = await ethers.getSigners();

    // Deploy token FLToken
    const Whitelist = await ethers.getContractFactory("Whitelist");
    const whitelist = await Whitelist.deploy();

    return { owner, otherAccount, whitelist, otherAccount2 };
  }

  describe("Deployment", function () {
    it("Should deploy Whitelist contract with _owner as owner", async function () {
      const { owner, whitelist } = await loadFixture(deployContractsFixture);

      expect(await whitelist.owner()).to.equal(owner.address);
    });
  });

  describe("Add new address to whitelist", function () {
    let owner;
    let whitelist;
    let otherAccount;
    let otherAccount2;

    beforeEach(async function () {
      const {
        owner: _owner,
        whitelist: _whitelist,
        otherAccount: _otherAccount,
        otherAccount2: _otherAccount2,
      } = await loadFixture(deployContractsFixture);

      owner = _owner;
      whitelist = _whitelist;
      otherAccount = _otherAccount;
      otherAccount2 = _otherAccount2;
    });

    it("Should owner add user to whitelist", async function () {
      await whitelist.connect(owner).addAddress(otherAccount);

      newAddressWhitelisted = await whitelist.isAddressWhitelisted(
        otherAccount
      );

      expect(newAddressWhitelisted).to.equal(true);
    });

    it("Can't add an user that is already whitelsited", async function () {
      await whitelist.connect(owner).addAddress(otherAccount);

      newAddressWhitelisted = await whitelist.isAddressWhitelisted(
        otherAccount
      );

      expect(newAddressWhitelisted).to.equal(true);

      await expect(
        whitelist.connect(owner).addAddress(otherAccount)
      ).to.be.revertedWith("Address is already whitelisted");
    });

    it("Can add multiple users to the whitelist", async function () {
      const usersToAdd = [otherAccount, otherAccount2];

      for (const user of usersToAdd) {
        await whitelist.connect(owner).addAddress(user);
        const isWhitelisted = await whitelist.isAddressWhitelisted(user);
        expect(isWhitelisted).to.equal(true);
      }
    });

    it("Only owner/ownerContract can add users to whitelist", async function () {
      await expect(
        whitelist.connect(otherAccount).addAddress(otherAccount)
      ).to.be.revertedWith(
        "Only the owner or owner contracts can call this function"
      );
    });

    it("OwnerContract can add user to whitelist", async function () {
      const OwnerContract = await ethers.getContractFactory("TestContract");
      const ownerContract = await OwnerContract.deploy();

      await ownerContract.addAddressToWhitelist(whitelist.target, otherAccount);

      newAddressWhitelisted = await whitelist.isAddressWhitelisted(
        otherAccount
      );

      expect(newAddressWhitelisted).to.equal(true);
    });

    it("Not owner contract can't add user to whitelist", async function () {
      const UserContract = await ethers.getContractFactory("TestContract");
      const userContract = await UserContract.connect(otherAccount).deploy();

      await expect(
        userContract.addAddressToWhitelist(whitelist.target, otherAccount)
      ).to.be.revertedWith(
        "Only the owner or owner contracts can call this function"
      );
    });
  });

  describe("Add new address to whitelist", function () {
    let owner;
    let whitelist;
    let otherAccount;
    let otherAccount2;

    beforeEach(async function () {
      const {
        owner: _owner,
        whitelist: _whitelist,
        otherAccount: _otherAccount,
        otherAccount2: _otherAccount2,
      } = await loadFixture(deployContractsFixture);

      owner = _owner;
      whitelist = _whitelist;
      otherAccount = _otherAccount;
      otherAccount2 = _otherAccount2;

      await whitelist.connect(owner).addAddress(otherAccount);
    });

    it("Should owner remove user from whitelist", async function () {
      newAddressWhitelisted = await whitelist.isAddressWhitelisted(
        otherAccount
      );

      expect(newAddressWhitelisted).to.equal(true);

      await whitelist.connect(owner).removeAddress(otherAccount);

      expect(await whitelist.isAddressWhitelisted(otherAccount)).to.equal(
        false
      );
    });

    it("Can't remove user that is not whitelisted", async function () {
      await whitelist.connect(owner).removeAddress(otherAccount);

      await expect(
        whitelist.connect(owner).removeAddress(otherAccount)
      ).to.be.revertedWith("Address is not whitelisted");
    });

    it("Can add multiple users to the whitelist", async function () {
      await whitelist.connect(owner).addAddress(otherAccount2);
      const usersToRemove = [otherAccount, otherAccount2];

      for (const user of usersToRemove) {
        await whitelist.connect(owner).removeAddress(user);
        const isWhitelisted = await whitelist.isAddressWhitelisted(user);
        expect(isWhitelisted).to.equal(false);
      }
    });

    it("Only owner/ownerContract can remove users from whitelist", async function () {
      await expect(
        whitelist.connect(otherAccount).removeAddress(otherAccount)
      ).to.be.revertedWith(
        "Only the owner or owner contracts can call this function"
      );
    });

    it("OwnerContract can remove user from whitelist", async function () {
      const OwnerContract = await ethers.getContractFactory("TestContract");
      const ownerContract = await OwnerContract.deploy();

      await ownerContract.removeAddressFromWhitelist(
        whitelist.target,
        otherAccount
      );

      newAddressWhitelisted = await whitelist.isAddressWhitelisted(
        otherAccount
      );

      expect(newAddressWhitelisted).to.equal(false);
    });

    it("Not owner contract can't remove user from whitelist", async function () {
      const UserContract = await ethers.getContractFactory("TestContract");
      const userContract = await UserContract.connect(otherAccount).deploy();

      await expect(
        userContract.removeAddressFromWhitelist(whitelist.target, otherAccount)
      ).to.be.revertedWith(
        "Only the owner or owner contracts can call this function"
      );
    });
  });

  describe("Test view function", function () {
    it("Owner can call view function", async function () {
      const { owner, whitelist, otherAccount } = await loadFixture(
        deployContractsFixture
      );

      await whitelist.connect(owner).addAddress(otherAccount);

      // test function
      expect(await whitelist.isAddressWhitelisted(otherAccount)).to.equal(true);

      // test mapping
      expect(await whitelist.isWhitelisted(otherAccount)).to.equal(true);
    });

    it("Other account can call view function", async function () {
      const { owner, whitelist, otherAccount } = await loadFixture(
        deployContractsFixture
      );

      await whitelist.connect(owner).addAddress(otherAccount);

      // test function
      expect(
        await whitelist.connect(otherAccount).isAddressWhitelisted(otherAccount)
      ).to.equal(true);

      // test mapping
      expect(
        await whitelist.connect(otherAccount).isWhitelisted(otherAccount)
      ).to.equal(true);
    });

    it("Other owner contract can call view function", async function () {
      const { owner, whitelist, otherAccount } = await loadFixture(
        deployContractsFixture
      );

      await whitelist.connect(owner).addAddress(otherAccount);

      const OwnerContract = await ethers.getContractFactory("TestContract");
      const ownerContract = await OwnerContract.deploy();

      expect(
        await ownerContract.viewWhitelist(whitelist.target, otherAccount)
      ).to.equal(true);
    });

    it("Other not owner contract can call view function", async function () {
      const { owner, whitelist, otherAccount } = await loadFixture(
        deployContractsFixture
      );

      await whitelist.connect(owner).addAddress(otherAccount);

      const UserContract = await ethers.getContractFactory("TestContract");
      const userContract = await UserContract.connect(otherAccount).deploy();

      expect(
        await userContract
          .connect(otherAccount)
          .viewWhitelist(whitelist.target, otherAccount)
      ).to.equal(true);
    });
  });
});
