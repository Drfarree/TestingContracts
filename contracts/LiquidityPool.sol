// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IERC20Extended
 * @dev Extends the ERC-20 standard with an additional 'decimals' function to get
 * the number of decimal places for a token.
 */

abstract contract IERC20Extented is IERC20 {
    /**
     * @dev Get the number of decimal places for the token.
     * @return The number of decimal places.
     */
    function decimals() public virtual view returns (uint8); 
}

/**
 * @title LiquidityPool
 * @dev A contract to manage a simple liquidity pool for token and ETH swaps.
 */

contract LiquidityPoolV2 {
    address private owner;
    IERC20Extented private token;
    uint256 public tokenBalance;
    uint256 public ethBalance;
    uint8 public tokenDecimals;

    constructor(IERC20Extented _tokenAddress) {
        owner = msg.sender;
        token = _tokenAddress;
        ethBalance = address(this).balance;
        tokenDecimals = token.decimals();
    }

    /**
     * @dev Modifier to restrict access to only the owner of the contract.
     */
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only the contract owner can call this function"
        );
        _;
    }

    event PoolInitialized(
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 initialPrice
    );
    event SwapETHForTokens(
        address sender,
        uint256 ethAmount,
        uint256 tokenAmount
    );
    event SwapTokensForETH(
        address sender,
        uint256 tokenAmount,
        uint256 ethAmount
    );
    event LiquidityRefilled(uint256 tokenAmount, uint256 ethAmount);
    event ETHWithdrawn(address recipient, uint256 amount);
    event TokenWithdrawn(address recipient, uint256 amount);
    
    
    /**
     * @dev Initialize the liquidity pool by depositing tokens and ETH into the contract.
     * @param initialTokenAmount The amount of tokens to deposit.
     */
    function initializePool(uint256 initialTokenAmount) onlyOwner external payable {
        require(tokenBalance == 0 && ethBalance == 0, "Pool already initialized");

        require(initialTokenAmount > 0, "Token amount must be greater than zero");
        require(msg.value > 0, "ETH amount must be greater than zero");
        require(token.balanceOf(msg.sender) >= initialTokenAmount, "Insufficient tokens");


        uint256 initialPrice = (msg.value * 10**tokenDecimals) / initialTokenAmount;

        // Transfer tokens to the liquidity pool contract
        token.transferFrom(msg.sender, address(this), initialTokenAmount);

        // Update token and ETH balances 
        tokenBalance = initialTokenAmount;
        ethBalance = msg.value;

        // Emit an event to indicate that the pool has been initialized
        emit PoolInitialized(initialTokenAmount, msg.value, initialPrice);
    }

    /**
     * @dev Refill the liquidity pool at any time.
     * @param tokenAmount The amount of tokens to deposit.
     */
    function refillLiquidity(uint256 tokenAmount) external payable onlyOwner {
        require(tokenAmount > 0, "Token amount must be greater than zero");
        require(msg.value > 0, "ETH amount must be greater than zero");


        // Transfer tokens to the liquidity pool contract
        token.transferFrom(msg.sender, address(this), tokenAmount);

        // Update token and ETH balances
        tokenBalance += tokenAmount;
        ethBalance += msg.value;

        // Emit an event to indicate that liquidity has been refilled
        emit LiquidityRefilled(tokenAmount, msg.value);
    }

     /**
     * @dev Allow swapping ETH for tokens.
     */
    function swapETHForTokens() external payable {
        require(msg.value > 0, "ETH amount must be greater than zero");
        require(ethBalance > 0, "No liquidity in the pool");

        // Calculate the amount of tokens to transfer
        uint256 tokenAmount = (msg.value * tokenBalance) / ethBalance;

        // Transfer tokens to the user
        token.transfer(msg.sender, tokenAmount);

        // Update token and ETH balances
        tokenBalance -= tokenAmount;
        ethBalance += msg.value;

        // Emit an event to indicate that the swap has been completed
        emit SwapETHForTokens(msg.sender, msg.value, tokenAmount);
    }

    /**
     * @dev Allow swapping tokens for ETH.
     * @param tokenAmount The amount of tokens to swap.
     */
    function swapTokensForETH(uint256 tokenAmount) external {
        require(token.balanceOf(msg.sender) >= tokenAmount, "Insufficient tokens");
        require(ethBalance > 0, "No liquidity in the pool");

        // Calculate the amount of ETH to transfer
        uint256 ethAmount = (tokenAmount * ethBalance) / tokenBalance;

        // Transfer tokens to the liquidity pool contract
        token.transferFrom(msg.sender, address(this), tokenAmount);

        // Transfer ETH to the user
        payable(msg.sender).transfer(ethAmount);

        // Update token and ETH balances
        tokenBalance += tokenAmount;
        ethBalance -= ethAmount;

        // Emit an event to indicate that the swap has been completed
        emit SwapTokensForETH(msg.sender, tokenAmount, ethAmount);
    }

    /**
     * @dev Allows the owner to withdraw ETH from the contract.
     * @param amount Amount of ETH to withdraw.
     */
    function withdrawETH(uint256 amount) external onlyOwner {
        require(ethBalance >= amount, "Insufficient ETH balance");

        // Transfer ETH to the owner 
        payable(owner).transfer(amount);

        // Update ETH balance 
        ethBalance -= amount;

        // Emit an event to indicate that ETH has been withdrawn
        emit ETHWithdrawn(owner, amount);
    }

    /**
     * @dev Allows the owner to withdraw tokens from the contract.
     * @param amount Amount of tokens to withdraw.
     */
    function withdrawToken(uint256 amount) external onlyOwner {
        require(token.balanceOf(address(this)) >= amount, "Insufficient token balance");

        // Transfer tokens to the owner 
        token.transfer(owner, amount);

        // Update token balance
        tokenBalance -= amount;

        // Emit an event to indicate that tokens have been withdrawn
        emit TokenWithdrawn(owner, amount);
    }

    /**
     * @dev Get the current balance of the pool.
     * @return Token balance and ETH balance.
     */
    function getPoolBalance() external view returns (uint256, uint256) {
        return (tokenBalance, ethBalance);
    }

    /**
     * @dev Get the price of the pool (tokens/ETH).
     * @return Pool price.
     */
    function getTokenPrice() public view returns (uint256) {
        require(ethBalance > 0 && tokenBalance > 0, "Pool not initialized");

        // Calculate the price of the pool (tokens/ETH)
        uint256 poolPrice = (ethBalance * 10**tokenDecimals) / tokenBalance;

        return poolPrice;
    }
}
