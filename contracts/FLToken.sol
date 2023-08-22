// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FLToken is ERC20, Ownable {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address tokenOwner,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _mint(tokenOwner, initialSupply);
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }  

    function mintTokens(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }

    function burnTokens(address account, uint256 amount) public onlyOwner {
        _burn(account, amount);
    }
}
