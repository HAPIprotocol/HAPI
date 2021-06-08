import { ethers } from 'hardhat';
import { BigNumber, Overrides, Wallet } from 'ethers';
import { parseBigNumber, parseBnbAddress, parseString, parseWallet } from '../test/shared/parser';
import { requestConfirmation } from '../test/shared/utilities';
import fs from 'fs';
import { Airdrop } from '../typechain/Airdrop';
import { ERC20__factory } from '../typechain/factories/ERC20__factory';
import { Airdrop__factory } from '../typechain/factories/Airdrop__factory';
import { ERC20 } from '../typechain/ERC20';

const _overrides: Overrides = {
  gasLimit: 2000000,
};

async function main() {
  console.log(`
****************************
*** Airdrop distribution ***
****************************
`);
  const wallet = parseWallet('PRIVATE_KEY');
  const gasPrice = parseBigNumber('GAS_PRICE_GWEI', 9);
  const filePath = parseString('FILE');
  const percentage = parseBigNumber('PART_PERCENTAGE', 0);
  const airdropAddress = parseBnbAddress('AIRDROP');
  const hapiAddress = parseBnbAddress('HAPI');
  const offset = parseBigNumber('OFFSET', 0).toNumber();
  const count = parseBigNumber('COUNT', 0).toNumber();

  const airdrop = new Airdrop__factory(wallet).attach(airdropAddress);

  if (percentage.gt('100')) {
    throw new Error(`Invalid percentage: ${percentage}`);
  }
  const participants = await readCSV(filePath, percentage);

  if (count <= 0) {
    throw new Error(`Invalid count: ${count}`);
  }

  const overrides: Overrides = { ..._overrides, gasPrice: gasPrice };
  console.log('Network:', (await ethers.provider.getNetwork()).name);

  const totalAmount = participants
    .map(p => p.amount.mul(percentage).div('100'))
    .reduce((acc, a) => acc.add(a), BigNumber.from(0));
  const ERC20 = await new ERC20__factory(wallet).attach(hapiAddress);
  const allowance = await ERC20.allowance(wallet.address, airdropAddress);
  const balance = await ERC20.balanceOf(wallet.address);

  console.log('Airdrop:');
  console.log(airdropAddress);
  console.log('Percentage:');
  console.log(percentage.toString());
  console.log('Total amount:');
  console.log(totalAmount.toString());
  console.log('Allowance:');
  console.log(allowance.toString());
  console.log('Balance:');
  console.log(balance.toString());

  // if (allowance.lt(totalAmount)) {
  //   throw new Error(`Invalid amount.\Allowance: ${allowance.toString()}\nActual: ${totalAmount.toString()}`);
  // }
  // if (balance.lt(totalAmount)) {
  //   throw new Error(`Invalid amount.\nBalance: ${balance.toString()}\nActual: ${totalAmount.toString()}`);
  // }

  const batch: BatchDetails = {
    erc20: ERC20,
    participants,
    offset,
    count,
    airdrop,
    wallet,
    percentage,
    totalAmount,
    overrides,
  };

  await distributeForBatch(batch);

  console.log('Success');
}

async function readCSV(filePath: string, percentage: BigNumber): Promise<PrivatePresaleParticipant[]> {
  const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
  return fileContent
    .split('\n')
    .map(r => r.split(','))
    .map((rows, index) => parsePrivatePresaleParticipant(rows, index + 1, percentage));
}

interface BatchDetails {
  erc20: ERC20;
  participants: PrivatePresaleParticipant[];
  offset: number;
  count: number;
  airdrop: Airdrop;
  wallet: Wallet;
  percentage: BigNumber;
  totalAmount: BigNumber;
  overrides: Overrides;
}

interface PrivatePresaleParticipant {
  rows: string[];
  line: number;
  address: string;
  amount: BigNumber;
}

function parsePrivatePresaleParticipant(
  rows: string[],
  line: number,
  percentage: BigNumber,
): PrivatePresaleParticipant {
  const [addressString, amountString] = rows;
  let address: string;
  let amount: BigNumber; // in HAPI
  try {
    address = ethers.utils.getAddress(addressString);
  } catch (e) {
    throw new Error(`${line}: invalid address: ${addressString}`);
  }
  try {
    amount = ethers.utils.parseUnits(amountString, 18);
  } catch (e) {
    throw new Error(`${line}: invalid address: ${addressString}`);
  }

  return { rows, line, address, amount: amount.mul(percentage).div('100') };
}

class PrivatePresaleParticipant {
  public rows: string[];
  public line: number;

  constructor(rows: string[], line: number) {
    this.rows = rows;
    this.line = line;
  }
}

async function distributeForBatch(batch: BatchDetails): Promise<void> {
  const { erc20, wallet, participants, offset, count, airdrop, overrides } = batch;
  const end = Math.min(participants.length, offset + count);
  console.log('distributeForBatch', 'offset:', offset, 'count:', count, 'nextOffset:', offset + count);

  const participantBatch = participants.slice(offset, end);
  if (participantBatch.length === 0) {
    console.log('Distribution finished');
    return;
  }
  const allowance = await erc20.allowance(wallet.address, airdrop.address);
  const balance = await erc20.balanceOf(wallet.address);
  const totalAmount = participantBatch.map(p => p.amount).reduce((acc, a) => acc.add(a), BigNumber.from(0));
  if (balance.lt(allowance)) {
    throw `Error: allowance ${allowance.toString()} exceeds balance ${balance.toString()}`;
  }
  if (allowance.lt(totalAmount)) {
    throw `Error: total amount ${totalAmount.toString()} exceeds allowance ${allowance.toString()}`;
  }
  const confirmationMessage = `
Offset: ${offset}
Count: ${count}
Start line: ${participantBatch[0].line}
End line: ${participantBatch[participantBatch.length - 1].line}
Addresses: ${participantBatch.reduce((acc, a) => acc + `\n${a.address}: ${a.amount.toString()}`, '')}
Total: ${totalAmount}
Balance: ${balance.toString()}
Allowance: ${allowance.toString()}
Do you confirm the transaction?
`;

  await requestConfirmation(confirmationMessage);

  const distributionTx = await airdrop.transfer(
    participantBatch.map(p => p.address),
    participantBatch.map(p => p.amount),
    totalAmount,
    overrides,
  );
  console.log(`Waiting for result of: \x1b[36m${distributionTx.hash}\x1b[0m`);
  await distributionTx.wait();
  console.log('Success');
  await distributeForBatch({ ...batch, offset: offset + count });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
