import { ethers } from 'hardhat';
import { HAPI, HAPI__factory, HAPIBSC, HAPIBSC__factory } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';

describe('HAPI', () => {
  let signers: SignerWithAddress[];
  let HAPI: HAPI;
  let HAPIBSC: HAPIBSC;
  const DECIMAL_MULTIPLIER = BigNumber.from(10).pow(18);

  beforeEach(async () => {
    signers = await ethers.getSigners();
    HAPI = await new HAPI__factory(signers[0]).deploy();
    HAPIBSC = await new HAPIBSC__factory(signers[0]).deploy();
  });

  it('name, symbol, decimals', async () => {
    expect(await HAPI.name()).to.eq('HAPI');
    expect(await HAPI.symbol()).to.eq('HAPI');
    expect(await HAPI.decimals()).to.eq(18);
  });

  it('INITIAL_SUPPLY', async () => {
    const initialSupply = BigNumber.from('100000').mul(DECIMAL_MULTIPLIER);
    expect(await HAPI.INITIAL_SUPPLY()).to.eq(initialSupply);
    expect(await HAPI.balanceOf(signers[0].address)).to.eq(initialSupply);
    expect(await HAPI.totalSupply()).to.eq(initialSupply);
  });

  it('MAX_SUPPLY', async () => {
    const MAX_SUPPLY = await HAPI.MAX_SUPPLY();
    expect(MAX_SUPPLY).to.eq(BigNumber.from('1000000').mul(DECIMAL_MULTIPLIER));
    
    const mintableSupply = MAX_SUPPLY.sub(await HAPI.totalSupply());
    expect(mintableSupply).to.eq(BigNumber.from('900000').mul(DECIMAL_MULTIPLIER));
    
    await expect(HAPI.mint(signers[1].address, mintableSupply.add(1))).to.be.revertedWith('HAPI: MAX_SUPPLY');
    await HAPI.mint(signers[1].address, mintableSupply);

    const newMintableSupply = MAX_SUPPLY.sub(await HAPI.totalSupply());
    expect(await HAPI.totalSupply()).to.eq(MAX_SUPPLY);
    expect(newMintableSupply).to.eq('0');
  });

  it('mint', async () => {
    await expect(HAPI.connect(signers[1]).mint(signers[1].address, '100')).to.be.revertedWith(
      'ERC20PresetMinterPauser: must have minter role to mint',
    );
    expect(await HAPI.balanceOf(signers[1].address)).to.eq('0');

    await expect(HAPI.connect(signers[0]).mint(signers[1].address, '100'))
      .to.emit(HAPI, 'Transfer')
      .withArgs(ethers.constants.AddressZero, signers[1].address, '100');
    
      expect(await HAPI.balanceOf(signers[1].address)).to.eq('100');
  });

  it('grantRole, revokeRole', async () => {
    const MINTER_ROLE = await HAPI.MINTER_ROLE();
    await expect(HAPI.connect(signers[1]).grantRole(MINTER_ROLE, signers[2].address)).to.be.revertedWith(
      'AccessControl: sender must be an admin to grant',
    );
    await HAPI.grantRole(MINTER_ROLE, signers[1].address);

    expect(await HAPI.balanceOf(signers[1].address)).to.eq('0');

    await expect(HAPI.connect(signers[1]).mint(signers[2].address, '100'))
      .to.emit(HAPI, 'Transfer')
      .withArgs(ethers.constants.AddressZero, signers[2].address, '100');

    await expect(HAPI.connect(signers[1]).revokeRole(MINTER_ROLE, signers[0].address)).to.be.revertedWith(
      'AccessControl: sender must be an admin to revoke',
    );

    await HAPI.revokeRole(MINTER_ROLE, signers[1].address);

    await expect(HAPI.connect(signers[1]).grantRole(MINTER_ROLE, signers[2].address)).to.be.revertedWith(
      'AccessControl: sender must be an admin to grant',
    );

    await expect(HAPI.connect(signers[1]).mint(signers[1].address, '100')).to.be.revertedWith(
      'ERC20PresetMinterPauser: must have minter role to mint',
    );

  });

  it('getOwner', async () => {
    expect(await HAPIBSC.getOwner()).to.eq(signers[0].address)
  });

  it('BSC:INITIAL_SUPPLY', async () => {
    const initialSupply = BigNumber.from('35000').mul(DECIMAL_MULTIPLIER);
    expect(await HAPIBSC.INITIAL_SUPPLY()).to.eq(initialSupply);
    expect(await HAPIBSC.balanceOf(signers[0].address)).to.eq(initialSupply);
    expect(await HAPIBSC.totalSupply()).to.eq(initialSupply);
  });

  it('changeOwner', async () => {
    const ADMIN_ROLE = await HAPIBSC.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await HAPIBSC.MINTER_ROLE();
    const PAUSER_ROLE = await HAPIBSC.PAUSER_ROLE();
    const newOwner = signers[1];

    await HAPIBSC.grantRole(ADMIN_ROLE, newOwner.address);
    await HAPIBSC.connect(newOwner).grantRole(MINTER_ROLE, newOwner.address);
    expect(await HAPIBSC.getRoleMemberCount(ADMIN_ROLE)).to.eq(2);
    
    await HAPIBSC.connect(newOwner).revokeRole(ADMIN_ROLE, signers[0].address)
    await HAPIBSC.connect(newOwner).revokeRole(MINTER_ROLE, signers[0].address)
    await HAPIBSC.connect(newOwner).revokeRole(PAUSER_ROLE, signers[0].address)

    await expect(HAPIBSC.mint(newOwner.address, '100')).to.be.revertedWith(
      'ERC20PresetMinterPauser: must have minter role to mint',
    );
    await expect(HAPIBSC.pause()).to.be.revertedWith(
      'ERC20PresetMinterPauser: must have pauser role to pause',
    );
    expect(await HAPIBSC.getOwner()).to.eq(newOwner.address);
    await HAPIBSC.connect(newOwner).mint(signers[0].address, '100');
    
    await HAPIBSC.connect(newOwner).grantRole(PAUSER_ROLE, newOwner.address);
    await HAPIBSC.connect(newOwner).pause();
  });
});
