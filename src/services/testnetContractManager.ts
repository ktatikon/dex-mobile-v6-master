/**
 * Testnet Contract Manager Service
 * Smart contract deployment, interaction, and ERC-20 token management
 */

import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import { testnetNetworkManager } from './testnetNetworkManager';
import { testnetWalletManager } from './testnetWalletManager';

export interface TestnetContract {
  id: string;
  userId: string;
  networkId: string;
  name: string;
  address: string;
  abi: unknown[];
  contractType: 'erc20' | 'erc721' | 'erc1155' | 'custom';
  description?: string;
  isVerified: boolean;
  deploymentTxHash?: string;
  deploymentBlockNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ERC20Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  balance?: string;
}

export interface ContractDeployment {
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  deploymentCost: string;
}

export interface ContractInteraction {
  success: boolean;
  transactionHash?: string;
  result?: unknown;
  error?: string;
  gasUsed?: string;
}

class TestnetContractManager {
  // Standard ERC-20 ABI
  private readonly ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  ];

  // Simple ERC-20 contract bytecode for deployment
  private readonly SIMPLE_ERC20_BYTECODE = "0x608060405234801561001057600080fd5b506040516108fc3803806108fc8339818101604052810190610032919061016a565b8181600390805190602001906100499291906100a3565b5080600490805190602001906100609291906100a3565b50505050600560ff16600a61007591906102c4565b8261008091906103b5565b6000819055506000543360008082825461009a919061020e565b92505081905550505061055c565b8280546100af90610445565b90600052602060002090601f0160209004810192826100d1576000855561011e565b82601f106100ea57805160ff191683800117855561011e565b8280016001018555821561011e579182015b8281111561011d5782518255916020019190600101906100fc565b5b50905061012b919061012f565b5090565b5b80821115610148576000816000905550600101610130565b5090565b600081519050610161816105455b92915050565b6000806040838503121561017d57600080fd5b600061018b85828601610152565b925050602061019c85828601610152565b9150509250929050565b60006101b1826103f0565b6101bb81856103fb565b93506101cb81856020860161040c565b6101d48161053e565b840191505092915050565b60006101ea826103f0565b6101f481856103fb565b935061020481856020860161040c565b80840191505092915050565b6000610219826103e5565b610223818561040c565b935061023381856020860161040c565b61023c8161053e565b840191505092915050565b6000610252826103e5565b61025c818561040c565b935061026c81856020860161040c565b80840191505092915050565b6000610283826103e5565b61028d818561040c565b935061029d81856020860161040c565b6102a68161053e565b840191505092915050565b60006102bc826103e5565b6102c6818561040c565b93506102d681856020860161040c565b80840191505092915050565b60006102ed826103e5565b6102f7818561040c565b935061030781856020860161040c565b6103108161053e565b840191505092915050565b6000610326826103e5565b610330818561040c565b935061034081856020860161040c565b80840191505092915050565b6000610357826103e5565b610361818561040c565b935061037181856020860161040c565b61037a8161053e565b840191505092915050565b6000610390826103e5565b61039a818561040c565b93506103aa81856020860161040c565b80840191505092915050565b60006103c1826103e5565b6103cb818561040c565b93506103db81856020860161040c565b6103e48161053e565b840191505092915050565b600081519050919050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561042a57808201518184015260208101905061040f565b83811115610439576000848401525b50505050565b6000600282049050600182168061045d57607f821691505b6020821081141561047157610470610507565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006104e1826103e5565b6104eb818561040c565b93506104fb81856020860161040c565b6105048161053e565b840191505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000601f19601f8301169050919050565b61054e816103e5565b811461055957600080fd5b50565b610391806105696000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c806370a082311161005b57806370a08231146101145780638da5cb5b1461014457806395d89b4114610162578063a9059cbb1461018057610088565b806306fdde031461008d578063095ea7b3146100ab57806318160ddd146100db57806323b872dd146100f957610088565b366100885761009661008d565b005b600080fd5b6100956101b0565b6040516100a29190610242565b60405180910390f35b6100c560048036038101906100c09190610195565b61023e565b6040516100d29190610227565b60405180910390f35b6100e3610330565b6040516100f09190610264565b60405180910390f35b610113600480360381019061010e919061014a565b610336565b005b61012e60048036038101906101299190610121565b6104c5565b60405161013b9190610264565b60405180910390f35b61014c6104dd565b6040516101599190610212565b60405180910390f35b61016a610503565b6040516101779190610242565b60405180910390f35b61019a60048036038101906101959190610195565b610591565b6040516101a79190610227565b60405180910390f35b60606003805461019f906102d4565b80601f01602080910402602001604051908101604052809291908181526020018280546101cb906102d4565b80156102185780601f106101ed57610100808354040283529160200191610218565b820191906000526020600020905b8154815290600101906020018083116101fb57829003601f168201915b5050505050905090565b600061024a8383610591565b905092915050565b6000610256826102a8565b610260818561040c565b935061027081856020860161040c565b6102798161053e565b840191505092915050565b6000610290826102a8565b61029a818561040c565b93506102aa81856020860161040c565b80840191505092915050565b600081519050919050565b600082825260208201905092915050565b60005b838110156102f05780820151818401526020810190506102d5565b838111156102ff576000848401525b50505050565b6000600282049050600182168061031d57607f821691505b6020821081141561033157610330610507565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000601f19601f8301169050919050565b61037a816102a8565b811461038557600080fd5b50565b610391816102b9565b811461039c57600080fd5b5056fea2646970667358221220c4c5d2f4c5e5f5e5f5e5f5e5f5e5f5e5f5e5f5e5f5e5f5e5f5e5f5e5f5e5f564736f6c63430008070033";

  /**
   * Deploy a simple ERC-20 token contract
   */
  async deployERC20Token(
    userId: string,
    walletId: string,
    networkName: string,
    tokenName: string,
    tokenSymbol: string,
    initialSupply: string,
    decimals: number = 18
  ): Promise<ContractDeployment> {
    try {
      // Get wallet and network
      const wallets = await testnetWalletManager.getUserWallets(userId);
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const network = await testnetNetworkManager.getNetworkByName(networkName);
      if (!network) {
        throw new Error('Network not found');
      }

      // Get provider and signer
      const provider = await testnetNetworkManager.getNetworkProvider(networkName);
      const walletExport = await testnetWalletManager.exportWallet(userId, walletId);
      if (!walletExport) {
        throw new Error('Failed to export wallet');
      }

      const signer = new ethers.Wallet(walletExport.privateKey, provider);

      // Create contract factory
      const contractFactory = new ethers.ContractFactory(
        this.ERC20_ABI,
        this.SIMPLE_ERC20_BYTECODE,
        signer
      );

      // Calculate initial supply with decimals
      const supply = ethers.utils.parseUnits(initialSupply, decimals);

      // Deploy contract
      const contract = await contractFactory.deploy(tokenName, tokenSymbol, supply);
      const receipt = await contract.deployTransaction.wait();

      // Save contract to database
      await supabase
        .from('testnet_contracts')
        .insert({
          user_id: userId,
          network_id: network.id,
          name: `${tokenName} (${tokenSymbol})`,
          address: contract.address,
          abi: this.ERC20_ABI,
          contract_type: 'erc20',
          description: `ERC-20 token: ${tokenName}`,
          is_verified: false,
          deployment_tx_hash: receipt.transactionHash,
          deployment_block_number: receipt.blockNumber,
        });

      return {
        contractAddress: contract.address,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        deploymentCost: ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice)),
      };
    } catch (error) {
      console.error('Error deploying ERC-20 token:', error);
      throw error;
    }
  }

  /**
   * Get ERC-20 token information
   */
  async getERC20TokenInfo(networkName: string, tokenAddress: string): Promise<ERC20Token> {
    try {
      const provider = await testnetNetworkManager.getNetworkProvider(networkName);
      const contract = new ethers.Contract(tokenAddress, this.ERC20_ABI, provider);

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply: ethers.utils.formatUnits(totalSupply, decimals),
      };
    } catch (error) {
      console.error('Error getting ERC-20 token info:', error);
      throw error;
    }
  }

  /**
   * Get ERC-20 token balance for an address
   */
  async getERC20Balance(
    networkName: string,
    tokenAddress: string,
    walletAddress: string
  ): Promise<string> {
    try {
      const provider = await testnetNetworkManager.getNetworkProvider(networkName);
      const contract = new ethers.Contract(tokenAddress, this.ERC20_ABI, provider);

      const [balance, decimals] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals(),
      ]);

      return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error getting ERC-20 balance:', error);
      return '0';
    }
  }

  /**
   * Transfer ERC-20 tokens
   */
  async transferERC20(
    userId: string,
    walletId: string,
    networkName: string,
    tokenAddress: string,
    toAddress: string,
    amount: string
  ): Promise<ContractInteraction> {
    try {
      // Get wallet
      const walletExport = await testnetWalletManager.exportWallet(userId, walletId);
      if (!walletExport) {
        throw new Error('Failed to export wallet');
      }

      // Get provider and signer
      const provider = await testnetNetworkManager.getNetworkProvider(networkName);
      const signer = new ethers.Wallet(walletExport.privateKey, provider);

      // Create contract instance
      const contract = new ethers.Contract(tokenAddress, this.ERC20_ABI, signer);

      // Get token decimals
      const decimals = await contract.decimals();
      const transferAmount = ethers.utils.parseUnits(amount, decimals);

      // Execute transfer
      const tx = await contract.transfer(toAddress, transferAmount);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Error transferring ERC-20 tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed',
      };
    }
  }

  /**
   * Approve ERC-20 token spending
   */
  async approveERC20(
    userId: string,
    walletId: string,
    networkName: string,
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ): Promise<ContractInteraction> {
    try {
      // Get wallet
      const walletExport = await testnetWalletManager.exportWallet(userId, walletId);
      if (!walletExport) {
        throw new Error('Failed to export wallet');
      }

      // Get provider and signer
      const provider = await testnetNetworkManager.getNetworkProvider(networkName);
      const signer = new ethers.Wallet(walletExport.privateKey, provider);

      // Create contract instance
      const contract = new ethers.Contract(tokenAddress, this.ERC20_ABI, signer);

      // Get token decimals
      const decimals = await contract.decimals();
      const approveAmount = ethers.utils.parseUnits(amount, decimals);

      // Execute approval
      const tx = await contract.approve(spenderAddress, approveAmount);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Error approving ERC-20 tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Approval failed',
      };
    }
  }

  /**
   * Get user's contracts
   */
  async getUserContracts(userId: string, networkId?: string): Promise<TestnetContract[]> {
    try {
      let query = supabase
        .from('testnet_contracts')
        .select('*')
        .eq('user_id', userId);

      if (networkId) {
        query = query.eq('network_id', networkId);
      }

      const { data: contracts, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch contracts: ${error.message}`);
      }

      return contracts.map(contract => this.mapDatabaseContractToContract(contract));
    } catch (error) {
      console.error('Error fetching user contracts:', error);
      throw error;
    }
  }

  /**
   * Add existing contract to user's registry
   */
  async addContract(
    userId: string,
    networkName: string,
    contractAddress: string,
    name: string,
    abi?: unknown[],
    contractType: 'erc20' | 'erc721' | 'erc1155' | 'custom' = 'custom'
  ): Promise<TestnetContract> {
    try {
      const network = await testnetNetworkManager.getNetworkByName(networkName);
      if (!network) {
        throw new Error('Network not found');
      }

      // Use provided ABI or default ERC-20 ABI
      const contractAbi = abi || (contractType === 'erc20' ? this.ERC20_ABI : []);

      const { data: contract, error } = await supabase
        .from('testnet_contracts')
        .insert({
          user_id: userId,
          network_id: network.id,
          name,
          address: contractAddress,
          abi: contractAbi,
          contract_type: contractType,
          is_verified: false,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to add contract: ${error.message}`);
      }

      return this.mapDatabaseContractToContract(contract);
    } catch (error) {
      console.error('Error adding contract:', error);
      throw error;
    }
  }

  /**
   * Remove contract from user's registry
   */
  async removeContract(userId: string, contractId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('testnet_contracts')
        .delete()
        .eq('id', contractId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to remove contract: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error removing contract:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private mapDatabaseContractToContract(dbContract: Record<string, unknown>): TestnetContract {
    return {
      id: dbContract.id,
      userId: dbContract.user_id,
      networkId: dbContract.network_id,
      name: dbContract.name,
      address: dbContract.address,
      abi: dbContract.abi || [],
      contractType: dbContract.contract_type || 'custom',
      description: dbContract.description,
      isVerified: dbContract.is_verified || false,
      deploymentTxHash: dbContract.deployment_tx_hash,
      deploymentBlockNumber: dbContract.deployment_block_number,
      createdAt: new Date(dbContract.created_at),
      updatedAt: new Date(dbContract.updated_at),
    };
  }
}

export const testnetContractManager = new TestnetContractManager();