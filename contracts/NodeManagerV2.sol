// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenDistribution is Ownable {
    IERC20 public token;

    mapping(address => uint256) public withdrawalLimits;

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
    }

    function deposit(uint256 _totalAmount, address[] calldata _users, uint256[] calldata _amounts) external {
        require(_totalAmount > 0, "Total amount must be greater than zero");
        require(_users.length == _amounts.length, "Array lengths do not match");
        
        for (uint256 i = 0; i < _users.length; i++) {
            address user = _users[i];
            uint256 amount = _amounts[i];
            
            require(amount > 0, "Amount must be greater than zero");
            require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
            
            withdrawalLimits[user] += amount;
        }
    }

    function withdraw(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than zero");
        uint256 userLimit = withdrawalLimits[msg.sender];
        require(userLimit >= _amount, "Exceeded withdrawal limit");
        
        withdrawalLimits[msg.sender] -= _amount;
        require(token.transfer(msg.sender, _amount), "Transfer failed");
    }
}
