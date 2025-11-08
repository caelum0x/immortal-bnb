/**
 * Staking UI Component
 * Interface for staking $IMMBOT tokens with real contract integration
 */

'use client';

import { useState } from 'react';
import { useAccount, useBalance, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/wagmi';
import { IMMBOT_TOKEN_ABI, STAKING_ABI } from '@/contracts';

export default function StakingUI() {
  const { address, chain } = useAccount();
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState(0);
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);

  // Contract addresses
  const tokenAddress = CONTRACT_ADDRESSES.IMMBOT_TOKEN[chain?.id || 5611] as `0x${string}` | undefined;
  const stakingAddress = CONTRACT_ADDRESSES.STAKING[chain?.id || 5611] as `0x${string}` | undefined;

  // Get IMMBOT token balance
  const { data: tokenBalance } = useBalance({
    address: address,
    token: tokenAddress,
  });

  // Get total staked amount
  const { data: totalStakedData } = useContractRead({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
    watch: true,
  });

  // Get user's stakes
  const { data: userStakesData, refetch: refetchStakes } = useContractRead({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'getUserStakes',
    args: address ? [address] : undefined,
    watch: true,
  });

  // Get user's pending rewards
  const { data: pendingRewardsData } = useContractRead({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
    watch: true,
  });

  // Approve token spending
  const { write: approveTokens, data: approveData } = useContractWrite({
    address: tokenAddress,
    abi: IMMBOT_TOKEN_ABI,
    functionName: 'approve',
  });

  const { isLoading: isApproveTxPending } = useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess: () => {
      setIsApproving(false);
      // After approval, execute stake
      executeStake();
    },
  });

  // Stake tokens
  const { write: stakeTokens, data: stakeData } = useContractWrite({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'stake',
  });

  const { isLoading: isStakeTxPending } = useWaitForTransaction({
    hash: stakeData?.hash,
    onSuccess: () => {
      setIsStaking(false);
      setStakeAmount('');
      refetchStakes();
    },
  });

  // Unstake tokens
  const { write: unstakeTokens } = useContractWrite({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'unstake',
  });

  const stakingTiers = [
    {
      id: 0,
      name: '30 Days',
      duration: '30 days',
      apy: '5%',
      description: 'Lock for 30 days',
    },
    {
      id: 1,
      name: '90 Days',
      duration: '90 days',
      apy: '15%',
      description: 'Lock for 90 days for better rewards',
    },
    {
      id: 2,
      name: '180 Days',
      duration: '180 days',
      apy: '30%',
      description: 'Lock for 180 days for higher rewards',
    },
    {
      id: 3,
      name: '365 Days',
      duration: '365 days',
      apy: '50%',
      description: 'Maximum lock period, maximum APY',
    },
  ];

  // Execute stake after approval
  const executeStake = async () => {
    if (!stakeAmount || !stakingAddress) return;

    try {
      const amount = parseEther(stakeAmount);
      stakeTokens?.({
        args: [amount, BigInt(selectedTier)],
      });
    } catch (error) {
      console.error('Stake error:', error);
      setIsStaking(false);
    }
  };

  const handleStake = async () => {
    if (!address) {
      alert('Please connect your wallet');
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!stakingAddress || !tokenAddress) {
      alert('Contracts not deployed. Please deploy contracts first.');
      return;
    }

    if (parseFloat(stakeAmount) < 1000) {
      alert('Minimum stake amount is 1000 IMMBOT tokens');
      return;
    }

    try {
      setIsApproving(true);
      const amount = parseEther(stakeAmount);

      // First approve the staking contract to spend tokens
      approveTokens?.({
        args: [stakingAddress, amount],
      });
    } catch (error) {
      console.error('Approval error:', error);
      setIsApproving(false);
    }
  };

  const handleUnstake = async (stakeIndex: number) => {
    if (!address || !stakingAddress) return;

    try {
      unstakeTokens?.({
        args: [BigInt(stakeIndex)],
      });
    } catch (error) {
      console.error('Unstake error:', error);
    }
  };

  const isContractDeployed = tokenAddress && tokenAddress !== '' && stakingAddress && stakingAddress !== '';

  // Calculate total staked by user
  const userTotalStaked = userStakesData
    ? (userStakesData as any[]).reduce((sum, stake) => sum + Number(stake.amount), 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Contract Status Warning */}
      {!isContractDeployed && (
        <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-500">Contracts Not Deployed</p>
              <p className="text-sm text-gray-300">
                Deploy the $IMMBOT token and staking contracts to enable staking functionality.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-2">💰 Stake $IMMBOT</h2>
        <p className="text-gray-400">
          Stake your tokens to earn passive rewards and support the bot
        </p>
      </div>

      {/* Balance Display */}
      <div className="card p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400">Your IMMBOT Balance</p>
            <p className="text-3xl font-bold text-yellow-500">
              {tokenBalance?.formatted
                ? parseFloat(tokenBalance.formatted).toFixed(2)
                : '0.00'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Currently Staked</p>
            <p className="text-2xl font-bold">
              {userTotalStaked > 0 ? formatEther(BigInt(userTotalStaked)) : '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Staking Tiers */}
      <div className="card p-6">
        <h3 className="text-xl font-bold mb-4">Choose Staking Tier</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stakingTiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTier === tier.id
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="font-bold mb-1">{tier.name}</h4>
              <p className="text-sm text-gray-400 mb-2">{tier.duration}</p>
              <p className="text-xl font-bold text-green-500">{tier.apy} APY</p>
              <p className="text-xs text-gray-400 mt-2">{tier.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Staking Form */}
      <div className="card p-6">
        <h3 className="text-xl font-bold mb-4">Stake Amount</h3>

        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="0.00"
              className="input flex-1 text-lg"
              min="0"
              step="0.01"
            />
            <span className="text-gray-400 font-semibold">IMMBOT</span>
          </div>

          <div className="flex space-x-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => {
                  if (tokenBalance?.formatted) {
                    const amount = (parseFloat(tokenBalance.formatted) * percent) / 100;
                    setStakeAmount(amount.toFixed(2));
                  }
                }}
                className="btn-secondary flex-1 text-sm py-1"
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Rewards */}
        {stakeAmount && parseFloat(stakeAmount) > 0 && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold mb-3">Estimated Rewards</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Daily</p>
                <p className="font-semibold text-green-500">
                  +
                  {(
                    (parseFloat(stakeAmount) *
                      parseFloat(stakingTiers[selectedTier].apy)) /
                    36500
                  ).toFixed(4)}{' '}
                  IMMBOT
                </p>
              </div>
              <div>
                <p className="text-gray-400">Yearly</p>
                <p className="font-semibold text-green-500">
                  +
                  {(
                    (parseFloat(stakeAmount) *
                      parseFloat(stakingTiers[selectedTier].apy)) /
                    100
                  ).toFixed(2)}{' '}
                  IMMBOT
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stake Button */}
        <button
          onClick={handleStake}
          disabled={!address || !isContractDeployed || !stakeAmount || isApproving || isStaking || isApproveTxPending || isStakeTxPending}
          className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!address
            ? '🔒 Connect Wallet'
            : !isContractDeployed
            ? '⚠️ Contract Not Deployed'
            : isApproving || isApproveTxPending
            ? '⏳ Approving...'
            : isStaking || isStakeTxPending
            ? '⏳ Staking...'
            : '💰 Stake Tokens'}
        </button>
      </div>

      {/* Active Stakes */}
      <div className="card p-6">
        <h3 className="text-xl font-bold mb-4">Your Active Stakes</h3>
        {!userStakesData || (userStakesData as any[]).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-gray-400">No active stakes yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Start staking to see your positions here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(userStakesData as any[]).map((stake, index) => {
              if (Number(stake.amount) === 0) return null;

              const tier = stakingTiers[Number(stake.tier)];
              const stakedAmount = formatEther(stake.amount);
              const stakedDate = new Date(Number(stake.stakedAt) * 1000);

              return (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-lg">{tier.name}</p>
                      <p className="text-sm text-gray-400">
                        Staked: {stakedDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-500">{stakedAmount} IMMBOT</p>
                      <p className="text-sm text-green-500">{tier.apy} APY</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnstake(index)}
                    className="btn-secondary w-full text-sm"
                  >
                    Unstake & Claim Rewards
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="card p-6 bg-blue-900/20 border-blue-500">
        <div className="flex items-start">
          <span className="text-3xl mr-4">💡</span>
          <div>
            <h3 className="font-bold mb-2">How Staking Works</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Stake $IMMBOT tokens to earn passive rewards</li>
              <li>• Longer lock periods = higher APY rewards</li>
              <li>• Rewards are calculated and distributed automatically</li>
              <li>• Early withdrawal penalty: 50% of rewards</li>
              <li>• Minimum stake: 1000 IMMBOT tokens</li>
              <li>• Staked tokens support the bot's liquidity pool</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
