// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Whitelist is Ownable {
    mapping(address => bool) public isWhitelisted;
    address _owner;

    constructor() {
        _owner = msg.sender;
    }

    modifier onlyOwnerContract() {
        require(
            owner() == msg.sender || tx.origin == owner(),
            "Only the owner or owner contracts can call this function"
        );
        _;
    }

    function addAddress(address _address) public onlyOwnerContract {
        require(!isWhitelisted[_address], "Address is already whitelisted");
        isWhitelisted[_address] = true;
    }

    function removeAddress(address _address) public onlyOwnerContract {
        require(isWhitelisted[_address], "Address is not whitelisted");
        isWhitelisted[_address] = false;
    }

    function isAddressWhitelisted(address _address) public view returns (bool) {
        return isWhitelisted[_address];
    }
}
