// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./P2PDEXImplementation.sol";

contract TokenExchangeP2PFactory {
    address[] public deployedExchanges;
    mapping(address => bool) public lpAddressUsed;

    function createTokenExchangeP2P(address _LP_ADDRESS) public {
        require(!lpAddressUsed[_LP_ADDRESS], "P2P already created");
        TokenExchangeP2P newExchange = new TokenExchangeP2P(_LP_ADDRESS);
        deployedExchanges.push(address(newExchange));
        lpAddressUsed[_LP_ADDRESS] = true;
    }

    function getDeployedExchanges() public view returns (address[] memory) {
        return deployedExchanges;
    }
}
