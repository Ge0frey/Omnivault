import React from 'react';
import { 
  BoltIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import { BN } from '@coral-xyz/anchor';

export enum TransferSpeed {
  FAST = 'fast',
  STANDARD = 'standard',
  SLOW = 'slow',
}

export interface TransferEstimate {
  speed: TransferSpeed;
  protocol: 'CCTP' | 'LayerZero';
  estimatedTime: number; // seconds
  fee: BN;
  isEligible: boolean;
  reason?: string;
}

interface FastTransferIndicatorProps {
  estimate: TransferEstimate;
  isActive?: boolean;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const FastTransferIndicator: React.FC<FastTransferIndicatorProps> = ({
  estimate,
  isActive = false,
  showDetails = true,
  size = 'medium',
  className = '',
}) => {
  const getSpeedColor = () => {
    switch (estimate.speed) {
      case TransferSpeed.FAST:
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case TransferSpeed.STANDARD:
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case TransferSpeed.SLOW:
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    }
  };

  const getSpeedIcon = () => {
    const iconSize = size === 'small' ? 'h-4 w-4' : size === 'large' ? 'h-6 w-6' : 'h-5 w-5';
    
    switch (estimate.speed) {
      case TransferSpeed.FAST:
        return <BoltIcon className={iconSize} />;
      case TransferSpeed.STANDARD:
        return <ClockIcon className={iconSize} />;
      case TransferSpeed.SLOW:
        return <ArrowPathIcon className={iconSize} />;
    }
  };

  const getSpeedLabel = () => {
    switch (estimate.speed) {
      case TransferSpeed.FAST:
        return 'Fast Transfer';
      case TransferSpeed.STANDARD:
        return 'Standard Transfer';
      case TransferSpeed.SLOW:
        return 'Slow Transfer';
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `<${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `~${minutes}min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `~${hours}hr`;
    }
  };

  const formatFee = (fee: BN): string => {
    // Convert to USDC (6 decimals)
    const usdcAmount = fee.toNumber() / 1e6;
    if (usdcAmount < 0.01) {
      return '<$0.01';
    }
    return `$${usdcAmount.toFixed(2)}`;
  };

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base',
  };

  if (!showDetails) {
    // Simple indicator
    return (
      <div className={`inline-flex items-center space-x-1 ${getSpeedColor()} ${className}`}>
        {getSpeedIcon()}
        {size !== 'small' && (
          <span className="font-medium">{formatTime(estimate.estimatedTime)}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={`rounded-lg border ${getSpeedColor()} ${sizeClasses[size]} backdrop-blur-sm relative overflow-hidden`}>
        {/* Animated background for active transfers */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        )}

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getSpeedIcon()}
              <span className="font-semibold">{getSpeedLabel()}</span>
              {estimate.protocol === 'CCTP' && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                  CCTP V2
                </span>
              )}
            </div>
            {estimate.isEligible ? (
              <CheckCircleIcon className="h-4 w-4 text-green-400" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />
            )}
          </div>

          {/* Details */}
          <div className="space-y-1 text-xs opacity-90">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Time:</span>
              <span className="font-medium flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" />
                {formatTime(estimate.estimatedTime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Fee:</span>
              <span className="font-medium">{formatFee(estimate.fee)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Protocol:</span>
              <span className="font-medium">{estimate.protocol}</span>
            </div>
          </div>

          {/* Eligibility warning */}
          {!estimate.isEligible && estimate.reason && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="flex items-start space-x-1">
                <ExclamationTriangleIcon className="h-3 w-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300">{estimate.reason}</p>
              </div>
            </div>
          )}

          {/* Active transfer progress */}
          {isActive && (
            <div className="mt-3">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-blue-400 animate-progress"></div>
              </div>
              <p className="text-xs text-center mt-1 text-gray-400">Processing...</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional info tooltip */}
      {estimate.speed === TransferSpeed.FAST && (
        <div className="mt-2 text-xs text-gray-400 flex items-start space-x-1">
          <BoltIcon className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <p>
            Fast Transfer uses Circle's CCTP V2 with attestations in under 30 seconds. 
            Available for USDC transfers between supported chains.
          </p>
        </div>
      )}
    </div>
  );
};

// Comparison component for showing multiple transfer options
interface TransferComparisonProps {
  estimates: TransferEstimate[];
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}

export const TransferComparison: React.FC<TransferComparisonProps> = ({
  estimates,
  selectedIndex = 0,
  onSelect,
}) => {
  if (estimates.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-300">Transfer Options</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {estimates.map((estimate, index) => (
          <button
            key={index}
            onClick={() => onSelect?.(index)}
            className={`relative transition-all duration-300 ${
              selectedIndex === index 
                ? 'scale-105 ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900' 
                : 'hover:scale-102 opacity-75 hover:opacity-100'
            }`}
          >
            <FastTransferIndicator
              estimate={estimate}
              size="medium"
              showDetails={true}
            />
            {selectedIndex === index && (
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Selected
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Mini indicator for inline use
interface MiniTransferIndicatorProps {
  time: number;
  protocol: 'CCTP' | 'LayerZero';
}

export const MiniTransferIndicator: React.FC<MiniTransferIndicatorProps> = ({
  time,
  protocol,
}) => {
  const speed = time < 60 ? TransferSpeed.FAST : time < 600 ? TransferSpeed.STANDARD : TransferSpeed.SLOW;
  const color = speed === TransferSpeed.FAST ? 'text-green-400' : 
                speed === TransferSpeed.STANDARD ? 'text-blue-400' : 'text-yellow-400';

  return (
    <div className={`inline-flex items-center space-x-1 text-xs ${color}`}>
      <BoltIcon className="h-3 w-3" />
      <span className="font-medium">
        {time < 60 ? `<${time}s` : `~${Math.floor(time / 60)}m`}
      </span>
      <span className="text-gray-500">via {protocol}</span>
    </div>
  );
};
