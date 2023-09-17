// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FLToken
 * @dev Extends ERC20 and Ownable to create a custom ERC20 token.
 */
contract FLTokenV2 is ERC20, Ownable {
    uint8 private _decimals;

    /**
     * @dev Constructor to initialize the FLToken contract.
     * @param name The name of the token.
     * @param symbol The symbol of the token.
     * @param initialSupply The initial supply of tokens.
     * @param tokenOwner The address that will initially own all tokens.
     * @param decimals_ The number of decimal places for the token.
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address tokenOwner,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(tokenOwner, initialSupply*10**_decimals);
        
    }

    /**
     * @dev Get the number of decimals for the token.
     * @return The number of decimal places for the token.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }  

    /**
     * @dev Mint additional tokens to an account.
     * @param account The account to which tokens will be minted.
     * @param amount The amount of tokens to mint.
     */
    function mintTokens(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }
    
    /**
     * @dev Burn tokens from an account.
     * @param account The account from which tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function burnTokens(address account, uint256 amount) public onlyOwner {
        _burn(account, amount);
    }
}
