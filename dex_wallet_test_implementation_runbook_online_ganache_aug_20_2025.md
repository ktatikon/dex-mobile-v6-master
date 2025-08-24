# DEX Wallet Test & Implementation Runbook (Online + Ganache)

**Context read from your MD**: Current state is **Phase 4.5 (~75% complete)** with wallet creation/management UI working, admin-only testnet flows present, and Alchemy integration available via API calls. Gaps include **real blockchain API wiring in services**, **testnet faucet flow**, and **local test network setup**. Key files referenced in your MD:

- `src/services/phase4/realBlockchainService.ts`
- `src/services/comprehensiveWalletService.ts`
- `src/components/wallet/EnhancedWalletConnectionManager.tsx`
- `src/services/walletGenerationService.ts`
- `src/contexts/TestnetContext.tsx`
- `src/services/testnetDatabaseService.ts`
- `src/services/enhancedHardwareWalletService.ts`

This runbook gives you **immediate, step-by-step test flows** and **ready-to-paste scaffolds** for:

1) **Online testnet (Sepolia)** — using Alchemy HTTP + WebSocket
2) **Local testing with Ganache** — standard local chain and optional Sepolia fork
3) **Minimal contract & deploy scripts** (ERC20 mock) to validate approvals/transfers before your DEX contracts exist
4) **Service wiring checklist** to land Phase 5 quickly

---

## 0) Quick Environment Setup

Create/verify the following environment variables (Vite-style shown; adapt if Next.js):

```bash
# .env.local (do not commit)
VITE_CHAIN_ID=11155111                  # Sepolia
VITE_NETWORK_NAME=sepolia
VITE_ALCHEMY_SEPOLIA_HTTP=https://eth-sepolia.g.alchemy.com/v2/<YOUR_KEY>
VITE_ALCHEMY_SEPOLIA_WS=wss://eth-sepolia.g.alchemy.com/v2/<YOUR_KEY>

# Local Ganache
VITE_LOCAL_HTTP=http://127.0.0.1:8545
VITE_LOCAL_CHAIN_ID=1337

# Optional: other chains
VITE_ALCHEMY_MAINNET_HTTP=https://eth-mainnet.g.alchemy.com/v2/<YOUR_KEY>
VITE_ALCHEMY_MAINNET_WS=wss://eth-mainnet.g.alchemy.com/v2/<YOUR_KEY>
```

**Security**: Load via `import.meta.env` (Vite) and pass **only** necessary values to the browser. Keep provider keys server-side when possible and consider a proxy if you need to mask keys from the client.

---

## 1) Online Testnet (Sepolia) — Step-by-Step Test Flow

### 1.1 Wire up the provider and signer (ethers v6)

```ts
// src/services/phase4/realBlockchainService.ts
import { BrowserProvider, JsonRpcProvider, Contract, parseEther } from "ethers";

export class RealBlockchainService {
  private http = new JsonRpcProvider(import.meta.env.VITE_ALCHEMY_SEPOLIA_HTTP);
  // For subscriptions / pending tx tracking
  // Create lazily to avoid socket churn
  private _ws?: any;

  get ws() {
    if (!this._ws) {
      const { WebSocketProvider } = require("ethers");
      this._ws = new WebSocketProvider(import.meta.env.VITE_ALCHEMY_SEPOLIA_WS);
    }
    return this._ws;
  }

  /** Connect to injected wallet (MetaMask, Coinbase, etc.) */
  async connectInjected(): Promise<{ address: string; chainId: number }>
  {
    if (!window.ethereum) throw new Error("No injected wallet found");
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();
    return { address: accounts[0], chainId: Number(network.chainId) };
  }

  async getNativeBalance(address: string) {
    return this.http.getBalance(address); // returns BigInt (wei)
  }

  async sendNative(fromProvider: any, to: string, ethAmount: string) {
    const provider = new BrowserProvider(fromProvider);
    const signer = await provider.getSigner();
    const tx = await signer.sendTransaction({ to, value: parseEther(ethAmount) });
    return tx.wait();
  }
}
```

### 1.2 UI connection flow

- In `EnhancedWalletConnectionManager.tsx`, on **Connect Wallet**:
  - Call `RealBlockchainService.connectInjected()`
  - Verify `chainId === 11155111`. If not, prompt **Switch Network** using `wallet_addEthereumChain` or `wallet_switchEthereumChain`.
  - Persist the connected address in your `TestnetContext`.

```ts
await window.ethereum.request({
  method: "wallet_switchEthereumChain",
  params: [{ chainId: "0xaa36a7" /* 11155111 */ }]
});
```

**Expected result**: Wallet connects, correct chain, account appears in UI.

### 1.3 Basic sanity checks

1. Fetch native balance for the connected address → show in UI.
2. Get current block number via `http.getBlockNumber()` and show it.
3. Subscribe to `this.ws.on('block', cb)` and update a "Live blocks" ticker.

**Expected result**: Non-zero block height, live increments; balance equals faucet value after top-up.

### 1.4 Test a simple native transfer (Sepolia ETH)

1. Use faucet to fund the connected address.
2. From UI, send `0.001` ETH to a second address you control.
3. Display pending tx hash, status updates using `provider.waitForTransaction(hash)`.

**Expected result**: Tx transitions `pending → mined`, UI shows receipt (block number, gas used).

### 1.5 ERC20 sanity (using a mock or an existing test token)

If you have no token yet, deploy the **MockERC20** from section **3.1** to Sepolia using the deploy script (section **3.2**). Then wire:

```ts
import { Contract } from "ethers";
import erc20Abi from "./abi/erc20.json"; // standard ERC20 ABI

export async function erc20BalanceOf(rpc: JsonRpcProvider, token: string, user: string) {
  const c = new Contract(token, erc20Abi, rpc);
  return c.balanceOf(user) as Promise<bigint>;
}
```

**Tests**:
- `balanceOf` shows minted amount.
- `approve` → `transferFrom` via your UI (use signer for state-changing calls).

### 1.6 Message signing (login/auth)

- **Personal Sign**: `eth_sign` or `personal_sign` a nonce.
- **Typed Data (EIP-712)**: Build a `domain/types/message` and call `eth_signTypedData_v4` via `provider.send`.

**Expected result**: Signature verifies server-side; UI shows success.

### 1.7 Event subscriptions

- Use `ws` provider to `on('logs', filter, cb)` for your ERC20 `Transfer` topic.
- Show a real-time activity list in the UI.

---

## 2) Local Testing with Ganache — Step-by-Step

### 2.1 Install & start Ganache

```bash
npm i -D ganache
npx ganache --wallet.mnemonic "test test test test test test test test test test test junk" \
  --chain.chainId 1337 --server.host 127.0.0.1 --server.port 8545
```

- **Expected**: 10 funded accounts printed in console.
- Add network to MetaMask:
  - **RPC URL**: `http://127.0.0.1:8545`
  - **Chain ID**: `1337` (`0x539`)
  - **Currency**: ETH

### 2.2 (Optional) Fork Sepolia via Alchemy

Use real contracts/state but local speed:

```bash
npx ganache \
  --fork.url "$VITE_ALCHEMY_SEPOLIA_HTTP" \
  --fork.chainId 11155111 \
  --chain.chainId 1337 \
  --wallet.totalAccounts 20 \
  --miner.blockTime 1
```

**Notes**:
- Your local chain id remains **1337**. MetaMask connects to 1337; underlying data mirrors Sepolia at fork block.
- You can fund local accounts instantly and interact with pre-existing contracts.

### 2.3 Point your app to Ganache

- Set `VITE_CHAIN_ID=1337` and `VITE_LOCAL_HTTP=http://127.0.0.1:8545`.
- In `RealBlockchainService`, if `activeNetwork === 'local'`, use `new JsonRpcProvider(import.meta.env.VITE_LOCAL_HTTP)`.

### 2.4 Deploy MockERC20 locally and test

- Use the deploy script (section **3.2**) against `http://127.0.0.1:8545`.
- Test **balanceOf/transfer/approve** flows exactly as in Sepolia.

### 2.5 Test matrix on Ganache

- **Native transfer** success
- **ERC20 approval/transferFrom** success
- **EIP-1559** fields (maxFeePerGas, maxPriorityFeePerGas) auto-filled
- **Chain switch handling**: app detects/notifies when user is on wrong chain
- **Reorg safety** (simulate by restarting Ganache if forking)

---

## 3) Minimal Contracts & Deploy Scripts (for pre-DEX validation)

### 3.1 Mock ERC20 (Solidity)

```solidity
// contracts/MockERC20.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_, uint256 initialSupply) ERC20(name_, symbol_) {
        _mint(msg.sender, initialSupply);
    }
}
```

### 3.2 Hardhat quick deploy script

```ts
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Mock = await ethers.getContractFactory("MockERC20");
  const token = await Mock.deploy("Mock USD", "mUSD", ethers.parseUnits("1000000", 18));
  await token.waitForDeployment();

  console.log("MockERC20 deployed:", await token.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

**Hardhat config** (excerpt):

```ts
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    local: { url: process.env.VITE_LOCAL_HTTP || "http://127.0.0.1:8545" },
    sepolia: {
      url: process.env.VITE_ALCHEMY_SEPOLIA_HTTP!,
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : []
    }
  }
};
export default config;
```

Run:

```bash
npm i -D hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts typescript ts-node
npx hardhat compile
# Local
npx hardhat run scripts/deploy.ts --network local
# Sepolia
export PRIV_KEY=0x<deployer_private_key>
npx hardhat run scripts/deploy.ts --network sepolia
```

---

## 4) Wiring into Your Services (targeting Phase 5)

### 4.1 `RealBlockchainService`

- **Providers**: instantiate HTTP + lazy WS per network
- **Capabilities**: `connectInjected`, `getBalance`, `sendNative`, `call`, `estimateGas`, `subscribeLogs`
- **Errors**: Normalize MetaMask errors (4001 user rejected, -32603 internal, unsupported chain)
- **Retries**: Exponential backoff for transient RPC errors

### 4.2 `comprehensiveWalletService`

- Wraps `RealBlockchainService` and exposes:
  - `connectWallet`, `disconnectWallet`
  - `switchNetwork(chainId)`
  - `getPortfolio(address)` (native + selected ERC20s)
  - `transferNative`, `transferERC20`, `approveERC20`
  - `signMessage`, `signTypedData`
- Add simple **circuit breaker** and **status** method for UI health checks

### 4.3 `EnhancedWalletConnectionManager.tsx`

- UX flow: Connect → Ensure network → Show balances → Action buttons (Send, Receive, Approve)
- Show a **diagnostics badge** (RPC reachable, block height freshness, WS connected)
- Persist last-used wallet + network in local storage (non-sensitive)

### 4.4 `TestnetContext` + Faucet

- Keep admin-only toggles from your MD
- Add **FaucetService** stub now; later wire faucets per chain
- Rate-limit faucet button per address (e.g., 1 request/12h)

---

## 5) Test Cases (copy/paste checklist)

**Connection & Network**
- [ ] No wallet → error toast
- [ ] Wrong network → switch prompt, success → retry action
- [ ] Multiple accounts → accountChanged event handled

**Read-only**
- [ ] Get block number
- [ ] Get gas price & fee data
- [ ] Get native & ERC20 balances

**Transactions**
- [ ] Native transfer success
- [ ] ERC20 approve/transferFrom success
- [ ] Replace-by-fee (speed up) tested
- [ ] Cancel pending by nonce bump

**Signing**
- [ ] personal_sign → server verifies
- [ ] EIP-712 signTypedData → server verifies

**Realtime**
- [ ] WS block subscription updates UI
- [ ] ERC20 Transfer logs appear live

**Resilience**
- [ ] RPC outage fallback (retry/backoff)
- [ ] User rejects signature → clean UI state

---

## 6) Observability & DevEx

- **Structured logging**: request id, account, chainId, method, latency, result/error
- **Feature flags**: `ONLINE_TESTNET`, `LOCAL_GANACHE`, `FORK_MODE`
- **Health pings**: expose `/api/wallet/health` → returns provider status & latest block

---

## 7) Security Essentials (now, pre-audit)

- Never persist seed phrases in browser storage
- If you generate wallets, store encrypted material server-side with KMS
- Validate `chainId` on every tx; protect against phishing chain spoofing
- Display tx previews and human-readable token/amounts before signing

---

## 8) Definition of Done (Phase 5)

- [ ] Sepolia online flow passes **all tests** in section 5
- [ ] Ganache local flow (and fork mode) passes **all tests**
- [ ] `RealBlockchainService` + `comprehensiveWalletService` implemented and covered by unit tests
- [ ] Minimal ERC20 deployed on both envs for regression testing
- [ ] Diagnostics badge shows green (RPC, WS, block freshness)

---

### Appendices

**A. Minimal ERC20 ABI (subset)**
```json
[
  {"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function"},
  {"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function"},
  {"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"type":"function"},
  {"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}
]
```

**B. Quick cURL probes**
```bash
# Check chain id
curl -s -X POST $VITE_ALCHEMY_SEPOLIA_HTTP \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'

# Latest block
curl -s -X POST $VITE_ALCHEMY_SEPOLIA_HTTP \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

**C. Common errors**
- `-32000 insufficient funds` → faucet, or wrong account selected
- `4001 user rejected` → handle and reset UI state
- `unsupported chain` → prompt switch; ensure chainId hex matches target

