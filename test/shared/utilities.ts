import { ethers } from 'hardhat';
import yesno from 'yesno';


export function addressFromNumber(n: number): string {
  const addressZeros = '0000000000000000000000000000000000000000';
  return `0x${addressZeros.substring(n.toString().length)}${n.toString()}`;
}

export async function latestBlockTimestamp(provider: typeof ethers.provider): Promise<number> {
  const latestBlockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(latestBlockNumber);
  return block.timestamp;
}

export async function mineBlocks(provider: typeof ethers.provider, count: number): Promise<void> {
  for (let i = 1; i < count; i++) {
    await provider.send('evm_mine', []);
  }
}

export async function mineBlockAtTime(provider: typeof ethers.provider, timestamp: number): Promise<void> {
  await provider.send('evm_mine', [timestamp]);
}

export async function increaseTime(provider: typeof ethers.provider, timestamp: number): Promise<void> {
  await provider.send('evm_increaseTime', [timestamp]);
}

export async function requestConfirmation(message = 'Ready to continue?'): Promise<void> {
  const ok = await yesno({
    yesValues: ['', 'yes', 'y', 'yes'],
    question: message,
  });
  if (!ok) {
    throw new Error('Script cancelled.');
  }
}