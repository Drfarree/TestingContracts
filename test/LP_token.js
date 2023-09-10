const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { eth } = require("web3");

describe("LiquidityPool", function () {
  async function deployContractsFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const FLToken = await ethers.getContractFactory("FLToken");
    const flToken = await FLToken.deploy(
      "Token",
      "MTK",
      1000000,
      owner.address,
      18
    );

    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const liquidityPool = await LiquidityPool.deploy(flToken.target);

    return { flToken, liquidityPool, owner, otherAccount };
  }

  describe("Initialize liquidity pool", function () {
    it("Should add liquidity on LP", async function () {
      const { flToken, liquidityPool, owner, otherAccount } = await loadFixture(
        deployContractsFixture
      );
      const token_amount = 100000;
      const eth_amount = "10.0";
      const eth_amount_wei = ethers.parseEther(eth_amount);
      const eth_amount_gwei = ethers.parseUnits(eth_amount, 9);
      // owner token balance before deposit on pool
      n_owner_token_before = await flToken.balanceOf(owner);

      // need allowance

      await flToken.connect(owner).approve(liquidityPool.target, token_amount);

      await liquidityPool.connect(owner).initializePool(token_amount, {
        value: eth_amount_wei,
      });

      // _ether gwei units 10⁹
      const [_tokens, _ether] = await liquidityPool.getPoolBalance();
      // tokenPrice en gwei
      const tokenPrice = await liquidityPool.getTokenPrice();

      expect(_tokens).to.equal(token_amount);

      expect(_ether).to.equal(eth_amount_gwei);
      expect(tokenPrice).to.equal(eth_amount_gwei / BigInt(token_amount));
      // owner token balance after deposit
      n_owner_token_after = await flToken.balanceOf(owner);

      expect(n_owner_token_after).to.equal(
        n_owner_token_before - BigInt(token_amount)
      );
    });

    it("Just owner can initializePool", async function () {
      const { flToken, liquidityPool, owner, otherAccount } = await loadFixture(
        deployContractsFixture
      );
      const token_amount = 100000;
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

      beforeEach(async function () {
        const {
          flToken: _flToken,
          owner: _owner,
          otherAccount: _otherAccount,
          liquidityPool: _liquidityPool,
        } = await loadFixture(deployContractsFixture);

        flToken = _flToken;
        owner = _owner;
        otherAccount = _otherAccount;
        eth_amount = "10.0";
        token_amount = 100000;
        liquidityPool = _liquidityPool;

        const eth_amount_wei = ethers.parseEther(eth_amount);
        const eth_amount_gwei = ethers.parseUnits(eth_amount, 9);

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
          ethers.formatEther(wei_to_buy) / ethers.formatUnits(_tokenPrice, 9);

        await liquidityPool
          .connect(otherAccount)
          .swapETHForTokens({ value: wei_to_buy });

        token_balance = await flToken.balanceOf(otherAccount);

        expect(BigInt(_token_amount)).to.equal(token_balance);

        const [_tokens, _ether] = await liquidityPool.getPoolBalance();

        expect(_ether).to.equal(
          ethers.parseUnits(eth_amount, 9) + ethers.parseUnits(eth_to_buy, 9)
        );
      });

      it("Swap tokens for eth", async function () {
        tokens_to_swap = 1000;

        balance_be4 = await flToken.balanceOf(owner);
        const [_tokens_be4, _ether_be4] = await liquidityPool.getPoolBalance();

        await flToken.approve(liquidityPool.target, tokens_to_swap);
        await liquidityPool.swapTokensForETH(tokens_to_swap);

        balance_after = await flToken.balanceOf(owner);
        const [_tokens, _ether] = await liquidityPool.getPoolBalance();

        expect(balance_after).to.equal(balance_be4 - BigInt(tokens_to_swap));
        expect(_tokens).to.equal(_tokens_be4 + BigInt(tokens_to_swap));
        expect(_ether).to.be.lte(
          await ethers.provider.getBalance(owner.address)
        );
        expect(_tokens).to.equal(BigInt(tokens_to_swap + token_amount));
      });
    });

    describe("Test refill function", function () {
      it("Should add more eth and token to swap pool", async function () {
        const { flToken, liquidityPool, owner, otherAccount } =
          await loadFixture(deployContractsFixture);
        const token_amount = 100;
        const eth_amount = "1.0";
        const eth_amount_wei = ethers.parseEther(eth_amount);

        const token_amount_refill = 200;
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

        expect(_tokens).to.equal(
          BigInt(token_amount) + BigInt(token_amount_refill)
        );

        expect(_ether).to.equal(
          ethers.parseUnits(eth_amount, 9) +
            ethers.parseUnits(eth_amount_refill, 9)
        );
      });
    });

    describe("Test withdraw functions", function () {
      let token_amount;
      let eth_amount;
      let otherAccount;
      let flToken;
      let liquidityPool;
      let owner;

      beforeEach(async function () {
        const {
          flToken: _flToken,
          owner: _owner,
          otherAccount: _otherAccount,
          liquidityPool: _liquidityPool,
        } = await loadFixture(deployContractsFixture);

        flToken = _flToken;
        owner = _owner;
        otherAccount = _otherAccount;
        eth_amount = "10.0";
        token_amount = 10000;
        liquidityPool = _liquidityPool;

        const eth_amount_wei = ethers.parseEther(eth_amount);
        const eth_amount_gwei = ethers.parseUnits(eth_amount, 9);

        await flToken
          .connect(owner)
          .approve(liquidityPool.target, token_amount);

        await liquidityPool.connect(owner).initializePool(token_amount, {
          value: eth_amount_wei,
        });
      });

      it("Should withdraw tokens from pool to owner wallet", async function () {
        const token_withdraw = 500;
        const [_tokens, _ether] = await liquidityPool.getPoolBalance();

        expect(_tokens).to.equal(token_amount);

        await liquidityPool.withdrawToken(token_withdraw);

        const [_tokensAfter, _etherAfter] =
          await liquidityPool.getPoolBalance();

        expect(_tokensAfter).to.equal(BigInt(_tokens) - BigInt(token_withdraw));
      });

      it("Just owner can withdraw", async function () {
        const token_withdraw = 100;

        await expect(
          liquidityPool.connect(otherAccount).withdrawToken(token_withdraw)
        ).to.be.reverted;
      });
    });
  });
});
