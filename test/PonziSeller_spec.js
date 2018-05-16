import latestGasUsed from './helpers/latestGasUsed';
import checkPublicABI from './helpers/checkPublicABI';
import toPromise from './helpers/toPromise';

import getAccounts from './helpers/getAccounts';
import getBalance from './helpers/getBalance';

import { gasPrice } from './helpers/gasPrice';
import assertRevert from './helpers/assertRevert';
import expectThrow from './helpers/expectThrow';

import truffleContract from 'truffle-contract';
import data from 'ponzi-trust-token/build/contracts/PonziToken.json';
let PonziToken = truffleContract(data);
PonziToken.setProvider(web3.currentProvider);
PonziToken.defaults({
  gas: 4712388,
  gasPrice: gasPrice,
});

// this contract is must have, because solidity-coverage has a bag and
// no way to receive eth like this method
// see: https://github.com/sc-forks/solidity-coverage/issues/106
const PonziSeller = artifacts.require('./contracts/PonziSeller.sol');
const PonziAddres = '0xc2807533832807Bf15898778D8A108405e9edfb1';

// const PonziSeller = artifacts.require('./contracts/PonziSeller.sol');

let Accounts, token, seller, tokenOwner, sellerOwner, sender1, sender2, referral1;
const StateToken = Object.freeze({
  'PreSale': { num: 0, str: 'PreSale' },
  'Sale': { num: 0, str: 'Sale' },
  'PublicUse': { num: 0, str: 'PublicUse' },
});

const AccessRank = Object.freeze({
  'None': 0,
  'SetPrice': 1,
  'Withdraw': 2,
  'Full': 3,
});

contract('PonziSeller', () => {
  before(async function () {
    Accounts = await getAccounts();
    tokenOwner = Accounts[0];
    sender1 = Accounts[1];
    sender2 = Accounts[2];
    referral1 = Accounts[3];
    sellerOwner = Accounts[4];
  });

  describe('check initialization', () => {
    before(async () => {
      seller = await PonziSeller.new({ from: sellerOwner });
    });

    it('has a limited public ABI', () => {
      let expectedABI = [
        'setPonziAddress',
        'ponziPriceInWei',
        'setPonziPriceInWei',
        'rewardPercent',
        'provideAccess',
        'setRewardPercent',
        'byPonzi',
        'availablePonzi',
        'withdraw',
        'ponziAddress',
      ];
      checkPublicABI(PonziSeller, expectedABI);
    });

    it('ponziAddress must be default', async () => {
      let addr = await seller.ponziAddress();
      assert.equal(addr.toLowerCase(), PonziAddres.toLowerCase());
    });

    it('creator is admin with full access', async () => {
      assert(await seller.setPonziAddress(PonziAddres, { from: sellerOwner }));
    });

    it('reward percent is 100%', async () => {
      let p = await seller.rewardPercent();
      assert.equal(100, p[0] / p[1] * 100);
    });
  });
  describe('provideAccess(address adminAddr, uint8 rank)', () => {
    beforeEach(async () => {
      seller = await PonziSeller.new({ from: sellerOwner });
    });
    context('AccessRank.Full', () => {
      it('has access to AccessRank.Full', async () => {
        assert(await seller.setRewardPercent(2, 1, { from: sellerOwner }));
        let p = await seller.rewardPercent();
        assert.equal(200, p[0] / p[1] * 100);
      });
      it('has access to AccessRank.SetPrice', async () => {
        assert(await seller.setPonziPriceInWei(1, { from: sellerOwner }));
      });
      it('has access to AccessRank.Withdraw', async () => {
        token = await PonziToken.new({ from: tokenOwner });
        await token.initContract({ from: tokenOwner });
        await token.setState(StateToken.PublicUse.str, { from: tokenOwner });
        await token.transfer(seller.address, 100, { from: tokenOwner });
        await seller.setPonziPriceInWei(1, { from: sellerOwner });
        await seller.setPonziAddress(token.address, { from: sellerOwner });
        await seller.byPonzi(seller.address, { from: sender1, value: 5 });
        assert(await seller.withdraw({ from: sellerOwner }));
      });
    });
    context('AccessRank.Withdraw', () => {
      var withdrawRank;
      beforeEach(async () => {
        withdrawRank = sender1;
        await seller.provideAccess(withdrawRank, AccessRank.Withdraw, { from: sellerOwner });
      });
      it('dont has access to AccessRank.Full', async () => {
        await assertRevert(seller.setRewardPercent(2, 1, { from: withdrawRank }));
      });
      it('dont has access to AccessRank.SetPrice', async () => {
        await assertRevert(seller.setPonziPriceInWei(1, { from: withdrawRank }));
      });
      it('has access to AccessRank.Withdraw', async () => {
        token = await PonziToken.new({ from: tokenOwner });
        await token.initContract({ from: tokenOwner });
        await token.setState(StateToken.PublicUse.str, { from: tokenOwner });
        await token.transfer(seller.address, 100, { from: tokenOwner });
        await seller.setPonziPriceInWei(1, { from: sellerOwner });
        await seller.setPonziAddress(token.address, { from: sellerOwner });
        await seller.byPonzi(seller.address, { from: sender1, value: 5 });
        assert(await seller.withdraw({ from: withdrawRank }));
      });
    });
    context('AccessRank.SetPrice', () => {
      var setPriceRank;
      beforeEach(async () => {
        setPriceRank = sender1;
        await seller.provideAccess(setPriceRank, AccessRank.SetPrice, { from: sellerOwner });
      });
      it('dont has access to AccessRank.Full', async () => {
        await assertRevert(seller.setRewardPercent(2, 1, { from: setPriceRank }));
      });
      it('has access to AccessRank.SetPrice', async () => {
        assert(await seller.setPonziPriceInWei(1, { from: setPriceRank }));
      });
      it('dont has access to AccessRank.Withdraw', async () => {
        token = await PonziToken.new({ from: tokenOwner });
        await token.initContract({ from: tokenOwner });
        await token.setState(StateToken.PublicUse.str, { from: tokenOwner });
        await token.transfer(seller.address, 100, { from: tokenOwner });
        await seller.setPonziPriceInWei(1, { from: sellerOwner });
        await seller.setPonziAddress(token.address, { from: sellerOwner });
        await seller.byPonzi(seller.address, { from: sender1, value: 5 });
        await assertRevert(seller.withdraw({ from: setPriceRank }));
      });
    });
    context('AccessRank.None', () => {
      var noneRank;
      beforeEach(async () => {
        noneRank = sender1;
        await seller.provideAccess(noneRank, AccessRank.None, { from: sellerOwner });
      });
      it('dont has access to AccessRank.Full', async () => {
        await assertRevert(seller.setRewardPercent(2, 1, { from: noneRank }));
      });
      it('dont has access to AccessRank.SetPrice', async () => {
        await assertRevert(seller.setPonziPriceInWei(1, { from: noneRank }));
      });
      it('dont has access to AccessRank.Withdraw', async () => {
        token = await PonziToken.new({ from: tokenOwner });
        await token.initContract({ from: tokenOwner });
        await token.setState(StateToken.PublicUse.str, { from: tokenOwner });
        await token.transfer(seller.address, 100, { from: tokenOwner });
        await seller.setPonziPriceInWei(1, { from: sellerOwner });
        await seller.setPonziAddress(token.address, { from: sellerOwner });
        await seller.byPonzi(seller.address, { from: sender1, value: 5 });
        await assertRevert(seller.withdraw({ from: noneRank }));
      });
    });

    it('throw on invalid rank', async () => {
      await assertRevert(seller.provideAccess(sender1, 9, { from: sellerOwner }));
    });
    it('throw on revoke amin with full access', async () => {
      await seller.provideAccess(sender1, AccessRank.Full, { from: sellerOwner });
      await assertRevert(seller.provideAccess(sender1, AccessRank.None, { from: sellerOwner }));
    });
    it('success change', async () => {
      await assertRevert(seller.setRewardPercent(2, 1, { from: sender1 }));
      await seller.provideAccess(sender1, AccessRank.Full, { from: sellerOwner });
      await seller.setRewardPercent(2, 1, { from: sender1 });
    });
  });

  describe('setPonziAddress(address ponziAddr)', () => {
    beforeEach(async () => {
      seller = await PonziSeller.new({ from: sellerOwner });
    });

    it('throw if dont have permission', async () => {
      await assertRevert(seller.setPonziAddress(sender1, { from: sender1 }));
    });

    it('success change', async () => {
      let addr = await seller.ponziAddress();
      assert.equal(addr.toLowerCase(), PonziAddres.toLowerCase());
      await seller.setPonziAddress(sender1, { from: sellerOwner });
      let newAddr = await seller.ponziAddress();
      assert.equal(newAddr.toLowerCase(), sender1.toLowerCase());
    });
  });

  describe('setPonziPriceInWei(uint256 newPonziPriceInWei)', () => {
    beforeEach(async () => {
      seller = await PonziSeller.new({ from: sellerOwner });
    });

    it('throw if dont have permission', async () => {
      await assertRevert(seller.setPonziPriceInWei(2, { from: sender1 }));
    });

    it('success change', async () => {
      let p = await seller.ponziPriceInWei();
      assert.equal(p.toString(), '0');
      await seller.setPonziPriceInWei(5, { from: sellerOwner });
      let newP = await seller.ponziPriceInWei();
      assert.equal(newP.toString(), '5');
    });
  });

  describe('setRewardPercent(uint256 newNumerator, uint256 newDenominator)', () => {
    beforeEach(async () => {
      seller = await PonziSeller.new({ from: sellerOwner });
    });

    it('throw if dont have permission', async () => {
      await assertRevert(seller.setRewardPercent(2, 1, { from: sender1 }));
    });

    it('throw if invalid input', async () => {
      await assertRevert(seller.setRewardPercent(2, 0, { from: sellerOwner }));
    });

    it('success change', async () => {
      let p = await seller.rewardPercent();
      assert.equal(p[0], 1);
      assert.equal(p[1], 1);
      await seller.setRewardPercent(2, 3, { from: sellerOwner });
      let newP = await seller.rewardPercent();
      assert.equal(newP[0].toString(), '2');
      assert.equal(newP[1].toString(), '3');
    });
  });

  describe('availablePonzi()', () => {
    it('is correct balance?', async () => {
      seller = await PonziSeller.new({ from: sellerOwner });
      token = await PonziToken.new({ from: tokenOwner });
      await token.initContract({ from: tokenOwner });
      await token.setState(StateToken.PublicUse.str, { from: tokenOwner });
      await token.transfer(seller.address, 100, { from: tokenOwner });
      await seller.setPonziAddress(token.address, { from: sellerOwner });
      let b = await seller.availablePonzi({ from: sellerOwner });
      assert.equal(b.toString(), '100');
    });
  });

  describe('byPonzi(address refAddr)', () => {
    var sellerPT;
    beforeEach(async () => {
      seller = await PonziSeller.new({ from: sellerOwner });
      token = await PonziToken.new({ from: tokenOwner });
      sellerPT = 1000;
      await token.initContract({ from: tokenOwner });
      await token.setState(StateToken.PublicUse.str, { from: tokenOwner });
      await token.transfer(seller.address, sellerPT, { from: tokenOwner });
      await seller.setPonziPriceInWei(1, { from: sellerOwner });
      await seller.setPonziAddress(token.address, { from: sellerOwner });
      await seller.setRewardPercent(1, 1, { from: sellerOwner });
    });
    describe('check ponzi balances', () => {
      it('throw if price is 0', async () => {
        await seller.setPonziPriceInWei(0, { from: sellerOwner });
        await assertRevert(seller.byPonzi(referral1, { from: sender2, value: 100 }));
      });

      it('throw value < price', async () => {
        await seller.setPonziPriceInWei(1000, { from: sellerOwner });
        await assertRevert(seller.byPonzi(referral1, { from: sender2, value: 100 }));
      });

      context('sender balance', () => {
        it('pt:eth = 1:1', async () => {
          let b = await token.balanceOf(sender1);
          assert.equal(b.toString(), '0');
          await seller.byPonzi(seller.address, { from: sender1, value: 50 });
          b = await token.balanceOf(sender1);
          assert.equal(b.toString(), '50');
        });
        it('pt:eth = 2:1', async () => {
          await seller.setPonziPriceInWei(2, { from: sellerOwner });

          let b = await token.balanceOf(sender2);
          assert.equal(b.toString(), '0');
          await seller.byPonzi(seller.address, { from: sender2, value: 100 });
          b = await token.balanceOf(sender2);
          assert.equal(b.toString(), '50');
        });
      });

      context('referral balance', () => {
        it('invalid referral', async () => {
          let b = await token.balanceOf(sender2);
          assert.equal(b.toString(), '0');
          await seller.byPonzi(sender2, { from: sender2, value: 100 });
          b = await token.balanceOf(sender2);
          assert.equal(b.toString(), '100');
        });

        it('reward 100%', async () => {
          let b = await token.balanceOf(referral1);
          assert.equal(b.toString(), '0');
          await seller.byPonzi(referral1, { from: sender2, value: 100 });
          b = await token.balanceOf(referral1);
          assert.equal(b.toString(), '100');
        });

        it('reward 50%', async () => {
          await seller.setRewardPercent(1, 2, { from: sellerOwner });
          let b = await token.balanceOf(referral1);
          assert.equal(b.toString(), '0');
          await seller.byPonzi(referral1, { from: sender2, value: 100 });
          b = await token.balanceOf(referral1);
          assert.equal(b.toString(), '50');
        });
      });

      context('seller balance', () => {
        it('invalid referral', async () => {
          let b = await token.balanceOf(seller.address);
          assert.equal(b.toNumber(), sellerPT);
          await seller.byPonzi(sender2, { from: sender2, value: 100 });
          b = await token.balanceOf(seller.address);
          assert.equal(b.toNumber(), sellerPT - 100);
        });

        it('valid referral', async () => {
          let b = await token.balanceOf(seller.address);
          assert.equal(b.toNumber(), sellerPT);
          await seller.byPonzi(referral1, { from: sender2, value: 100 });
          b = await token.balanceOf(seller.address);
          assert.equal(b.toNumber(), sellerPT - 2 * 100);
        });
      });
    });
    describe('check eth balances', () => {
      it('seller have enough ponzi', async () => {
        let b = await getBalance(seller.address);
        assert.equal(b.toString(), '0');
        await seller.byPonzi(referral1, { from: sender2, value: 100 });
        b = await getBalance(seller.address);
        assert.equal(b.toString(), '100');
      });
      it('throw if seller dont have enough ponzi, and safe eth', async () => {
        let b = await getBalance(seller.address);
        let sB = await getBalance(sender2);
        assert.equal(b.toString(), '0');

        await assertRevert(seller.byPonzi(referral1, { from: sender2, value: sellerPT + 1 }));

        b = await getBalance(seller.address);
        let sA = await getBalance(sender2);
        assert.equal(b.toString(), '0');
        assert.equal(sB.toString(), sA.plus(latestGasUsed() * gasPrice).toString());
      });
    });
  });
  describe('fallback', () => {
    var sellerPT;
    beforeEach(async () => {
      seller = await PonziSeller.new({ from: sellerOwner });
      token = await PonziToken.new({ from: tokenOwner });
      sellerPT = 1000;
      await token.initContract({ from: tokenOwner });
      await token.setState(StateToken.PublicUse.str, { from: tokenOwner });
      await token.transfer(seller.address, sellerPT, { from: tokenOwner });
      await seller.setPonziPriceInWei(1, { from: sellerOwner });
      await seller.setPonziAddress(token.address, { from: sellerOwner });
      await seller.setRewardPercent(1, 1, { from: sellerOwner });
    });
    it('throw on default gas limit', async () => {
      await expectThrow(
        toPromise(web3.eth.sendTransaction)({
          from: sender1,
          to: seller.address,
          value: 100,
          gas: 21000,
          gasPrice: gasPrice,
        })
      );
    });

    it('success by ponzi when increase limit', async () => {
      let b = await token.balanceOf(sender1);
      assert.equal(b.toString(), '0');
      let sB = await getBalance(sender1);

      await web3.eth.sendTransaction({
        from: sender1,
        to: seller.address,
        value: 100,
        gas: 500000,
        gasPrice: gasPrice,
      });
      let txCost = latestGasUsed() * gasPrice;

      b = await token.balanceOf(sender1);
      assert.equal(b.toString(), '100');

      b = await token.balanceOf(seller.address);
      assert.equal(b.toNumber(), sellerPT - 100);

      let sA = await getBalance(sender1);
      assert.equal(sB.toString(), sA.plus(txCost + 100).toString());
    });
  });

  describe('withdraw()', () => {
    before(async () => {
      seller = await PonziSeller.new({ from: sellerOwner });
      token = await PonziToken.new({ from: tokenOwner });
      await token.initContract({ from: tokenOwner });
      await token.setState(StateToken.PublicUse.str, { from: tokenOwner });
      await token.transfer(seller.address, 100, { from: tokenOwner });
      await seller.setPonziPriceInWei(1, { from: sellerOwner });
      await seller.setPonziAddress(token.address, { from: sellerOwner });
    });

    it('throw if dont have permission', async () => {
      await assertRevert(seller.withdraw({ from: sender1 }));
    });

    it('throw if seller dont hav eth', async () => {
      await assertRevert(seller.withdraw({ from: sellerOwner }));
    });
    it('success transfer all eth', async () => {
      await seller.byPonzi(sender1, { from: sender1, value: 100 });
      let bB = await getBalance(sellerOwner);

      await seller.withdraw({ from: sellerOwner });
      let txCost = latestGasUsed() * gasPrice;

      let bA = await getBalance(sellerOwner);
      assert.equal(bB.plus(100).toString(), bA.plus(txCost).toString());
    });
  });
});
