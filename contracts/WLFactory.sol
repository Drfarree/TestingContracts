// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./WLImplementation.sol";

contract WhitelistFactory is Ownable {
    mapping(string => address) public whitelistContracts;

    event WhitelistContractCreated(
        string indexed projectId,
        address indexed newContract,
        address owner
    );

    function createWhitelistContract(string calldata projectId) public onlyOwner {
        require(
            whitelistContracts[projectId] == address(0),
            "Contract with this projectId already exists"
        );
        Whitelist newContract = new Whitelist();
        newContract.transferOwnership(msg.sender);
        whitelistContracts[projectId] = address(newContract);
        emit WhitelistContractCreated(
            projectId,
            address(newContract),
            msg.sender
        );
    }

        // Low level create2 contract
    function createContract(bytes memory bytecode, uint256 salt, string calldata projectId) onlyOwner external {
        require(whitelistContracts[projectId] == address(0), "Contract with this projectId already exists");
        address newContract;
        assembly {
            newContract := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        require(newContract != address(0), "Contract creation failed");
        whitelistContracts[projectId] = newContract;
        emit WhitelistContractCreated(projectId, address(newContract), msg.sender);
    }

    
    function getWhitelistContract(string calldata projectId) public view returns (address) {
        return whitelistContracts[projectId];
    }

    function isAddressWhitelisted(string calldata projectId, address _address) public view returns (bool) {
        address contractAddress = whitelistContracts[projectId];
        (bool success, bytes memory data) = contractAddress.staticcall(
            abi.encodeWithSignature("isAddressWhitelisted(address)", _address)
        );
        require(success, "Static call failed");
        return abi.decode(data, (bool));
    }

    function addAddressToWhitelist(string calldata projectId, address _address) public onlyOwner returns (bool) {
        address contractAddress = whitelistContracts[projectId];
        (bool success, ) = contractAddress.call(
            abi.encodeWithSignature("addAddress(address)", _address)
        );
        require(success, "WL call failed");
        return success;
    }

    function removeAddressFromWhitelist(string calldata projectId, address _address) public onlyOwner returns (bool) {
        address contractAddress = whitelistContracts[projectId];
        (bool success, ) = contractAddress.call(
            abi.encodeWithSignature("removeAddress(address)", _address)
        );
        require(success, "WL call failed");
        return success;
    }
}
