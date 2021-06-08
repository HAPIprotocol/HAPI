import { ethers } from 'hardhat';
import { Overrides } from 'ethers';
import { requestConfirmation } from '../test/shared/utilities';
import { parseBigNumber, parseWallet } from '../test/shared/parser';
import { HAPI__factory } from '../typechain';

const _overrides: Overrides = {
  gasLimit: 7000000,
};

async function main() {
  console.log(`
*******************
*** Deploy HAPI ***
*******************
`);
  const wallet = parseWallet('PRIVATE_KEY');
  const gasPrice = parseBigNumber('GAS_PRICE_GWEI', 9);
  const overrides: Overrides = { ..._overrides, gasPrice: gasPrice };
  console.log('Network:', (await ethers.provider.getNetwork()).name);

  await requestConfirmation();

  console.log('Deploy HAPI');
  const HAPI = await new HAPI__factory(wallet).deploy(overrides);
  console.log(`\x1b[32m${HAPI.address}\x1b[0m`);
  console.log(`Waiting for result of: \x1b[36m${HAPI.deployTransaction.hash}\x1b[0m`);
  await HAPI.deployTransaction.wait();
  console.log('Success');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
