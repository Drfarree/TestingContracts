// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LPImplementation.sol";


abstract contract IER20Extended is IERC20 {
    function decimals() public virtual view returns (uint8);
}

interface ILPContract {
    function getTokenPrice() external view returns (uint256);
    function getTokenAddress() external view returns (address);
}

contract TokenExchangeP2P {
    address public owner;
    address public tokenContractAddress;
    address public LP_ADDRESS;
    IERC20Extented public tokenContract;
    uint8 public tokenDecimals;

    enum OfferStatus { Inactive, Active, Completed }

    struct OfferToken {
        address seller;
        uint256 tokenAmount;
        uint256 etherAmount;
        OfferStatus status;
    }

    OfferToken[] public offerEth;
    uint256[] public offerEthIds;

    OfferToken[] public offers;
    uint256[] public offerIds;

    event OfferCreated(uint256 offerId, address indexed seller, uint256 tokenAmount, uint256 etherAmount);
    event TradeCompleted(uint256 offerId, address indexed seller, address indexed buyer);

    uint256 public numOffers;

    uint256 public numOffersEth;

    constructor(address _LP_ADDRESS) {
        owner = msg.sender;
        LP_ADDRESS = _LP_ADDRESS;
        ILPContract lpContract = ILPContract(LP_ADDRESS);
        tokenContractAddress = lpContract.getTokenAddress();
        tokenContract = IERC20Extented(tokenContractAddress);
        tokenDecimals = tokenContract.decimals();
    }


    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    // funcion para vender tokens
    function createOfferToken(uint256 _tokenAmount) external {
        require(_tokenAmount > 0, "Invalid offer amounts");
        // AQUI SETEAR EL VALOR QUE TOQUE DEL LP
        uint256 price = getTokenPriceFromLP();

        uint256 _etherAmount = (_tokenAmount*price)/10**tokenDecimals;

        // Transfer tokens from the seller to the contract

        tokenContract.transferFrom(msg.sender, address(this), _tokenAmount);

        offers.push(OfferToken({
            seller: msg.sender,
            tokenAmount: _tokenAmount,
            etherAmount: _etherAmount,
            status: OfferStatus.Active
        }));

        uint256 offerId = offers.length - 1;
        offerIds.push(offerId);

        numOffers++;

        emit OfferCreated(offers.length - 1, msg.sender, _tokenAmount, _etherAmount);
        
    }

    function completeTradeToken(uint256 _offerId) external payable {
        require(_offerId < offers.length, "Invalid offer ID");
        OfferToken storage offer = offers[_offerId];
        require(offer.status == OfferStatus.Active, "Offer is not active");
        require(msg.value == offer.etherAmount);


        tokenContract.approve(address(this), offer.tokenAmount);

        // Calculate the number of tokens based on the token price
        uint256 tokensToTransfer= offer.tokenAmount;

        // Transfer the tokens to the buyer
        require(transferTokensContractUser(msg.sender, tokensToTransfer), "Token transfer failed");

        payable(offer.seller).transfer(msg.value);
        

        offer.status = OfferStatus.Completed;
        emit TradeCompleted(_offerId, offer.seller, msg.sender);


        numOffers--;
    }

    function cancelOfferToken(uint256 _offerId) external {
        require(_offerId < offers.length, "Invalid offer ID");
        OfferToken storage offer = offers[_offerId];
        require(msg.sender == offer.seller, "Only the offert owner can cancel that");
        require(offer.status == OfferStatus.Active, "Offer is not active");

        // Transfer tokens back to the owner

        tokenContract.transfer(offer.seller, offer.tokenAmount);

        offer.status = OfferStatus.Inactive;


        numOffers--;
    }

    //funcion para comprar tokens --> Deposit XDC

    function createOfferBuyTokens() public payable {
        require(msg.value > 0, "Invalid offer amounts");
        // AQUI SETEAR EL VALOR QUE TOQUE DEL LP
        uint256 price = getTokenPriceFromLP();

        uint256 _tokenAmount = (msg.value*10**tokenDecimals)/price;

        // Transfer tokens from the seller to the contract
        uint256 _etherAmount = msg.value;

        offerEth.push(OfferToken({
            seller: msg.sender,
            tokenAmount: _tokenAmount,
            etherAmount: _etherAmount,
            status: OfferStatus.Active
        }));

        uint256 offerId = offerEth.length - 1;
        offerEthIds.push(offerId);

        numOffersEth++;

        emit OfferCreated(offerEthIds.length - 1, msg.sender, _tokenAmount, _etherAmount);
    }

    function completeOfferBuyTokens(uint256 _offerId, uint256 _tokenAmount) external {
        require(_offerId < offerEth.length, "Invalid offer ID");
        OfferToken storage offer = offerEth[_offerId];
        require(offer.status == OfferStatus.Active, "Offer is not active");
        //uint256 tokenPrice = getTokenPriceFromLP();
        //uint256 tokenPrice = 100000000;
        //require(msg.value == offer.etherAmount, "Incorrect Ether value");
        require(_tokenAmount == offer.tokenAmount);
        require(offer.seller != msg.sender, "Seller cannot buy their own offer");

        // transfer tokens to contract
 
        tokenContract.transferFrom(msg.sender, address(this), _tokenAmount);


        tokenContract.approve(address(this), _tokenAmount);

        // Transfer the tokens to the buyer
        require(transferTokensContractUser(offer.seller, _tokenAmount), "Token transfer failed");

        // Transfer ETH to seller
        payable(msg.sender).transfer(offer.etherAmount);
        
        offer.status = OfferStatus.Completed;
        emit TradeCompleted(_offerId, offer.seller, msg.sender);

        numOffersEth--;
    }

    function cancelOfferBuyTokens(uint256 _offerId) public {
        require(_offerId < offerEth.length, "Invalid offer ID");
        OfferToken storage offer = offerEth[_offerId];
        require(msg.sender == offer.seller);
        require(offer.status == OfferStatus.Active, "Offer is not active");

        payable(offer.seller).transfer(offer.etherAmount);

        offer.status = OfferStatus.Inactive;

        numOffersEth--;
    }


    function transferTokensContractUser(address to, uint256 _tokenAmount) internal returns (bool) {
        // Use the ERC-20 transferFrom function to transfer tokens to the contract

        require(tokenContract.transferFrom(address(this), to, _tokenAmount), "Token transfer failed");
        return true;
    }


    function getTokenPriceFromLP() public view returns (uint256) {
        ILPContract lpContract = ILPContract(LP_ADDRESS);
        return lpContract.getTokenPrice();
    }

    function getTokenAddress() public view returns (address) {
        ILPContract lpContract = ILPContract(LP_ADDRESS);
        address TokenAddress = lpContract.getTokenAddress();
        return TokenAddress;
    }

    function getOffers() public view returns (uint256[] memory) {
        return offerIds;
    }

    function getOffersBuyTokens() public view returns (uint256[] memory){
        return offerEthIds;
    }

    function getOfferById(uint256 offerId) public view returns (address seller, uint256 tokenAmount, uint256 etherAmount, uint8 status) {
        require(offerId < offers.length, "Invalid offer ID");

        OfferToken storage offer = offers[offerId];

        return (offer.seller, offer.tokenAmount, offer.etherAmount, uint8(offer.status));
    }

    function getOfferBuyTokensById(uint256 offerId) public view returns (address seller, uint256 tokenAmount, uint256 etherAmount, uint8 status) {
        require(offerId < offerEth.length, "Invalid offer ID");

        OfferToken storage offer = offerEth[offerId];

        return (offer.seller, offer.tokenAmount, offer.etherAmount, uint8(offer.status));
    }


    receive() external payable {}
}