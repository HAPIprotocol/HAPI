import { ethers } from 'hardhat';
import { HAPI, HAPI__factory, FixedAmountVesting, FixedAmountVesting__factory } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { days } from './shared/time';
import { addressFromNumber, latestBlockTimestamp, mineBlockAtTime } from './shared/utilities';
import { BigNumberish } from 'ethers';

describe('FixedAmountVesting', () => {
  let signers: SignerWithAddress[];
  let token: HAPI;
  let unlock: FixedAmountVesting;
  let vestingInterval: number;
  let cliffDuration: number;
  let now: number;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    token = await new HAPI__factory(signers[0]).deploy();
    
    vestingInterval = days(30);
    
    now = await latestBlockTimestamp(ethers.provider);
    cliffDuration = days(1);

    unlock = await new FixedAmountVesting__factory(signers[0]).deploy(
      token.address,
      now + cliffDuration,
      vestingInterval,
    );
  });

  it('withdraw', async () => {
    const signer = signers[1];
    const totalAmount = 38000;
    const amountsPerVesting: BigNumberish[] = [4000,	4000,	4000,	4000,	4000,	4000,	4000,	4000,	4000,	2000];
    await unlock.setLockup(
      [signer.address],
      [totalAmount],
      [4000],
    );

    await expect(unlock.connect(signers[1]).withdraw()).to.be.revertedWith('FixedAmountVesting: RENOUNCE_OWNERSHIP');
    await unlock.renounceOwnership();
    await token.transfer(unlock.address, totalAmount);
    expect(await unlock.unlockedAmountOf(signer.address)).to.eq(0);
    await mineBlockAtTime(ethers.provider, now + cliffDuration);
    for (let i = 0; i < amountsPerVesting.length; ++i) {
      const amount = amountsPerVesting[i];
      expect(await unlock.unlockedAmountOf(signer.address)).to.eq(amount);
      await expect(unlock.connect(signer).withdraw()).to.emit(unlock, 'Withdraw').withArgs(signer.address, amount);
      await mineBlockAtTime(ethers.provider, now + cliffDuration + (i + 1) * vestingInterval);
    }
    expect(await unlock.unlockedAmountOf(signer.address)).to.eq(0);
  });

  it('withdraw:accounting', async () => {
    const signer = signers[1];
    const totalAmount = 38000;
    const amountsPerVesting: BigNumberish[] = [4000,	4000,	4000,	4000,	4000,	4000,	4000,	4000,	4000,	2000];
    await unlock.setLockup(
      [signer.address],
      [totalAmount],
      [4000],
    );

    await expect(unlock.connect(signers[1]).withdraw()).to.be.revertedWith('FixedAmountVesting: RENOUNCE_OWNERSHIP');
    await unlock.renounceOwnership();
    await token.transfer(unlock.address, totalAmount);
    expect(await unlock.unlockedAmountOf(signer.address)).to.eq(0);
    await mineBlockAtTime(ethers.provider, now + cliffDuration);
    let acc = BigNumber.from(0)
    for (let i = 0; i < amountsPerVesting.length; ++i) {
      const amount = amountsPerVesting[i];
      expect(await unlock.unlockedAmountOf(signer.address)).to.eq(acc.add(amount));
      await mineBlockAtTime(ethers.provider, now + cliffDuration + (i + 1) * vestingInterval);
      acc = acc.add(amount)
    }
    await expect(unlock.connect(signer).withdraw()).to.emit(unlock, 'Withdraw').withArgs(signer.address, acc);
    expect(await unlock.unlockedAmountOf(signer.address)).to.eq(0);
  });

  it('withdraw:2', async () => {
    const signer = signers[1];
    const totalAmount = 34000;
    const amountsPerVesting: BigNumberish[] = [4000,	4000,	4000,	4000,	4000,	4000,	4000,	4000,	2000];
    await unlock.setLockup(
      [signer.address],
      [totalAmount],
      [4000],
    );

    await expect(unlock.connect(signers[1]).withdraw()).to.be.revertedWith('FixedAmountVesting: RENOUNCE_OWNERSHIP');
    await unlock.renounceOwnership();
    await token.transfer(unlock.address, totalAmount);
    expect(await unlock.unlockedAmountOf(signer.address)).to.eq(0);
    await mineBlockAtTime(ethers.provider, now + cliffDuration);
    for (let i = 0; i < amountsPerVesting.length; ++i) {
      const amount = amountsPerVesting[i];
      expect(await unlock.unlockedAmountOf(signer.address)).to.eq(amount);
      await expect(unlock.connect(signer).withdraw()).to.emit(unlock, 'Withdraw').withArgs(signer.address, amount);
      await mineBlockAtTime(ethers.provider, now + cliffDuration + (i + 1) * vestingInterval);
    }
    expect(await unlock.unlockedAmountOf(signer.address)).to.eq(0);
  });

  it('withdraw:accounting:2', async () => {
    const signer = signers[1];
    const totalAmount = 34000;
    const amountsPerVesting: BigNumberish[] = [4000,	4000,	4000,	4000,	4000,	4000,	4000,	4000,	2000];
    await unlock.setLockup(
      [signer.address],
      [totalAmount],
      [4000],
    );

    await expect(unlock.connect(signers[1]).withdraw()).to.be.revertedWith('FixedAmountVesting: RENOUNCE_OWNERSHIP');
    await unlock.renounceOwnership();
    await token.transfer(unlock.address, totalAmount);
    expect(await unlock.unlockedAmountOf(signer.address)).to.eq(0);
    await mineBlockAtTime(ethers.provider, now + cliffDuration);
    let acc = BigNumber.from(0)
    for (let i = 0; i < amountsPerVesting.length; ++i) {
      const amount = amountsPerVesting[i];
      expect(await unlock.unlockedAmountOf(signer.address)).to.eq(acc.add(amount));
      await mineBlockAtTime(ethers.provider, now + cliffDuration + (i + 1) * vestingInterval);
      acc = acc.add(amount)
    }
    await expect(unlock.connect(signer).withdraw()).to.emit(unlock, 'Withdraw').withArgs(signer.address, acc);
    expect(await unlock.unlockedAmountOf(signer.address)).to.eq(0);
  });
});
