import { ethers } from 'hardhat';
import { BigNumber, Overrides, Wallet } from 'ethers';
import { parseBigNumber, parseBnbAddress, parseString, parseWallet } from '../test/shared/parser';
import { requestConfirmation } from '../test/shared/utilities';
import fs from 'fs';
import { FixedAmountVesting } from '../typechain/FixedAmountVesting';
import { ERC20__factory } from '../typechain/factories/ERC20__factory';
import { FixedAmountVesting__factory } from '../typechain/factories/FixedAmountVesting__factory';
import { ERC20 } from '../typechain/ERC20';

const _overrides: Overrides = {
  gasLimit: 2000000,
};

async function main() {
  console.log(`
****************************
*** Lockup distribution ***
****************************
`);
  const wallet = parseWallet('PRIVATE_KEY');
  const gasPrice = parseBigNumber('GAS_PRICE_GWEI', 9);
  const filePath = parseString('FILE');
  const lockupAddress = parseBnbAddress('LOCKUP');
  const hapiAddress = parseBnbAddress('HAPI');
  const offset = parseBigNumber('OFFSET', 0).toNumber();
  const count = parseBigNumber('COUNT', 0).toNumber();

  const lockup = new FixedAmountVesting__factory(wallet).attach(lockupAddress);

  const participants = await readCSV(filePath);

  if (count <= 0) {
    throw new Error(`Invalid count: ${count}`);
  }

  const overrides: Overrides = { ..._overrides, gasPrice: gasPrice };
  console.log('Network:', (await ethers.provider.getNetwork()).name);

  const vestedPerInterval = participants
    .map(p => p.amount)
    .reduce((acc, a) => acc.add(a), BigNumber.from(0));
    const totalAmount = participants
    .map(p => p.totalAmount)
    .reduce((acc, a) => acc.add(a), BigNumber.from(0));
  const ERC20 = await new ERC20__factory(wallet).attach(hapiAddress);
  const balance = await ERC20.balanceOf(lockupAddress);

  console.log('Lockup:');
  console.log(lockupAddress);
  console.log('Vested per interval:');
  console.log(vestedPerInterval.toString());
  console.log('Total amount:');
  console.log(totalAmount.toString());
  console.log('Balance:');
  console.log(balance.toString());

  const batch: BatchDetails = {
    erc20: ERC20,
    participants,
    offset,
    count,
    lockup,
    wallet,
    totalAmount,
    overrides,
  };

  await distributeForBatch(batch);

  console.log('Success');
}

async function readCSV(filePath: string): Promise<PrivatePresaleParticipant[]> {
  const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
  return fileContent
    .split('\n')
    .map(r => r.replace(/(?:\r\n|\r|\n)/g, '').split(','))
    .map((rows, index) => parsePrivatePresaleParticipant(rows, index + 1));
}

interface BatchDetails {
  erc20: ERC20;
  participants: PrivatePresaleParticipant[];
  offset: number;
  count: number;
  lockup: FixedAmountVesting;
  wallet: Wallet;
  totalAmount: BigNumber;
  overrides: Overrides;
}

interface PrivatePresaleParticipant {
  rows: string[];
  line: number;
  address: string;
  amount: BigNumber;
  totalAmount: BigNumber;
}

function parsePrivatePresaleParticipant(
  rows: string[],
  line: number,
): PrivatePresaleParticipant {
  const [addressString, totalAmountString, amountString] = rows;
  let address: string;
  let amount: BigNumber; // in HAPI
  let totalAmount: BigNumber; // in HAPI
  try {
    address = ethers.utils.getAddress(addressString);
  } catch (e) {
    throw new Error(`${line}: invalid address: ${addressString}`);
  }
  try {
    totalAmount = ethers.utils.parseEther(totalAmountString);
  } catch (e) {
    throw new Error(`${line}: invalid total amount: ${totalAmountString}`);
  }
  try {
    amount = ethers.utils.parseEther(amountString);
  } catch (e) {
    throw new Error(`${line}: invalid amount: ${amountString}`);
  }

  return { rows, line, address, amount, totalAmount };
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
  const { erc20, wallet, participants, offset, count, lockup, overrides } = batch;
  const end = Math.min(participants.length, offset + count);
  console.log('distributeForBatch', 'offset:', offset, 'count:', count, 'nextOffset:', offset + count);

  const participantBatch = participants.slice(offset, end);
  if (participantBatch.length === 0) {
    console.log('Distribution finished');
    return;
  }
  const balance = await erc20.balanceOf(wallet.address);
  const totalAmount = participantBatch.map(p => p.amount).reduce((acc, a) => acc.add(a), BigNumber.from(0));
  const confirmationMessage = `
Offset: ${offset}
Count: ${count}
Start line: ${participantBatch[0].line}
End line: ${participantBatch[participantBatch.length - 1].line}
Addresses (address|total|amount): ${participantBatch.reduce((acc, a) => acc + `\n${a.address} | ${a.totalAmount.toString()} | ${a.amount.toString()}`, '')}
Total: ${totalAmount}
Balance: ${balance.toString()}
Do you confirm the transaction?
`;

  await requestConfirmation(confirmationMessage);

  const distributionTx = await lockup.setLockup(
    participantBatch.map(p => p.address),
    participantBatch.map(p => p.totalAmount),
    participantBatch.map(p => p.amount),
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
