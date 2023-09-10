// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ControlWhitelist.sol";

pragma solidity ^0.8.0;

/**
 * @title NodeManager
 * @dev This contract allows the owner to manage tokens and transfer them to addresses whitelisted by the ControlWhitelist contract.
 */
contract NodeManager {
    IERC20 private myToken;
    mapping (address => bool) public whitelistEnabled; // Cambio de nombre aquí
    mapping (address => uint256) public balances;
    address public owner;
    uint256 private totalDepositedTokens;
    address private whitelistContract; 

    /**
     * @dev Constructor to initialize the NodeManager contract.
     * @param token The address of the ERC20 token contract.
     * @param whitelist The address of the ControlWhitelist contract.
     */
    constructor(IERC20 token, address whitelist) {
        myToken = token; // Añadimos privilegios de WL al owner
        owner = msg.sender; // Asignamos la dirección del remitente como el propietario del contrato
        whitelistContract = whitelist;
    }

    /**
     * @dev Modifier to restrict access to only the owner of the contract.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    /**
     * @dev Get the total balance of deposited tokens.
     * @return The total balance of deposited tokens.
     */
    function checkFullBalance() public view returns (uint256) {
        return totalDepositedTokens;
    }

    /**
     * @dev Transfer tokens to a recipient if they are whitelisted.
     * @param recipient The address to which tokens will be transferred.
     * @param amount The amount of tokens to transfer.
     * @param _projectName The name of the project associated with the recipient whitelist.
     * @return A boolean indicating whether the transfer was successful.
     */
    function transfer(address recipient, uint256 amount, string memory _projectName) public onlyOwner returns (bool) {
        bool isWhitelisted = ControlWhitelist(whitelistContract).isInWhiteListMaster(_projectName, recipient);
        myToken.approve(address(this), amount);
        require(isWhitelisted, "Sender is not in the whitelist");
        require(balances[msg.sender] >= amount, "Insufficient balance.");
        require(recipient != address(0), "Invalid address.");
        balances[msg.sender] -= amount;
        totalDepositedTokens -= amount;
        return myToken.transferFrom(address(this), recipient, amount);
    }

    /**
     * @dev Deposit tokens into the NodeManager contract.
     * @param amount The amount of tokens to deposit.
     */
    function deposit(uint256 amount) public {
        require(myToken.balanceOf(msg.sender) >= amount, "Insufficient token balance.");
        require(myToken.allowance(msg.sender, address(this)) >= amount, "Token approval required.");
        balances[msg.sender] += amount;
        myToken.transferFrom(msg.sender, address(this), amount);

        totalDepositedTokens += amount;
    }
}
