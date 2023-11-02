const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("Factory whitelist deploy", function () {
  async function deployContractsFixture() {
    const [owner, otherAccount, otherAccount2] = await ethers.getSigners();

    const WhitelistFactory = await ethers.getContractFactory(
      "WhitelistFactory"
    );
    const whitelistFactory = await WhitelistFactory.deploy();

    const factoryAddress = whitelistFactory.target;

    return {
      owner,
      otherAccount,
      whitelistFactory,
      otherAccount2,
      factoryAddress,
    };
  }

  describe("Deployment", function () {
    it("Should deploy whitelistFactory contract", async function () {
      const { owner, whitelistFactory, factoryAddress } = await loadFixture(
        deployContractsFixture
      );

      expect(factoryAddress).to.equal(factoryAddress);
    });
  });

  describe("Create and test whitelist functions", function () {
    let otherAccount2;
    let otherAccount;
    let whitelistFactory;
    let owner;

    beforeEach(async function () {
      const {
        otherAccount2: _otherAccount2,
        owner: _owner,
        otherAccount: _otherAccount,
        whitelistFactory: _whitelistFactory,
      } = await loadFixture(deployContractsFixture);

      (otherAccount2 = _otherAccount2),
        (owner = _owner),
        (otherAccount = _otherAccount),
        (whitelistFactory = _whitelistFactory);
    });

    it("Should deploy a whitelist smart contract with create function", async function () {
      const projectID = "1";
      await whitelistFactory.createWhitelistContract(projectID);

      whitelist = await whitelistFactory.getWhitelistContract(projectID);
      expect(await whitelistFactory.getWhitelistContract(projectID)).to.equal(
        whitelist
      );
    });

    it("Should deploy a whitelist smart contract with create low level function", async function () {
      const projectID = "7";
      const salt = 12345;

      const Whitelist = await ethers.getContractFactory("Whitelist");
      const whitelist = await Whitelist.deploy();
      const bytecode = await ethers.provider.getCode(whitelist.target);

      const byt =
        "0x608060405234801561001057600080fd5b5061002d61002261007360201b60201c565b61007b60201b60201c565b33600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061013f565b600033905090565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b610aaf8061014e6000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c80634ba79dfe1161005b5780634ba79dfe146100fe578063715018a61461011a5780638da5cb5b14610124578063f2fde38b146101425761007d565b806313f44d101461008257806338eada1c146100b25780633af32abf146100ce575b600080fd5b61009c60048036038101906100979190610773565b61015e565b6040516100a991906107bb565b60405180910390f35b6100cc60048036038101906100c79190610773565b6101b4565b005b6100e860048036038101906100e39190610773565b61034d565b6040516100f591906107bb565b60405180910390f35b61011860048036038101906101139190610773565b61036d565b005b610122610506565b005b61012c61051a565b60405161013991906107e5565b60405180910390f35b61015c60048036038101906101579190610773565b610543565b005b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff169050919050565b3373ffffffffffffffffffffffffffffffffffffffff166101d361051a565b73ffffffffffffffffffffffffffffffffffffffff16148061022757506101f861051a565b73ffffffffffffffffffffffffffffffffffffffff163273ffffffffffffffffffffffffffffffffffffffff16145b610266576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161025d90610883565b60405180910390fd5b600160008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16156102f3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102ea906108ef565b60405180910390fd5b60018060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff02191690831515021790555050565b60016020528060005260406000206000915054906101000a900460ff1681565b3373ffffffffffffffffffffffffffffffffffffffff1661038c61051a565b73ffffffffffffffffffffffffffffffffffffffff1614806103e057506103b161051a565b73ffffffffffffffffffffffffffffffffffffffff163273ffffffffffffffffffffffffffffffffffffffff16145b61041f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161041690610883565b60405180910390fd5b600160008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff166104ab576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104a29061095b565b60405180910390fd5b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff02191690831515021790555050565b61050e6105c6565b6105186000610644565b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b61054b6105c6565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16036105ba576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105b1906109ed565b60405180910390fd5b6105c381610644565b50565b6105ce610708565b73ffffffffffffffffffffffffffffffffffffffff166105ec61051a565b73ffffffffffffffffffffffffffffffffffffffff1614610642576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161063990610a59565b60405180910390fd5b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b600033905090565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061074082610715565b9050919050565b61075081610735565b811461075b57600080fd5b50565b60008135905061076d81610747565b92915050565b60006020828403121561078957610788610710565b5b60006107978482850161075e565b91505092915050565b60008115159050919050565b6107b5816107a0565b82525050565b60006020820190506107d060008301846107ac565b92915050565b6107df81610735565b82525050565b60006020820190506107fa60008301846107d6565b92915050565b600082825260208201905092915050565b7f4f6e6c7920746865206f776e6572206f72206f776e657220636f6e747261637460008201527f732063616e2063616c6c20746869732066756e6374696f6e0000000000000000602082015250565b600061086d603883610800565b915061087882610811565b604082019050919050565b6000602082019050818103600083015261089c81610860565b9050919050565b7f4164647265737320697320616c72656164792077686974656c69737465640000600082015250565b60006108d9601e83610800565b91506108e4826108a3565b602082019050919050565b60006020820190508181036000830152610908816108cc565b9050919050565b7f41646472657373206973206e6f742077686974656c6973746564000000000000600082015250565b6000610945601a83610800565b91506109508261090f565b602082019050919050565b6000602082019050818103600083015261097481610938565b9050919050565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b60006109d7602683610800565b91506109e28261097b565b604082019050919050565b60006020820190508181036000830152610a06816109ca565b9050919050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b6000610a43602083610800565b9150610a4e82610a0d565b602082019050919050565b60006020820190508181036000830152610a7281610a36565b905091905056fea2646970667358221220406fd47beebd6bdc136ff98947b3a8ec1bbd8f86dceeb4e1e5b8bb40cffda2c364736f6c63430008120033";

      await whitelistFactory.createContract(byt, salt, projectID);

      whitelistDeployed = await whitelistFactory.getWhitelistContract(
        projectID
      );

      expect(await whitelistFactory.getWhitelistContract(projectID)).to.equal(
        whitelistDeployed
      );
    });

    it("Only owner can create smart contract", async function () {
      const projectID = "1";
      await expect(
        whitelistFactory
          .connect(otherAccount)
          .createWhitelistContract(projectID)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Only owner can create2 smart contract", async function () {
      const projectID = "1";
      const byt =
        "0x608060405234801561001057600080fd5b5061002d61002261007360201b60201c565b61007b60201b60201c565b33600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061013f565b600033905090565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b610aaf8061014e6000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c80634ba79dfe1161005b5780634ba79dfe146100fe578063715018a61461011a5780638da5cb5b14610124578063f2fde38b146101425761007d565b806313f44d101461008257806338eada1c146100b25780633af32abf146100ce575b600080fd5b61009c60048036038101906100979190610773565b61015e565b6040516100a991906107bb565b60405180910390f35b6100cc60048036038101906100c79190610773565b6101b4565b005b6100e860048036038101906100e39190610773565b61034d565b6040516100f591906107bb565b60405180910390f35b61011860048036038101906101139190610773565b61036d565b005b610122610506565b005b61012c61051a565b60405161013991906107e5565b60405180910390f35b61015c60048036038101906101579190610773565b610543565b005b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff169050919050565b3373ffffffffffffffffffffffffffffffffffffffff166101d361051a565b73ffffffffffffffffffffffffffffffffffffffff16148061022757506101f861051a565b73ffffffffffffffffffffffffffffffffffffffff163273ffffffffffffffffffffffffffffffffffffffff16145b610266576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161025d90610883565b60405180910390fd5b600160008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16156102f3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102ea906108ef565b60405180910390fd5b60018060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff02191690831515021790555050565b60016020528060005260406000206000915054906101000a900460ff1681565b3373ffffffffffffffffffffffffffffffffffffffff1661038c61051a565b73ffffffffffffffffffffffffffffffffffffffff1614806103e057506103b161051a565b73ffffffffffffffffffffffffffffffffffffffff163273ffffffffffffffffffffffffffffffffffffffff16145b61041f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161041690610883565b60405180910390fd5b600160008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff166104ab576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104a29061095b565b60405180910390fd5b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff02191690831515021790555050565b61050e6105c6565b6105186000610644565b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b61054b6105c6565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16036105ba576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105b1906109ed565b60405180910390fd5b6105c381610644565b50565b6105ce610708565b73ffffffffffffffffffffffffffffffffffffffff166105ec61051a565b73ffffffffffffffffffffffffffffffffffffffff1614610642576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161063990610a59565b60405180910390fd5b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b600033905090565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061074082610715565b9050919050565b61075081610735565b811461075b57600080fd5b50565b60008135905061076d81610747565b92915050565b60006020828403121561078957610788610710565b5b60006107978482850161075e565b91505092915050565b60008115159050919050565b6107b5816107a0565b82525050565b60006020820190506107d060008301846107ac565b92915050565b6107df81610735565b82525050565b60006020820190506107fa60008301846107d6565b92915050565b600082825260208201905092915050565b7f4f6e6c7920746865206f776e6572206f72206f776e657220636f6e747261637460008201527f732063616e2063616c6c20746869732066756e6374696f6e0000000000000000602082015250565b600061086d603883610800565b915061087882610811565b604082019050919050565b6000602082019050818103600083015261089c81610860565b9050919050565b7f4164647265737320697320616c72656164792077686974656c69737465640000600082015250565b60006108d9601e83610800565b91506108e4826108a3565b602082019050919050565b60006020820190508181036000830152610908816108cc565b9050919050565b7f41646472657373206973206e6f742077686974656c6973746564000000000000600082015250565b6000610945601a83610800565b91506109508261090f565b602082019050919050565b6000602082019050818103600083015261097481610938565b9050919050565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b60006109d7602683610800565b91506109e28261097b565b604082019050919050565b60006020820190508181036000830152610a06816109ca565b9050919050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b6000610a43602083610800565b9150610a4e82610a0d565b602082019050919050565b60006020820190508181036000830152610a7281610a36565b905091905056fea2646970667358221220406fd47beebd6bdc136ff98947b3a8ec1bbd8f86dceeb4e1e5b8bb40cffda2c364736f6c63430008120033";
      const salt = 123141231;
      await expect(
        whitelistFactory
          .connect(otherAccount)
          .createContract(byt, salt, projectID)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Test smart contract deployed calls", function () {
    let otherAccount2;
    let otherAccount;
    let whitelistFactory;
    let owner;

    beforeEach(async function () {
      const {
        otherAccount2: _otherAccount2,
        owner: _owner,
        otherAccount: _otherAccount,
        whitelistFactory: _whitelistFactory,
      } = await loadFixture(deployContractsFixture);

      (otherAccount2 = _otherAccount2),
        (owner = _owner),
        (otherAccount = _otherAccount),
        (whitelistFactory = _whitelistFactory);

      projectID = "12";
      projectIDV2 = "8"

      await whitelistFactory.createWhitelistContract(projectID);

      whitelistContract = await whitelistFactory.getWhitelistContract(
        projectID
      );
    });

    it("Add address to specific whitelist", async function () {
      await whitelistFactory.addAddressToWhitelist(projectID, otherAccount);

      success = await whitelistFactory.isAddressWhitelisted(
        projectID,
        otherAccount
      );
      expect(success).to.equal(true);
    });

    it("Add more than one address to specific whitelist", async function () {
      await whitelistFactory.addAddressToWhitelist(projectID, otherAccount);

      success = await whitelistFactory.isAddressWhitelisted(
        projectID,
        otherAccount
      );
      expect(success).to.equal(true);

      await whitelistFactory.addAddressToWhitelist(projectID, otherAccount2);

      success2 = await whitelistFactory.isAddressWhitelisted(
        projectID,
        otherAccount2
      );
      expect(success2).to.equal(true);
    });

    it("Only owner can add address to whitelist", async function () {
      await expect(
        whitelistFactory
          .connect(otherAccount)
          .addAddressToWhitelist(projectID, otherAccount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Remove address to specific whitelist", async function () {
      await whitelistFactory.addAddressToWhitelist(projectID, otherAccount);

      success = await whitelistFactory.isAddressWhitelisted(
        projectID,
        otherAccount
      );
      expect(success).to.equal(true);

      await whitelistFactory.removeAddressFromWhitelist(
        projectID,
        otherAccount
      );
      success = await whitelistFactory.isAddressWhitelisted(
        projectID,
        otherAccount
      );
      expect(success).to.equal(false);
    });

    it("Only owner can remove address to specific whitelist", async function () {
      await whitelistFactory.addAddressToWhitelist(projectID, otherAccount);

      success = await whitelistFactory.isAddressWhitelisted(
        projectID,
        otherAccount
      );
      expect(success).to.equal(true);

      await expect(
        whitelistFactory
          .connect(otherAccount)
          .removeAddressFromWhitelist(projectID, otherAccount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      success = await whitelistFactory.isAddressWhitelisted(
        projectID,
        otherAccount
      );
      expect(success).to.equal(true);
    });

    it("Can add user to multiple whitelists", async function () {
      await whitelistFactory.addAddressToWhitelist(projectID, otherAccount);

      success = await whitelistFactory.isAddressWhitelisted(
        projectID,
        otherAccount
      );
      expect(success).to.equal(true);

      await whitelistFactory.createWhitelistContract(projectIDV2)
      await whitelistFactory.addAddressToWhitelist(projectIDV2, otherAccount);

      success = await whitelistFactory.isAddressWhitelisted(
        projectIDV2,
        otherAccount
      );
      expect(success).to.equal(true);
    });
  });
});
