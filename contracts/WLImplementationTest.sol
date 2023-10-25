// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./WLImplementation.sol";

contract TestContract {
    function addAddressToWhitelist(
        Whitelist whitelist,
        address _address
    ) public {
        whitelist.addAddress(_address);
    }

    function removeAddressFromWhitelist(
        Whitelist whitelist,
        address _address
    ) public {
        whitelist.removeAddress(_address);
    }

    function viewWhitelist(
        Whitelist whitelist,
        address _address
    ) public view returns (bool) {
        return whitelist.isAddressWhitelisted(_address);
    }
}
