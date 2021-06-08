import { ethers } from 'hardhat';
import * as hre from 'hardhat';
import { Overrides } from 'ethers';
import { latestBlockTimestamp, requestConfirmation } from '../test/shared/utilities';
import { parseBigNumber, parseBnbAddress, parseWallet } from '../test/shared/parser';
import { HAPI__factory, FixedAmountVesting__factory } from '../typechain';
import { days } from '../test/shared/time';

const _overrides: Overrides = {
  gasLimit: 7000000,
};

async function main() {
  console.log(`
*********************************
*** Deploy FixedAmountVesting ***
*********************************
`);
  const wallet = parseWallet('PRIVATE_KEY');
  const HAPI = parseBnbAddress('HAPI');
  const gasPrice = parseBigNumber('GAS_PRICE_GWEI', 9);
  const overrides: Overrides = { ..._overrides, gasPrice: gasPrice };
  const network = (await ethers.provider.getNetwork()).name;
  const vestingInterval = days(30);
  const cliffEnd = 1618059600; // Sat Apr 10 2021 13:00:00 GMT+0000
  console.log(`
Network: ${network}
HAPI: ${HAPI}
cliffEnd: ${cliffEnd}
vestingInterval: ${vestingInterval}
  `);

  await requestConfirmation();

  console.log('Deploy FixedAmountVesting');

  const unlock = await new FixedAmountVesting__factory(wallet).deploy(
    HAPI,
    cliffEnd,
    vestingInterval,
    overrides
  );
  console.log(`\x1b[32m${unlock.address}\x1b[0m`);
  console.log(`Waiting for result of: \x1b[36m${unlock.deployTransaction.hash}\x1b[0m`);
  await unlock.deployTransaction.wait();
  console.log('Success');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
