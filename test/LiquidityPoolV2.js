const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { eth } = require("web3");

describe("LiquidityPool (n decimals)", function () {
  async function deployContractsFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const FLToken = await ethers.getContractFactory("FLTokenV2");
    const flToken = await FLToken.deploy(
      "Pikake",
      "PK",
      1000000,
      owner.address,
      18
    );

    const LiquidityPool = await ethers.getContractFactory("LiquidityPoolV2");
    const liquidityPool = await LiquidityPool.deploy(flToken.target);

    const decimals = await flToken.decimals();

    return { flToken, liquidityPool, owner, otherAccount, decimals };
  }

  describe("Initialize liquidity pool", function () {
    it("Should add liquidity on LP", async function () {
      const { flToken, liquidityPool, owner, otherAccount, decimals } =
        await loadFixture(deployContractsFixture);
      const token_amount = BigInt(100000) * BigInt(10) ** decimals;
      const eth_amount = "10.0";
      const eth_amount_wei = ethers.parseEther(eth_amount);

      // owner token balance before deposit on pool
      n_owner_token_before = await flToken.balanceOf(owner);

      // need allowance

      await flToken.connect(owner).approve(liquidityPool.target, token_amount);

      await liquidityPool.connect(owner).initializePool(token_amount, {
        value: eth_amount_wei,
      });

      const [_tokens, _ether] = await liquidityPool.getPoolBalance();

      const tokenPrice = await liquidityPool.getTokenPrice();

      expect(_tokens).to.equal(token_amount);
      expect(_ether).to.equal(eth_amount_wei);

      const expectedTokenPrice =
        (eth_amount_wei * BigInt(10) ** decimals) / token_amount;

      expect(tokenPrice).to.equal(expectedTokenPrice.toString());

      // owner token balance after deposit
      n_owner_token_after = await flToken.balanceOf(owner);

      expect(n_owner_token_after).to.equal(n_owner_token_before - token_amount);
    });

    it("Just owner can initializePool", async function () {
      const { flToken, liquidityPool, owner, otherAccount, decimals } =
        await loadFixture(deployContractsFixture);
      const token_amount = BigInt(100000) * BigInt(10) ** decimals;
      const transferAmount = token_amount;
      const eth_amount = "10.0";
      const eth_amount_wei = ethers.parseEther(eth_amount);

      await flToken
        .connect(owner)
        .transfer(otherAccount.address, transferAmount);

      expect(await flToken.balanceOf(otherAccount)).to.equal(token_amount);

      await flToken
        .connect(otherAccount)
        .approve(liquidityPool.target, token_amount);

      await expect(
        liquidityPool
          .connect(otherAccount)
          .initializePool(token_amount, { value: eth_amount_wei })
      ).to.be.reverted;
    });

    describe("Test all swap functions", function () {
      let token_amount;
      let eth_amount;
      let otherAccount;
      let flToken;
      let liquidityPool;
      let owner;
      let decimals;

      beforeEach(async function () {
        const {
          flToken: _flToken,
          owner: _owner,
          otherAccount: _otherAccount,
          liquidityPool: _liquidityPool,
          decimals: _decimals,
        } = await loadFixture(deployContractsFixture);

        flToken = _flToken;
        owner = _owner;
        decimals = _decimals;
        otherAccount = _otherAccount;
        eth_amount = "10.0";
        // deposit 100000 with n decimals
        token_amount = BigInt(100000) * BigInt(10) ** decimals;
        liquidityPool = _liquidityPool;

        const eth_amount_wei = ethers.parseEther(eth_amount);
        await flToken
          .connect(owner)
          .approve(liquidityPool.target, token_amount);

        await liquidityPool.connect(owner).initializePool(token_amount, {
          value: eth_amount_wei,
        });
      });

      it("Buy Tokens with eth", async function () {
        const eth_to_buy = "0.001";
        const wei_to_buy = ethers.parseEther(eth_to_buy);

        balance_before_buy = await flToken.balanceOf(otherAccount);

        expect(balance_before_buy).to.equal(0);

        const _tokenPrice = await liquidityPool.getTokenPrice();

        const _token_amount =
          (wei_to_buy * BigInt(10) ** decimals) / _tokenPrice;

        await liquidityPool
          .connect(otherAccount)
          .swapETHForTokens({ value: wei_to_buy });

        token_balance = await flToken.balanceOf(otherAccount);

        expect(_token_amount).to.equal(token_balance);
      });

      it("Swap tokens for eth", async function () {
        tokens_to_swap = BigInt(1000) * BigInt(10) ** decimals;

        balance_be4 = await flToken.balanceOf(owner);
        const [_tokens_be4, _ether_be4] = await liquidityPool.getPoolBalance();

        await flToken.approve(liquidityPool.target, tokens_to_swap);
        await liquidityPool.swapTokensForETH(tokens_to_swap);

        balance_after = await flToken.balanceOf(owner);
        const [_tokens, _ether] = await liquidityPool.getPoolBalance();

        expect(balance_after).to.equal(balance_be4 - tokens_to_swap);
        expect(_tokens).to.equal(_tokens_be4 + tokens_to_swap);

        expect(_ether).to.be.lte(
          await ethers.provider.getBalance(owner.address)
        );
        expect(_tokens).to.equal(tokens_to_swap + token_amount);
      });

      it("Swap token for eth (not owner)", async function () {
        tokens_to_swap = BigInt(1000) * BigInt(10) ** decimals;

        await flToken.transfer(otherAccount.address, tokens_to_swap);

        balance_be4 = await flToken.balanceOf(otherAccount);
        const [_tokens_be4, _ether_be4] = await liquidityPool.getPoolBalance();

        await flToken
          .connect(otherAccount)
          .approve(liquidityPool.target, tokens_to_swap);
        await liquidityPool
          .connect(otherAccount)
          .swapTokensForETH(tokens_to_swap);

        balance_after = await flToken.balanceOf(otherAccount);
        const [_tokens, _ether] = await liquidityPool.getPoolBalance();

        expect(balance_after).to.equal(balance_be4 - tokens_to_swap);
        expect(_tokens).to.equal(_tokens_be4 + tokens_to_swap);
        expect(_ether).to.be.lte(
          await ethers.provider.getBalance(otherAccount.address)
        );
        expect(_tokens).to.equal(tokens_to_swap + token_amount);
      });
    });

    describe("Test refill function", function () {
      it("Should add more eth and token to swap pool", async function () {
        const { flToken, liquidityPool, owner, otherAccount, decimals } =
          await loadFixture(deployContractsFixture);
        const token_amount = BigInt(100) * BigInt(10) ** decimals;
        const eth_amount = "1.0";
        const eth_amount_wei = ethers.parseEther(eth_amount);

        const token_amount_refill = BigInt(200) * BigInt(10) ** decimals;
        const eth_amount_refill = "0.5";
        const eth_amount_refill_wei = ethers.parseEther(eth_amount_refill);

        await flToken
          .connect(owner)
          .approve(liquidityPool.target, token_amount);

        await expect(
          liquidityPool
            .connect(owner)
            .initializePool(token_amount, { value: eth_amount_wei })
        );

        const [_tokensA, _etherA] = await liquidityPool.getPoolBalance();

        await flToken
          .connect(owner)
          .approve(liquidityPool.target, token_amount_refill);

        await liquidityPool.refillLiquidity(token_amount_refill, {
          value: eth_amount_refill_wei,
        });

        const [_tokens, _ether] = await liquidityPool.getPoolBalance();

        expect(_tokens).to.equal(token_amount + token_amount_refill);

        expect(_ether).to.equal(eth_amount_wei + eth_amount_refill_wei);
      });
    });

    describe("Test withdraw functions", function () {
      let token_amount;
      let eth_amount;
      let otherAccount;
      let flToken;
      let liquidityPool;
      let owner;
      let decimals;

      beforeEach(async function () {
        const {
          flToken: _flToken,
          owner: _owner,
          otherAccount: _otherAccount,
          liquidityPool: _liquidityPool,
          decimals: _decimals,
        } = await loadFixture(deployContractsFixture);

        flToken = _flToken;
        owner = _owner;
        otherAccount = _otherAccount;
        decimals = _decimals
        eth_amount = "10.0";
        token_amount = BigInt(10000) * BigInt(10)**decimals;
        liquidityPool = _liquidityPool;

        const eth_amount_wei = ethers.parseEther(eth_amount);

        await flToken
          .connect(owner)
          .approve(liquidityPool.target, token_amount);

        await liquidityPool.connect(owner).initializePool(token_amount, {
          value: eth_amount_wei,
        });
      });

      it("Should withdraw tokens from pool to owner wallet", async function () {
        const token_withdraw = BigInt(500) * BigInt(10)**decimals;;
        const [_tokens, _ether] = await liquidityPool.getPoolBalance();

        expect(_tokens).to.equal(token_amount);

        await liquidityPool.withdrawToken(token_withdraw);

        const [_tokensAfter, _etherAfter] =
          await liquidityPool.getPoolBalance();

        expect(_tokensAfter).to.equal(_tokens - token_withdraw);
      });

      it("Just owner can withdraw", async function () {
        const token_withdraw = BigInt(100) * BigInt(10)**decimals;;

        await expect(
          liquidityPool.connect(otherAccount).withdrawToken(token_withdraw)
        ).to.be.reverted;
      });
    });
  });
});
