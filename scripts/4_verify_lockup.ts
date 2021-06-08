import { ethers } from 'hardhat';
import * as hre from 'hardhat';
import { Overrides } from 'ethers';
import { latestBlockTimestamp, requestConfirmation } from '../test/shared/utilities';
import { parseBigNumber, parseBnbAddress, parseString, parseWallet } from '../test/shared/parser';
import { HAPI__factory, FixedAmountVesting__factory } from '../typechain';
import { days } from '../test/shared/time';


async function main() {
  console.log(`
*********************************
*** Verify FixedAmountVesting ***
*********************************
`);
  const cliffEnd = parseBigNumber('CLIFF_END', 0).toNumber();
  const vestingInterval = parseBigNumber('VESTING_INTERVAL', 0).toNumber();
  const HAPI = parseBnbAddress('HAPI');
  const lockupAddress = parseBnbAddress('LOCKUP');
  const network = (await ethers.provider.getNetwork()).name;
  console.log(`
Network: ${network}
HAPI: ${HAPI}
cliffEnd: ${cliffEnd}
vestingInterval: ${vestingInterval}
lockupAddress: ${lockupAddress}
  `);

  await requestConfirmation();

  console.log('Verify FixedAmountVesting');

  await hre.run('verify:verify', {
    address: lockupAddress,
    network: network,
    constructorArguments: [HAPI, cliffEnd, vestingInterval],
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
