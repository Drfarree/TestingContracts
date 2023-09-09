// SPDX-License-Identifier: MIT

/*
 ______                                           ________         __                           
 /      \                                         /        |       /  |                          
/$$$$$$  | __   __   __   ______    ______        $$$$$$$$/______  $$ |   __   ______   _______  
$$ \__$$/ /  | /  | /  | /      \  /      \          $$ | /      \ $$ |  /  | /      \ /       \ 
$$      \ $$ | $$ | $$ | $$$$$$  |/$$$$$$  |         $$ |/$$$$$$  |$$ |_/$$/ /$$$$$$  |$$$$$$$  |
 $$$$$$  |$$ | $$ | $$ | /    $$ |$$ |  $$ |         $$ |$$ |  $$ |$$   $$<  $$    $$ |$$ |  $$ |
/  \__$$ |$$ \_$$ \_$$ |/$$$$$$$ |$$ |__$$ |         $$ |$$ \__$$ |$$$$$$  \ $$$$$$$$/ $$ |  $$ |
$$    $$/ $$   $$   $$/ $$    $$ |$$    $$/          $$ |$$    $$/ $$ | $$  |$$       |$$ |  $$ |
 $$$$$$/   $$$$$/$$$$/   $$$$$$$/ $$$$$$$/           $$/  $$$$$$/  $$/   $$/  $$$$$$$/ $$/   $$/ 
                                  $$ |                                                           
                                  $$ |                                                           
                                  $$/                                                            
*/

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LiquidityPool {
    address private owner;
    IERC20 private token;
    uint256 public tokenBalance;
    uint256 public ethBalance;

    constructor(IERC20 _tokenAddress) {
        owner = msg.sender;
        token = _tokenAddress;
        ethBalance = address(this).balance;
    }

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
     * @dev Inicializa la liquidez del pool, depositando tokens y ETH en el contrato. msg.value = ETH unit
     * @param initialTokenAmount Cantidad de tokens a depositar.
     */
    function initializePool(uint256 initialTokenAmount) onlyOwner external payable {
        require(tokenBalance == 0 && ethBalance == 0, "Pool already initialized");

        require(initialTokenAmount > 0, "Token amount must be greater than zero");
        require(msg.value > 0, "ETH amount must be greater than zero");
        require(token.balanceOf(msg.sender) >= initialTokenAmount, "Insufficient tokens");

        // Aprobar la transferencia de tokens desde el usuario al contrato de la pool de liquidez
        token.approve(address(this), initialTokenAmount);

        // Calcular el precio inicial en Gwei
        uint256 initialPrice = (msg.value * 1e9) / initialTokenAmount;

        // Transferir tokens al contrato de la pool de liquidez
        token.transferFrom(msg.sender, address(this), initialTokenAmount);

        // Actualizar los saldos de tokens y ETH en gwei
        tokenBalance = initialTokenAmount;

        //El 1e9 sirve para que el ethBalance este en gwei
        ethBalance = msg.value/1e9;

        // Emitir un evento para indicar que la pool ha sido inicializada
        emit PoolInitialized(initialTokenAmount, msg.value, initialPrice);
    }

    /**
     * @dev Rellena la liquidez del pool en cualquier momento.
     * @param tokenAmount Cantidad de tokens a depositar.

     */
    function refillLiquidity(uint256 tokenAmount) external payable onlyOwner {
        require(tokenAmount > 0, "Token amount must be greater than zero");
        require(msg.value > 0, "ETH amount must be greater than zero");

        // Aprobar la transferencia de tokens desde el usuario al contrato de la pool de liquidez
        token.approve(address(this), tokenAmount);

        // Transferir tokens al contrato de la pool de liquidez
        token.transferFrom(msg.sender, address(this), tokenAmount);

        // Actualizar los saldos de tokens y ETH
        tokenBalance += tokenAmount;
        ethBalance += msg.value/1e9;

        // Emitir un evento para indicar que se ha rellenado la liquidez
        emit LiquidityRefilled(tokenAmount, msg.value);
    }

    /**
     * @dev Permite intercambiar ETH por token.
     */

    function swapETHForTokens() external payable {
        require(msg.value > 0, "ETH amount must be greater than zero");
        require(ethBalance > 0, "No liquidity in the pool");

        // Calcular la cantidad de tokens a transferir en Gwei
        // msg.value = wei --> parseamos a gwei y para calcular el amount dividimos por el precio en gwei
        uint256 tokenAmount = (msg.value / 1e9) / getTokenPrice();

        // Transferir tokens al usuario
        token.transfer(msg.sender, tokenAmount);

        // Actualizar los saldos de tokens y ETH
        tokenBalance -= tokenAmount;
        ethBalance += msg.value/1e9;

        // Emitir un evento para indicar que se ha realizado el intercambio
        emit SwapETHForTokens(msg.sender, msg.value, tokenAmount);
    }

    /**
     * @dev Permite intercambiar tokens por ETH.
     * @param tokenAmount Cantidad de tokens a intercambiar.
     */
    function swapTokensForETH(uint256 tokenAmount) external {
        require(token.balanceOf(msg.sender) >= tokenAmount,"Insufficient tokens");
        require(ethBalance > 0, "No liquidity in the pool");

        // Calcular la cantidad de ETH a transferir en Gwei
        uint256 ethAmount = tokenAmount * getTokenPrice();

        // Transferir tokens al contrato de la pool de liquidez
        token.transferFrom(msg.sender, address(this), tokenAmount);

        // Transferir ETH al usuario
        payable(msg.sender).transfer(ethAmount*1e9);

        // Actualizar los saldos de tokens y ETH
        tokenBalance += tokenAmount;
        ethBalance -= ethAmount;

        // Emitir un evento para indicar que se ha realizado el intercambio
        emit SwapTokensForETH(msg.sender, tokenAmount, ethAmount);
    }

    /**
     * @dev Permite al owner retirar ETH del contrato.
     * @param amount Cantidad de ETH a retirar. --> amount = gwei
     */
    function withdrawETH(uint256 amount) external onlyOwner {
        uint256 amountInGwei = amount * 1e9;  // Convertir el monto a Gwei

        require(ethBalance >= amount, "Insufficient ETH balance");

        // Transferir ETH al propietario
        payable(owner).transfer(amountInGwei);

        // Actualizar el saldo de ETH
        ethBalance -= amount;

        // Emitir un evento para indicar que se ha retirado ETH
        emit ETHWithdrawn(owner, amountInGwei);
    }


    /**
     * @dev Permite al owner retirar tokens del contrato.
     * @param amount Cantidad de tokens a retirar.
     */
    function withdrawToken(uint256 amount) external onlyOwner {
        require(token.balanceOf(address(this)) >= amount, "Insufficient token balance");

        // Transferir tokens al owner
        token.transfer(msg.sender, amount);

        // Actualizar el saldo de tokens
        tokenBalance -= amount;

        // Emitir un evento para indicar que se ha retirado tokens
        emit TokenWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Obtiene el saldo actual del pool.
     * @return Saldo de tokens y saldo de ETH en Gwei.
     */
    function getPoolBalance() external view returns (uint256, uint256) {
        return (tokenBalance, ethBalance);
    }

    /**
     * @dev Obtiene el precio de la pool (tokens/ETH).
     * @return Precio de la pool en Gwei.
     */
    function getTokenPrice() public view returns (uint256) {
        require(ethBalance > 0 && tokenBalance > 0, "Pool not initialized");

        // Calcular el precio de la pool (tokens/ETH) en Gwei
        uint256 poolPrice = (ethBalance) / tokenBalance;

        return poolPrice;
    }
}
