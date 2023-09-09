// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


pragma solidity ^0.8.0;



interface MyToken {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);

}

contract NodeManager {
    IERC20 private myToken;
    mapping (address => bool) public whitelist;
    mapping (address => uint256) public balances;
    address public owner;
    uint256 private totalDepositedTokens;

    constructor(IERC20 token) {
        myToken = token;
        whitelist[msg.sender] = true; //Añadimos privilegios de WL al owner
        owner = msg.sender; // Asignamos la dirección del remitente como el propietario del contrato
    }

    function transfer(address recipient, uint256 amount) public onlyOwner returns (bool) {
        require(whitelist[recipient] == true, "Not whitelisted");
        require(balances[msg.sender] >= amount, "Insufficient balance.");
        require(recipient != address(0), "Invalid address.");
        balances[msg.sender] -= amount;
        totalDepositedTokens -= amount;
        return myToken.transferFrom(address(this), recipient, amount);

    }

    function deposit(uint256 amount) public onlyWhitelisted {
        require(myToken.balanceOf(msg.sender) >= amount, "Insufficient token balance.");
        require(myToken.allowance(msg.sender, address(this)) >= amount, "Token approval required.");
        balances[msg.sender] += amount;
        myToken.transferFrom(msg.sender, address(this), amount);

        totalDepositedTokens += amount;
    }

    function setTokenApproval(uint256 amount) public {
        myToken.approve(address(this), amount);
    }

    function addToWhitelist(address wallet) public onlyOwner {
        whitelist[wallet] = true;
    }

    function deleteWhitelisted (address wallet) public onlyOwner {
        whitelist[wallet] = false;
    }

    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Sender is not whitelisted.");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    function checkFullBalance() public view returns (uint256) {
        return totalDepositedTokens;

    }

}