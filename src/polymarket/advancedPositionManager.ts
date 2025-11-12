/**
 * Advanced Polymarket Position Manager
 * Integrates functionality from polymarket-examples submodule
 * Provides position management: split, merge, redeem, convert
 */

import { ethers, BigNumber } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';

// Import ABIs and encoding functions from submodule
import {
    erc20Abi,
    erc1155Abi,
    ctfAbi,
    negRiskAdapterAbi,
    proxyFactoryAbi
} from '../../polymarket-examples/src/abis';
import { getIndexSet } from '../../polymarket-examples/src/utils';

// Polygon mainnet contract addresses
export const PROXY_WALLET_FACTORY_ADDRESS = "0xaB45c5A4B0c941a2F231C04C3f49182e1A254052";
export const SAFE_FACTORY_ADDRESS = "0xaacFeEa03eb1561C4e67d661e40682Bd20E3541b";
export const SAFE_MULTISEND_ADDRESS = "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761";
export const USDC_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
export const CONDITIONAL_TOKENS_FRAMEWORK_ADDRESS = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045";
export const NEG_RISK_ADAPTER_ADDRESS = "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296";
export const USDCE_DIGITS = 6;

// Initialize interfaces
const ERC20_INTERFACE = new Interface(erc20Abi);
const ERC1155_INTERFACE = new Interface(erc1155Abi);
const CTF_INTERFACE = new Interface(ctfAbi);
const NEG_RISK_INTERFACE = new Interface(negRiskAdapterAbi);

export interface SplitPositionParams {
    conditionId: string;
    amount: string; // Amount in USDC
    negRisk?: boolean;
}

export interface MergePositionParams {
    conditionId: string;
    amount: string; // Amount of tokens to merge
    negRisk?: boolean;
}

export interface RedeemPositionParams {
    conditionId: string;
    negRisk?: boolean;
    amounts?: string[]; // For neg-risk redemption
}

export interface ConvertPositionParams {
    marketId: string;
    questionIds: string[];
    amount: string;
}

export interface ApproveParams {
    token: 'USDC' | 'CTF' | 'OUTCOME';
    spender: string;
    amount?: string; // For ERC20
    approved?: boolean; // For ERC1155
}

export interface TransferParams {
    tokenType: 'USDC' | 'OUTCOME';
    to: string;
    amount: string;
    tokenId?: string; // For outcome tokens
}

export class AdvancedPositionManager {
    private provider: ethers.providers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private proxyFactory: ethers.Contract | null = null;
    private useProxyWallet: boolean;

    constructor(privateKey?: string, rpcUrl?: string) {
        const polygonRPC = rpcUrl || process.env.POLYGON_RPC || 'https://polygon-rpc.com';
        this.provider = new ethers.providers.JsonRpcProvider(polygonRPC);

        const pk = privateKey || process.env.WALLET_PRIVATE_KEY || '';
        if (!pk) {
            throw new Error('Private key required for AdvancedPositionManager');
        }

        this.wallet = new ethers.Wallet(pk, this.provider);
        this.useProxyWallet = CONFIG.POLYMARKET_WALLET_TYPE === 'proxy';

        if (this.useProxyWallet) {
            this.proxyFactory = new ethers.Contract(
                PROXY_WALLET_FACTORY_ADDRESS,
                proxyFactoryAbi,
                this.wallet
            );
        }

        logger.info('✅ Advanced Position Manager initialized');
        logger.info(`   - Wallet: ${this.wallet.address}`);
        logger.info(`   - Proxy Wallet: ${this.useProxyWallet}`);
    }

    /**
     * Encode functions (from polymarket-examples)
     */
    private encodeErc20Transfer(to: string, value: BigNumber): string {
        return ERC20_INTERFACE.encodeFunctionData(
            "transfer(address,uint256)",
            [to, value]
        );
    }

    private encodeErc1155TransferFrom(from: string, to: string, id: string, value: BigNumber): string {
        return ERC1155_INTERFACE.encodeFunctionData(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            [from, to, id, value, ethers.constants.HashZero]
        );
    }

    private encodeErc20Approve(spender: string, approvalAmount: BigNumber): string {
        return ERC20_INTERFACE.encodeFunctionData(
            "approve(address,uint256)",
            [spender, approvalAmount]
        );
    }

    private encodeErc1155Approve(spender: string, approval: boolean): string {
        return ERC1155_INTERFACE.encodeFunctionData(
            "setApprovalForAll(address,bool)",
            [spender, approval]
        );
    }

    private encodeSplit(collateralToken: string, conditionId: string, amount: BigNumber): string {
        return CTF_INTERFACE.encodeFunctionData(
            "splitPosition(address,bytes32,bytes32,uint256[],uint256)",
            [collateralToken, ethers.constants.HashZero, conditionId, [1, 2], amount]
        );
    }

    private encodeMerge(collateralToken: string, conditionId: string, amount: BigNumber): string {
        return CTF_INTERFACE.encodeFunctionData(
            "mergePositions(address,bytes32,bytes32,uint256[],uint256)",
            [collateralToken, ethers.constants.HashZero, conditionId, [1, 2], amount]
        );
    }

    private encodeRedeem(collateralToken: string, conditionId: string): string {
        return CTF_INTERFACE.encodeFunctionData(
            "redeemPositions(address,bytes32,bytes32,uint256[])",
            [collateralToken, ethers.constants.HashZero, conditionId, [1, 2]]
        );
    }

    private encodeRedeemNegRisk(conditionId: string, amounts: string[]): string {
        return NEG_RISK_INTERFACE.encodeFunctionData(
            "redeemPositions(bytes32,uint256[])",
            [conditionId, amounts]
        );
    }

    private encodeConvert(marketId: string, indexSet: number, amount: string): string {
        return NEG_RISK_INTERFACE.encodeFunctionData(
            "convertPositions(bytes32,uint256,uint256)",
            [marketId, indexSet, amount]
        );
    }

    /**
     * Split USDC into conditional tokens
     * Converts collateral into YES/NO outcome tokens
     */
    async splitPosition(params: SplitPositionParams): Promise<ethers.providers.TransactionReceipt> {
        logger.info(`📊 Splitting position: ${params.amount} USDC for condition ${params.conditionId}`);

        const amount = ethers.utils.parseUnits(params.amount, USDCE_DIGITS);
        const data = this.encodeSplit(USDC_ADDRESS, params.conditionId, amount);
        const to = params.negRisk ? NEG_RISK_ADAPTER_ADDRESS : CONDITIONAL_TOKENS_FRAMEWORK_ADDRESS;

        if (this.useProxyWallet && this.proxyFactory) {
            const proxyTxn = {
                to: to,
                typeCode: "1",
                data: data,
                value: "0",
            };

            const txn = await this.proxyFactory.proxy([proxyTxn], {
                gasPrice: ethers.utils.parseUnits('100', 'gwei'),
            });

            logger.info(`   - Transaction hash: ${txn.hash}`);
            const receipt = await txn.wait();
            logger.info(`   ✅ Position split successful`);
            return receipt;
        } else {
            // Direct transaction for non-proxy wallets
            const contract = new ethers.Contract(to, ctfAbi, this.wallet);
            const txn = await contract.splitPosition(
                USDC_ADDRESS,
                ethers.constants.HashZero,
                params.conditionId,
                [1, 2],
                amount,
                {
                    gasPrice: ethers.utils.parseUnits('100', 'gwei'),
                }
            );

            logger.info(`   - Transaction hash: ${txn.hash}`);
            const receipt = await txn.wait();
            logger.info(`   ✅ Position split successful`);
            return receipt;
        }
    }

    /**
     * Merge conditional tokens back into USDC
     * Combines YES/NO tokens to recover collateral
     */
    async mergePosition(params: MergePositionParams): Promise<ethers.providers.TransactionReceipt> {
        logger.info(`📊 Merging position: ${params.amount} tokens for condition ${params.conditionId}`);

        const amount = ethers.utils.parseUnits(params.amount, USDCE_DIGITS);
        const data = this.encodeMerge(USDC_ADDRESS, params.conditionId, amount);
        const to = params.negRisk ? NEG_RISK_ADAPTER_ADDRESS : CONDITIONAL_TOKENS_FRAMEWORK_ADDRESS;

        if (this.useProxyWallet && this.proxyFactory) {
            const proxyTxn = {
                to: to,
                typeCode: "1",
                data: data,
                value: "0",
            };

            const txn = await this.proxyFactory.proxy([proxyTxn], {
                gasPrice: ethers.utils.parseUnits('100', 'gwei'),
            });

            logger.info(`   - Transaction hash: ${txn.hash}`);
            const receipt = await txn.wait();
            logger.info(`   ✅ Position merged successful`);
            return receipt;
        } else {
            const contract = new ethers.Contract(to, ctfAbi, this.wallet);
            const txn = await contract.mergePositions(
                USDC_ADDRESS,
                ethers.constants.HashZero,
                params.conditionId,
                [1, 2],
                amount,
                {
                    gasPrice: ethers.utils.parseUnits('100', 'gwei'),
                }
            );

            logger.info(`   - Transaction hash: ${txn.hash}`);
            const receipt = await txn.wait();
            logger.info(`   ✅ Position merged successful`);
            return receipt;
        }
    }

    /**
     * Redeem winning positions after market resolution
     */
    async redeemPosition(params: RedeemPositionParams): Promise<ethers.providers.TransactionReceipt> {
        logger.info(`💰 Redeeming position for condition ${params.conditionId}`);

        if (params.negRisk && params.amounts) {
            const data = this.encodeRedeemNegRisk(params.conditionId, params.amounts);
            const to = NEG_RISK_ADAPTER_ADDRESS;

            if (this.useProxyWallet && this.proxyFactory) {
                const proxyTxn = {
                    to: to,
                    typeCode: "1",
                    data: data,
                    value: "0",
                };

                const txn = await this.proxyFactory.proxy([proxyTxn], {
                    gasPrice: ethers.utils.parseUnits('100', 'gwei'),
                });

                logger.info(`   - Transaction hash: ${txn.hash}`);
                const receipt = await txn.wait();
                logger.info(`   ✅ Position redeemed successfully`);
                return receipt;
            } else {
                const contract = new ethers.Contract(to, negRiskAdapterAbi, this.wallet);
                const txn = await contract.redeemPositions(params.conditionId, params.amounts, {
                    gasPrice: ethers.utils.parseUnits('100', 'gwei'),
                });

                logger.info(`   - Transaction hash: ${txn.hash}`);
                const receipt = await txn.wait();
                logger.info(`   ✅ Position redeemed successfully`);
                return receipt;
            }
        } else {
            const data = this.encodeRedeem(USDC_ADDRESS, params.conditionId);
            const to = CONDITIONAL_TOKENS_FRAMEWORK_ADDRESS;

            if (this.useProxyWallet && this.proxyFactory) {
                const proxyTxn = {
                    to: to,
                    typeCode: "1",
                    data: data,
                    value: "0",
                };

                const txn = await this.proxyFactory.proxy([proxyTxn], {
                    gasPrice: ethers.utils.parseUnits('100', 'gwei'),
                });

                logger.info(`   - Transaction hash: ${txn.hash}`);
                const receipt = await txn.wait();
                logger.info(`   ✅ Position redeemed successfully`);
                return receipt;
            } else {
                const contract = new ethers.Contract(to, ctfAbi, this.wallet);
                const txn = await contract.redeemPositions(
                    USDC_ADDRESS,
                    ethers.constants.HashZero,
                    params.conditionId,
                    [1, 2],
                    {
                        gasPrice: ethers.utils.parseUnits('100', 'gwei'),
                    }
                );

                logger.info(`   - Transaction hash: ${txn.hash}`);
                const receipt = await txn.wait();
                logger.info(`   ✅ Position redeemed successfully`);
                return receipt;
            }
        }
    }

    /**
     * Convert positions between outcomes (for neg-risk markets)
     */
    async convertPosition(params: ConvertPositionParams): Promise<ethers.providers.TransactionReceipt> {
        logger.info(`🔄 Converting position for market ${params.marketId}`);

        const indexSet = getIndexSet(params.questionIds);
        const data = this.encodeConvert(params.marketId, indexSet, params.amount);
        const to = NEG_RISK_ADAPTER_ADDRESS;

        if (this.useProxyWallet && this.proxyFactory) {
            const proxyTxn = {
                to: to,
                typeCode: "1",
                data: data,
                value: "0",
            };

            const txn = await this.proxyFactory.proxy([proxyTxn], {
                gasPrice: ethers.utils.parseUnits('100', 'gwei'),
            });

            logger.info(`   - Transaction hash: ${txn.hash}`);
            const receipt = await txn.wait();
            logger.info(`   ✅ Position converted successfully`);
            return receipt;
        } else {
            const contract = new ethers.Contract(to, negRiskAdapterAbi, this.wallet);
            const txn = await contract.convertPositions(params.marketId, indexSet, params.amount, {
                gasPrice: ethers.utils.parseUnits('100', 'gwei'),
            });

            logger.info(`   - Transaction hash: ${txn.hash}`);
            const receipt = await txn.wait();
            logger.info(`   ✅ Position converted successfully`);
            return receipt;
        }
    }

    /**
     * Approve tokens for trading
     */
    async approveTokens(params: ApproveParams): Promise<ethers.providers.TransactionReceipt> {
        logger.info(`✅ Approving ${params.token} for ${params.spender}`);

        let data: string;
        let to: string;

        if (params.token === 'USDC') {
            const amount = params.amount
                ? ethers.utils.parseUnits(params.amount, USDCE_DIGITS)
                : ethers.constants.MaxUint256;
            data = this.encodeErc20Approve(params.spender, amount);
            to = USDC_ADDRESS;
        } else {
            const approved = params.approved !== undefined ? params.approved : true;
            data = this.encodeErc1155Approve(params.spender, approved);
            to = CONDITIONAL_TOKENS_FRAMEWORK_ADDRESS;
        }

        if (this.useProxyWallet && this.proxyFactory) {
            const proxyTxn = {
                to: to,
                typeCode: "1",
                data: data,
                value: "0",
            };

            const txn = await this.proxyFactory.proxy([proxyTxn], {
                gasPrice: ethers.utils.parseUnits('100', 'gwei'),
            });

            logger.info(`   - Transaction hash: ${txn.hash}`);
            const receipt = await txn.wait();
            logger.info(`   ✅ Approval successful`);
            return receipt;
        } else {
            const contract = new ethers.Contract(
                to,
                params.token === 'USDC' ? erc20Abi : erc1155Abi,
                this.wallet
            );

            let txn;
            if (params.token === 'USDC') {
                const amount = params.amount
                    ? ethers.utils.parseUnits(params.amount, USDCE_DIGITS)
                    : ethers.constants.MaxUint256;
                txn = await contract.approve(params.spender, amount, {
                    gasPrice: ethers.utils.parseUnits('100', 'gwei'),
                });
            } else {
                const approved = params.approved !== undefined ? params.approved : true;
                txn = await contract.setApprovalForAll(params.spender, approved, {
                    gasPrice: ethers.utils.parseUnits('100', 'gwei'),
                });
            }

            logger.info(`   - Transaction hash: ${txn.hash}`);
            const receipt = await txn.wait();
            logger.info(`   ✅ Approval successful`);
            return receipt;
        }
    }

    /**
     * Transfer tokens
     */
    async transferTokens(params: TransferParams): Promise<ethers.providers.TransactionReceipt> {
        logger.info(`💸 Transferring ${params.amount} ${params.tokenType} to ${params.to}`);

        let data: string;
        let to: string;

        if (params.tokenType === 'USDC') {
            const amount = ethers.utils.parseUnits(params.amount, USDCE_DIGITS);
            data = this.encodeErc20Transfer(params.to, amount);
            to = USDC_ADDRESS;
        } else {
            if (!params.tokenId) {
                throw new Error('Token ID required for outcome token transfer');
            }
            const amount = ethers.utils.parseUnits(params.amount, USDCE_DIGITS);
            data = this.encodeErc1155TransferFrom(this.wallet.address, params.to, params.tokenId, amount);
            to = CONDITIONAL_TOKENS_FRAMEWORK_ADDRESS;
        }

        if (this.useProxyWallet && this.proxyFactory) {
            const proxyTxn = {
                to: to,
                typeCode: "1",
                data: data,
                value: "0",
            };

            const txn = await this.proxyFactory.proxy([proxyTxn], {
                gasPrice: ethers.utils.parseUnits('100', 'gwei'),
            });

            logger.info(`   - Transaction hash: ${txn.hash}`);
            const receipt = await txn.wait();
            logger.info(`   ✅ Transfer successful`);
            return receipt;
        } else {
            const contract = new ethers.Contract(
                to,
                params.tokenType === 'USDC' ? erc20Abi : erc1155Abi,
                this.wallet
            );

            let txn;
            if (params.tokenType === 'USDC') {
                const amount = ethers.utils.parseUnits(params.amount, USDCE_DIGITS);
                txn = await contract.transfer(params.to, amount, {
                    gasPrice: ethers.utils.parseUnits('100', 'gwei'),
                });
            } else {
                const amount = ethers.utils.parseUnits(params.amount, USDCE_DIGITS);
                txn = await contract.safeTransferFrom(
                    this.wallet.address,
                    params.to,
                    params.tokenId!,
                    amount,
                    ethers.constants.HashZero,
                    {
                        gasPrice: ethers.utils.parseUnits('100', 'gwei'),
                    }
                );
            }

            logger.info(`   - Transaction hash: ${txn.hash}`);
            const receipt = await txn.wait();
            logger.info(`   ✅ Transfer successful`);
            return receipt;
        }
    }

    /**
     * Get wallet address
     */
    getWalletAddress(): string {
        return this.wallet.address;
    }

    /**
     * Get USDC balance
     */
    async getUSDCBalance(): Promise<string> {
        const contract = new ethers.Contract(USDC_ADDRESS, erc20Abi, this.wallet);
        const balance = await contract.balanceOf(this.wallet.address);
        return ethers.utils.formatUnits(balance, USDCE_DIGITS);
    }

    /**
     * Get outcome token balance
     */
    async getOutcomeTokenBalance(tokenId: string): Promise<string> {
        const contract = new ethers.Contract(CONDITIONAL_TOKENS_FRAMEWORK_ADDRESS, erc1155Abi, this.wallet);
        const balance = await contract.balanceOf(this.wallet.address, tokenId);
        return ethers.utils.formatUnits(balance, USDCE_DIGITS);
    }
}

// Singleton instance
let positionManagerInstance: AdvancedPositionManager | null = null;

export function getAdvancedPositionManager(): AdvancedPositionManager {
    if (!positionManagerInstance) {
        positionManagerInstance = new AdvancedPositionManager();
    }
    return positionManagerInstance;
}

export function resetAdvancedPositionManager(): void {
    positionManagerInstance = null;
}
