import { ethers } from 'hardhat';
import { BigNumber, Overrides } from 'ethers';
import { latestBlockTimestamp, requestConfirmation } from '../test/shared/utilities';
import { parseBigNumber, parseBnbAddress, parseBool, parseWallet } from '../test/shared/parser';
import { HAPI__factory, FixedAmountVesting__factory } from '../typechain';

const _overrides: Overrides = {
  gasLimit: 7000000,
};

async function main() {
  console.log(`
*******************************
*** Safe transfer to lockup ***
*******************************
`);
  const wallet = parseWallet('PRIVATE_KEY');
  const lockupAddress = parseBnbAddress('LOCKUP');
  const HAPIAddress = parseBnbAddress('HAPI');
  const amountWei = parseBigNumber('AMOUNT_WEI', 0);
  const gasPrice = parseBigNumber('GAS_PRICE_GWEI', 9);
  const overrides: Overrides = { ..._overrides, gasPrice: gasPrice };
  console.log(`
Network: ${(await ethers.provider.getNetwork()).name}
Lockup: ${lockupAddress}
HAPI: ${HAPIAddress}
Amount in wei: ${amountWei}
Amount in HAPI: ${ethers.utils.formatEther(amountWei)}
`);
  const HAPI = new HAPI__factory(wallet).attach(HAPIAddress);
  const decimals = await HAPI.decimals();
  const decimalMultiplier = BigNumber.from(10).pow(decimals);
  
  await requestConfirmation();

  const max = BigNumber.from(5000).mul(decimalMultiplier);
  if (amountWei.gte(max)) {
    await requestConfirmation('Warning! Transferring more than allowed. Do you want to continue?');
  }
  console.log('Transfer...');
  const tx = await HAPI.transfer(lockupAddress, amountWei, overrides)
  console.log(`Waiting for result of: \x1b[36m${tx.hash}\x1b[0m`);
  await tx.wait();
  console.log('Success');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
