// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./LPImplementation.sol";

contract LiquidityPoolFactory {
    // Mapping to link owners with the addresses of their liquidity pools
    mapping(address => address[]) public userPools;

    mapping(address => mapping(address => bool)) public tokensUsed;
    address[] public deployedPools;

    /**
     * @dev Create a new liquidity pool contract without initializing it.
     * @param token The ERC20 token contract to be used in the liquidity pool.
     */
    function createLiquidityPool(IERC20Extented token) external {
        require(!tokensUsed[msg.sender][address(token)], "You can only create one liquidity pool per token.");

        LPImplementation newPool = new LPImplementation(token, msg.sender);
        address poolAddress = address(newPool);

        userPools[msg.sender].push(poolAddress);
        deployedPools.push(poolAddress);

        tokensUsed[msg.sender][address(token)] = true;
    }


    /**
     * @dev Get the list of liquidity pool contracts created by the owner.
     * @param owner The address of the owner.
     * @return An array of addresses of liquidity pool contracts created by the owner.
     */
    function getPoolsByOwner(address owner) external view returns (address[] memory) {
        return userPools[owner];
    }

    /**
     * @dev Get the list of all deployed liquidity pool contract addresses.
     * @return An array of addresses of deployed liquidity pool contracts.
     */
    function getAllPools() external view returns (address[] memory) {
        return deployedPools;
    }
}
