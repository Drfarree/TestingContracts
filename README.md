# Testing Smart Contracts

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
# npx hardhat run scripts/deploy.js
```

### Testing list

All the contracts of the project have been tested. Below is a list of the tests carried out for each contract.

[FactoryLP.sol](test/FactoryLP.js): This contract is a factory of liquidity pools (**8 tests**)

[FactoryP2P.sol](test/FactoryP2P.js): This contract is a factory of P2P smart contract (**5 tests**)

[FLTokenV2.sol](test/FLTokenV2.js): This contract is the implementation of an ERC20 token (**8 tests**)

[LiquidityPool.sol](test/LiquidityPoolV2.js): This contract is a liquidity pool for an ERC20 token in a development environment (**8 tests**)

[LPImplementation.sol](test/LiquidityPoolV2.js): Implementation of a liquidity pool to be deployed by the factory (**8 tests**)

[NodeManager.sol](test/NodeManager.js): This contract allows for the deposit and withdrawal of ERC20 tokens. (**12 tests**)

[P2PDEXImplementation.sol](test/P2PDEXImplementation.js): This contract allows the generation of offers to buy and sell ERC20 tokens (**21 tests**)

[WLFactory.sol](test/WLFactory.js): This contract is a whitelist contract factory (**11 tests**)

[WLImplementation.sol](test/WLImplementation.js): This contract allows adding and removing users from a whitelist (**17 tests**)

