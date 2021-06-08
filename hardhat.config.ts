import 'hardhat-typechain';
import 'solidity-coverage';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-typechain';
import '@typechain/ethers-v5';
import '@nomiclabs/hardhat-web3';
import '@nomiclabs/hardhat-etherscan';

import * as dotenv from 'dotenv';
import { accounts } from './test/shared/accounts';
import { HardhatUserConfig } from 'hardhat/types';

dotenv.config();

const secret: string = process.env.PRIVATE_KEY as string;
const etherscanKey: string = process.env.ETHERSCAN_API_KEY as string;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.6.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      gas: 99999999,
      gasPrice: 1,
      blockGasLimit: 999999999,
      // allowUnlimitedContractSize: true,
      accounts: accounts,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [secret],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [secret],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [secret],
    },
    bsc_testnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [secret],
    },
    bsc_mainnet: {
      url: 'https://bsc-dataseed.binance.org/',
      chainId: 56,
      gasPrice: 20000000000,
      accounts: [secret],
    },
    coverage: {
      url: 'http://127.0.0.1:8555', // Coverage launches its own ganache-cli client
    },
    local: {
      url: 'http://127.0.0.1:8545',
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: etherscanKey,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
};

export default config;
