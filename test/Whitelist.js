const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("ControlWhitelist", function () {
  async function deployWhitelistFixture() {
    const [owner, otherAccount, randomAccount] = await ethers.getSigners();

    const WhitelistSC = await ethers.getContractFactory("ControlWhitelist");
    const whitelistSC = await WhitelistSC.deploy();

    return { whitelistSC, owner, otherAccount, randomAccount };
  }

  describe("Add whitelist user (onlyOwner)", function () {
    it("Should add user to the whitelist", async function () {
      const { whitelistSC, owner, otherAccount } = await loadFixture(
        deployWhitelistFixture
      );

      const projectID = 1;
      await whitelistSC.addWhitelistUser(projectID, otherAccount);

      isInWhitelistOwner = await whitelistSC.isInWhiteListMaster(
        1,
        otherAccount
      );

      isInWhitelistUser = await whitelistSC
        .connect(otherAccount)
        .isInWhitelist(projectID);

      expect(isInWhitelistOwner).to.equal(true);
      expect(isInWhitelistUser).to.equal(true);
    });
  });

  describe("Remove user from whitelist", function () {
    it("Should remove user from whitelist", async function () {
      const { whitelistSC, owner, otherAccount } = await loadFixture(
        deployWhitelistFixture
      );

      const projectID = 1;

      await whitelistSC.addWhitelistUser(projectID, otherAccount);
      isInWhitelistOwner = await whitelistSC.isInWhiteListMaster(
        1,
        otherAccount
      );

      expect(isInWhitelistOwner).to.equal(true);

      await whitelistSC.removeFromWhitelist(projectID, otherAccount);

      isInWhitelistOwner = await whitelistSC.isInWhiteListMaster(
        1,
        otherAccount
      );

      expect(isInWhitelistOwner).to.equal(false);
    });

    it("User can't remove user from whitelist", async function () {
      const { whitelistSC, owner, otherAccount } = await loadFixture(
        deployWhitelistFixture
      );

      const projectID = 1;
      await whitelistSC.addWhitelistUser(projectID, otherAccount);
      isInWhitelistOwner = await whitelistSC.isInWhiteListMaster(
        1,
        otherAccount
      );

      expect(isInWhitelistOwner).to.equal(true);
      await expect(
        whitelistSC
          .connect(otherAccount)
          .removeFromWhitelist(projectID, otherAccount)
      ).to.be.reverted;
      isInWhitelistOwner = await whitelistSC.isInWhiteListMaster(
        projectID,
        otherAccount
      );
      expect(isInWhitelistOwner).to.equal(true);
    });
  });

  describe("Inference whitelist testing", function () {
    let whitelistSC;
    let projectID;
    let _inferenceTimes;
    let otherAccount;
    let randomAccount;

    beforeEach(async function () {
      const {
        whitelistSC: _whitelistSC,
        owner,
        otherAccount: _otherAccount,
        randomAccount: _randomAccount,
      } = await loadFixture(deployWhitelistFixture);

      projectID = 1;
      _inferenceTimes = 5;
      whitelistSC = _whitelistSC;
      otherAccount = _otherAccount;
      randomAccount = _randomAccount;

      await whitelistSC.addInferenceWhitelist(
        projectID,
        otherAccount,
        _inferenceTimes
      );
    });

    it("Should add user to inference whitelist", async function () {
      isInInfWhitelist = await whitelistSC
        .connect(otherAccount)
        .isInInferenceWhitelist(projectID);
      expect(isInInfWhitelist).to.equal(true);
    });

    it("Should user have set the number of inference times", async function () {
      inference_times = await whitelistSC
        .connect(otherAccount)
        .inferenceNumberRemaining(projectID);
      expect(inference_times).to.equal(_inferenceTimes);
    });

    it("Only owner should check inference times of other users", async function () {
      inference_times = await whitelistSC.controlInferences(
        projectID,
        otherAccount
      );
      expect(inference_times).to.equal(_inferenceTimes);

      await expect(
        whitelistSC
          .connect(otherAccount)
          .controlInferences(projectID, otherAccount)
      ).to.be.reverted;
    });

    it("Reduce inference times", async function () {
      await whitelistSC.connect(otherAccount).reduceInferenceTrials(projectID);
      inference_times = await whitelistSC
        .connect(otherAccount)
        .inferenceNumberRemaining(projectID);
      expect(inference_times).to.equal(_inferenceTimes - 1);
    });

    it("Should return false on whitelistInference when number of inferences is 0", async function () {
      for (let i = 0; i < 5; i++) {
        await whitelistSC
          .connect(otherAccount)
          .reduceInferenceTrials(projectID);
      }

      inference_times = await whitelistSC
        .connect(otherAccount)
        .inferenceNumberRemaining(projectID);
      expect(inference_times).to.equal(0);

      expect(
        await whitelistSC
          .connect(otherAccount)
          .isInInferenceWhitelist(projectID)
      ).to.equal(false);
    });

    it("Should return false on whitelistInference when account is not referenced", async function () {
      expect(
        await whitelistSC
          .connect(randomAccount)
          .isInInferenceWhitelist(projectID)
      ).to.equal(false);
      expect(
        await whitelistSC.controlInferences(projectID, randomAccount)
      ).to.equal(0);
    });
  });

  describe("Just Owner can add, remove & control whitelists", function () {
    let whitelistSC;
    let projectID;
    let _inferenceTimes;
    let otherAccount;
    let randomAccount;

    beforeEach(async function () {
      const {
        whitelistSC: _whitelistSC,
        owner,
        otherAccount: _otherAccount,
        randomAccount: _randomAccount,
      } = await loadFixture(deployWhitelistFixture);

      projectID = 77;
      _inferenceTimes = 5;
      whitelistSC = _whitelistSC;
      otherAccount = _otherAccount;
      randomAccount = _randomAccount;
    });

    it("User can't add user to whitelist", async function () {
      await expect(
        whitelistSC
          .connect(otherAccount)
          .addWhitelistUser(projectID, otherAccount)
      ).to.be.reverted;

      isInWhitelistOwner = await whitelistSC.isInWhiteListMaster(
        projectID,
        otherAccount
      );

      expect(isInWhitelistOwner).to.equal(false);
    });

    it("User can't add user to inferenceWhitelist", async function () {
      await expect(
        whitelistSC
          .connect(otherAccount)
          .addInferenceWhitelist(projectID, otherAccount, _inferenceTimes)
      ).to.be.reverted;
      expect(
        await whitelistSC.controlInferences(projectID, otherAccount)
      ).to.equal(0);
    });
  });
});
