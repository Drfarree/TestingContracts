// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NodeManager {
    IERC20 public myToken;
    address public owner;
    uint256 private totalDepositedTokens;
    mapping (address => uint256) public balances;

    // Estructura para almacenar los porcentajes asociados a las direcciones
    struct UserShare {
        address user;
        uint256 percentage;
    }

    // Mapeo para almacenar los porcentajes de cada dirección
    mapping(address => uint256) public userPercentages;

    // Array de porcentajes asociados a cada dirección
    UserShare[] public userShares;

    constructor(IERC20 token) {
        myToken = token;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    function checkFullBalance() public view returns (uint256) {
        return totalDepositedTokens;
    }

    // Función para asociar direcciones con porcentajes
    function setUserShares(address[] memory users, uint256[] memory percentages) public onlyOwner {
        require(users.length == percentages.length, "Arrays must have the same length.");
        uint256 totalPercentage = 0;

        for (uint256 i = 0; i < users.length; i++) {
            totalPercentage += percentages[i];
            userPercentages[users[i]] = percentages[i];
            userShares.push(UserShare(users[i], percentages[i]));
        }

        require(totalPercentage == 100, "Total percentage must equal 100.");
    }

    function deposit(uint256 amount) public {
        require(myToken.balanceOf(msg.sender) >= amount, "Insufficient token balance.");
        require(myToken.allowance(msg.sender, address(this)) >= amount, "Token approval required");

        // Calcular y asignar tokens a cada dirección según los porcentajes
        for (uint256 i = 0; i < userShares.length; i++) {
            address user = userShares[i].user;
            uint256 percentage = userShares[i].percentage;
            uint256 userShare = (amount * percentage) / 100;
            balances[user] += userShare;
        }

        myToken.transferFrom(msg.sender, address(this), amount);
        totalDepositedTokens += amount;
    }

    function calculateTokensToClaim(address user) public view returns (uint256) {
        return balances[user];
    }

    function claimTokens() public {
        uint256 tokensToClaim = calculateTokensToClaim(msg.sender);
        require(tokensToClaim > 0, "No tokens to claim.");
        require(totalDepositedTokens >= tokensToClaim, "Not enough tokens in the contract.");

        totalDepositedTokens -= tokensToClaim;
        balances[msg.sender] -= tokensToClaim;

        myToken.transfer(msg.sender, tokensToClaim);
    }

    function tokenDistributed() public view returns (IERC20) {
        return myToken;
    }
}
