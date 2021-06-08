import { ethers } from 'hardhat';
import { Overrides } from 'ethers';
import { requestConfirmation } from '../test/shared/utilities';
import { parseBigNumber, parseBnbAddress, parseWallet } from '../test/shared/parser';
import { Airdrop__factory } from '../typechain';

const _overrides: Overrides = {
  gasLimit: 7000000,
};

async function main() {
  console.log(`
**********************
*** Deploy Airdrop ***
**********************
`);
  const wallet = parseWallet('PRIVATE_KEY');
  const token = parseBnbAddress('TOKEN');
  const gasPrice = parseBigNumber('GAS_PRICE_GWEI', 9);
  const overrides: Overrides = { ..._overrides, gasPrice: gasPrice };
  console.log('Network:', (await ethers.provider.getNetwork()).name);

  await requestConfirmation();

  console.log('Deploy Airdrop');
  const airdrop = await new Airdrop__factory(wallet).deploy(token, overrides);
  console.log(`\x1b[32m${airdrop.address}\x1b[0m`);
  console.log(`Waiting for result of: \x1b[36m${airdrop.deployTransaction.hash}\x1b[0m`);
  await airdrop.deployTransaction.wait();
  console.log('Success');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
