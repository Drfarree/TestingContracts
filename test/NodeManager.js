// const { expect } = require("chai");
// const {
//   loadFixture,
// } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
// const { ethers } = require("hardhat");

// describe("NodeManager", function () {
//   async function deployContractsFixture() {
//     const [owner, otherAccount] = await ethers.getSigners();

//     // Desplegar el contrato FLToken
//     const FLToken = await ethers.getContractFactory("FLToken");
//     const flToken = await FLToken.deploy(
//       "My Token",
//       "MTK",
//       100000,
//       owner.address,
//       18
//     );

//     // console.log("FLToken deployed at:", flToken.target); // Imprime la dirección de FLToken
//     // console.log("Owner address", owner.address)

//     // Desplegar el contrato NodeManager pasando la dirección del contrato FLToken
//     const NodeManager = await ethers.getContractFactory("NodeManager");
//     const nodeManager = await NodeManager.deploy(flToken.target);

//     // console.log("NodeManager deployed at:", nodeManager.target); // Imprime la dirección de NodeManager

//     return { flToken, nodeManager, owner, otherAccount };
//   }

//   describe("Deployment", function () {
//     it("Should deploy NodeManager contract", async function () {
//       const { flToken, nodeManager } = await loadFixture(
//         deployContractsFixture
//       );

//       // Realizar pruebas según el comportamiento esperado
//       expect(await flToken.name()).to.equal("My Token");
//       expect(await nodeManager.owner()).to.equal(await flToken.owner());
//       // Agrega más comprobaciones según tus contratos
//     });
//   });

//   describe("Deposit tokens by owner", function () {
//     it("Should deposit a concret amount of tokens on the smart contract", async function () {
//       const depositAmount = 1000;
//       const { flToken, nodeManager, owner } = await loadFixture(
//         deployContractsFixture
//       );

//       await flToken.connect(owner).approve(nodeManager.target, depositAmount);
//       const allowanceBeforeTransact = await flToken.allowance(
//         owner.address,
//         nodeManager.target
//       );

//       expect(allowanceBeforeTransact).to.equal(depositAmount);

//       await nodeManager.connect(owner).deposit(depositAmount);

//       const NodeManagerBalance = await nodeManager.checkFullBalance();

//       expect(NodeManagerBalance).to.equal(depositAmount);

//       //Allowance = 0 after deposit
//       const allowanceAfterTransact = await flToken.allowance(
//         owner.address,
//         nodeManager.target
//       );
//       expect(allowanceAfterTransact).to.equal(0);
//     });
//   });

//   describe("")



// });
