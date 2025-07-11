/**
 * Network Icon Component for DEX v6
 * 
 * Displays icons for different blockchain networks
 * Ported from V5 with enterprise styling and optimization
 */

import React from 'react';

interface NetworkIconProps {
  network: string;
  size?: number;
  className?: string;
}

export const NetworkIcon: React.FC<NetworkIconProps> = React.memo(({ network, size = 20, className = "" }) => {
  const iconProps = {
    width: size,
    height: size,
    className: `text-dex-primary ${className}`
  };

  switch (network) {
    case 'ethereum':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1.5L5.25 12.75L12 16.5L18.75 12.75L12 1.5ZM12 18L5.25 14.25L12 22.5L18.75 14.25L12 18Z"/>
        </svg>
      );
    case 'polygon':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17L12 12L2 17Z"/>
        </svg>
      );
    case 'bsc':
    case 'binance':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z"/>
        </svg>
      );
    case 'arbitrum':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L22 12L12 22L2 12L12 2ZM12 6L6 12L12 18L18 12L12 6Z"/>
        </svg>
      );
    case 'optimism':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12L12 8L16 12L12 16L8 12Z" fill="white"/>
        </svg>
      );
    case 'avalanche':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L22 20H2L12 2ZM12 8L6 18H18L12 8Z"/>
        </svg>
      );
    case 'fantom':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4L20 8V16L12 20L4 16V8L12 4Z"/>
        </svg>
      );
    default:
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      );
  }
});

NetworkIcon.displayName = 'NetworkIcon';

// Network configuration for DEX v6
export const SUPPORTED_NETWORKS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', chainId: 1 },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', chainId: 137 },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', chainId: 56 },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', chainId: 42161 },
  { id: 'optimism', name: 'Optimism', symbol: 'OP', chainId: 10 },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', chainId: 43114 },
  { id: 'fantom', name: 'Fantom', symbol: 'FTM', chainId: 250 }
];

export default NetworkIcon;
