## Description

#  Installation

1. Make sure to use node 12.12.0
2. Run `npm install` in project root directory
3. Create `.env` file:

```
PRIVATE_KEY="{YOUR_PRIVATE_KEY}"
CONTRACT_OWNER="{CONTRACT_OWNER}"
FEE_LIMIT="{FEE_LIMIT}"
USER_FEE_PERCENTAGE="{USER_FEE_PERCENTAGE}"
PROXY_ADDRESS="{PROXY_ADDRESS}"
CONTRACT_VERSION_1_ADDRESS="{CONTRACT_VERSION_1_ADDRESS}"
CONTRACT_VERSION_2_ADDRESS="{CONTRACT_VERSION_2_ADDRESS}"
```

4. Run `npm run rebuild` in project root directory

# Deploy to TRON testnet
As a testnet network we can use Shasta.
Shasta's test coins can be obtained https://www.trongrid.io/shasta/#request.
Transactions for testnet can be found on https://shasta.tronscan.org/#/.
For test deploying:
1) Run `npx hardhat run --network testnet ./scripts/1_deploy_proxy.ts` to deploy test proxy.
2) Run `npx hardhat run --network testnet ./scripts/2_deploy_contract.ts` to deploy test contract.
3) Run `npx hardhat run --network testnet ./scripts/3_set_initial_proxy_state.ts` to set initial proxy state.
4) Run `npx hardhat run --network testnet ./scripts/4_mint_tokens.ts` to mint test tokens.
5) Run `npx hardhat run --network testnet ./scripts/5_deploy_new_contract.ts` to deploy test contract V2.
6) Run `npx hardhat run --network testnet ./scripts/6_upgrade_contract.ts` to upgrade proxy contract.
7) Run `npx hardhat run --network testnet ./scripts/7_burn_tokens.ts` to burn test tokens.

After EACH script on https://shasta.tronscan.org/ check that transaction was confirmed.




