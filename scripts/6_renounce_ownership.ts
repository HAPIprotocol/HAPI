
import { ethers } from 'hardhat';
import { Overrides } from 'ethers';
import { requestConfirmation } from '../test/shared/utilities';
import { parseBigNumber, parseBnbAddress, parseWallet } from '../test/shared/parser';
import { FixedAmountVesting__factory } from '../typechain';

const _overrides: Overrides = {
  gasLimit: 1000000,
};

async function main() {
  console.log(`
**************************
*** Renounce ownership ***
**************************
`);
  const wallet = parseWallet('PRIVATE_KEY');
  const lockupAddress = parseBnbAddress('LOCKUP');
  const gasPrice = parseBigNumber('GAS_PRICE_GWEI', 9);
  const overrides: Overrides = { ..._overrides, gasPrice: gasPrice };
  console.log(`
Network: ${(await ethers.provider.getNetwork()).name}
Lockup: ${lockupAddress}
`);
  const lockup = new FixedAmountVesting__factory(wallet).attach(lockupAddress);
  await requestConfirmation('Warning! Do you want to renounce ownership?');
  await requestConfirmation(`Second confirmation is needed to renounce ownership.`);

  console.log('Renouncing ownership...');
  const tx = await lockup.renounceOwnership(overrides);
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