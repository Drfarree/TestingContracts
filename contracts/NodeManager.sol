// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (token/ERC20/ERC20.sol)

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Whitelist.sol";

pragma solidity ^0.8.0;


contract NodeManager {
    IERC20 private myToken;
    mapping(address => bool) public whitelistEnabled;
    mapping(address => uint256) public balances;
    address public owner;
    uint256 private totalDepositedTokens;
    address private whitelistContract;

    constructor(IERC20 token, address _whitelistContract) {
        myToken = token;
        owner = msg.sender;
        whitelistContract = _whitelistContract;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    function checkFullBalance() public view returns (uint256) {
        return totalDepositedTokens;
    }

    function transfer(address recipient, uint256 amount, string memory _projectName) public onlyOwner returns (bool) {
        // Aquí puedes llamar funciones en el contrato de la lista blanca usando whitelistContract
        bool isWhitelisted = ControlWhitelist(whitelistContract).isInWhiteListMaster(_projectName, recipient);
        myToken.approve(address(this), amount);
        require(isWhitelisted, "Sender is not in the whitelist");
        require(balances[msg.sender] >= amount, "Insufficient balance.");
        require(recipient != address(0), "Invalid address.");
        balances[msg.sender] -= amount;
        totalDepositedTokens -= amount;
        return myToken.transferFrom(address(this), recipient, amount);
    }

    function deposit(uint256 amount) public {
        require(myToken.balanceOf(msg.sender) >= amount, "Insufficient token balance.");
        require(myToken.allowance(msg.sender, address(this)) >= amount, "Token approval required.");
        balances[msg.sender] += amount;
        myToken.transferFrom(msg.sender, address(this), amount);

        totalDepositedTokens += amount;
    }
}
