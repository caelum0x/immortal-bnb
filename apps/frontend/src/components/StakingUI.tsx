/**
 * Staking UI Component
 * Interface for staking $IMMBOT tokens
 * Note: Requires deployed contracts and ABIs
 */

'use client';

import { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/wagmi';

export default function StakingUI() {
  const { address, chain } = useAccount();
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState(0);

  // Get IMMBOT token balance
  const { data: tokenBalance } = useBalance({
    address: address,
    token: CONTRACT_ADDRESSES.IMMBOT_TOKEN[chain?.id || 5611] as `0x${string}` | undefined,
  });

  const stakingTiers = [
    {
      id: 0,
      name: 'Flexible',
      duration: 'No lock',
      apy: '5%',
      description: 'Unstake anytime with lower rewards',
    },
    {
      id: 1,
      name: '30 Days',
      duration: '30 days',
      apy: '15%',
      description: 'Lock for 30 days for better rewards',
    },
    {
      id: 2,
      name: '90 Days',
      duration: '90 days',
      apy: '30%',
      description: 'Lock for 90 days for maximum rewards',
    },
    {
      id: 3,
      name: '180 Days',
      duration: '180 days',
      apy: '50%',
      description: 'Maximum lock period, maximum APY',
    },
  ];

  const handleStake = async () => {
    if (!address) {
      alert('Please connect your wallet');
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // TODO: Implement staking with contract once deployed
    alert(
      `Staking ${stakeAmount} IMMBOT tokens in ${stakingTiers[selectedTier].name} tier.\n\n` +
        '⚠️ Contract integration pending deployment.'
    );
  };

  const contractAddress = CONTRACT_ADDRESSES.IMMBOT_TOKEN[chain?.id || 5611];
  const isContractDeployed = contractAddress && contractAddress !== '';

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
            <p className="text-2xl font-bold">0.00</p>
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
              <div className="text-2xl mb-2">{tier.id === 0 ? '🔓' : '🔒'}</div>
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
          disabled={!address || !isContractDeployed || !stakeAmount}
          className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!address
            ? '🔒 Connect Wallet'
            : !isContractDeployed
            ? '⚠️ Contract Not Deployed'
            : '💰 Stake Tokens'}
        </button>
      </div>

      {/* Active Stakes (Empty for now) */}
      <div className="card p-6">
        <h3 className="text-xl font-bold mb-4">Your Active Stakes</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-gray-400">No active stakes yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Start staking to see your positions here
          </p>
        </div>
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
              <li>• Unstake anytime (flexible tier) or after lock period</li>
              <li>• Staked tokens support the bot's liquidity pool</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
