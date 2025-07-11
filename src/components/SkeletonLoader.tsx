import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width = "100%",
  height = "1rem",
  rounded = false,
  animate = true
}) => {
  const baseClasses = "bg-gray-300 dark:bg-gray-700";
  const animationClasses = animate ? "animate-pulse" : "";
  const roundedClasses = rounded ? "rounded-full" : "rounded";
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${animationClasses} ${roundedClasses} ${className}`}
      style={style}
    />
  );
};

interface SwapBlockSkeletonProps {
  className?: string;
}

export const SwapBlockSkeleton: React.FC<SwapBlockSkeletonProps> = ({
  className = ""
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation Skeleton */}
      <div className="flex space-x-1 bg-[#2a2a2a] p-1 rounded-xl">
        <Skeleton width="33%" height="40px" className="rounded-lg" />
        <Skeleton width="33%" height="40px" className="rounded-lg" />
        <Skeleton width="33%" height="40px" className="rounded-lg" />
      </div>

      {/* Two Panel Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* From Panel Skeleton */}
        <div className="bg-[#2a2a2a] rounded-2xl p-4 md:p-6 border border-gray-700 space-y-4">
          {/* Address Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Skeleton width="60px" height="20px" />
            <Skeleton width="140px" height="40px" className="rounded-lg" />
          </div>

          {/* Token and Network Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Skeleton width="40px" height="16px" />
              <Skeleton width="100%" height="48px" className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton width="50px" height="16px" />
              <Skeleton width="100%" height="48px" className="rounded-lg" />
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Skeleton width="70px" height="20px" />
              <div className="flex items-center space-x-2">
                <Skeleton width="80px" height="16px" />
                <Skeleton width="40px" height="32px" className="rounded-md" />
              </div>
            </div>
            <Skeleton width="100%" height="60px" />
            <Skeleton width="80px" height="16px" />
          </div>
        </div>

        {/* To Panel Skeleton */}
        <div className="bg-[#2a2a2a] rounded-2xl p-4 md:p-6 border border-gray-700 space-y-4">
          {/* Recipient Address */}
          <div className="space-y-3">
            <Skeleton width="30px" height="20px" />
            <Skeleton width="100%" height="48px" className="rounded-lg" />
          </div>

          {/* Token and Network Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Skeleton width="40px" height="16px" />
              <Skeleton width="100%" height="48px" className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton width="50px" height="16px" />
              <Skeleton width="100%" height="48px" className="rounded-lg" />
            </div>
          </div>

          {/* Amount Display */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Skeleton width="80px" height="20px" />
              <Skeleton width="90px" height="16px" />
            </div>
            <Skeleton width="100%" height="60px" />
            <Skeleton width="90px" height="16px" />
          </div>
        </div>
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center">
        <Skeleton width="48px" height="48px" rounded />
      </div>

      {/* Exchange Rate and Action Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton width="200px" height="16px" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Skeleton width="100px" height="14px" />
            <Skeleton width="120px" height="14px" />
          </div>
        </div>
        <Skeleton width="200px" height="56px" className="rounded-xl lg:w-auto" />
      </div>
    </div>
  );
};

interface TokenSelectorSkeletonProps {
  className?: string;
}

export const TokenSelectorSkeleton: React.FC<TokenSelectorSkeletonProps> = ({
  className = ""
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <Skeleton width="40px" height="16px" />
      <div className="bg-[#1a1a1a] border border-gray-600 rounded-lg p-3 space-y-2">
        <div className="flex items-center space-x-2">
          <Skeleton width="24px" height="24px" rounded />
          <Skeleton width="60px" height="20px" />
        </div>
      </div>
    </div>
  );
};

interface AddressBookSkeletonProps {
  className?: string;
  itemCount?: number;
}

export const AddressBookSkeleton: React.FC<AddressBookSkeletonProps> = ({
  className = "",
  itemCount = 3
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <Skeleton width="12px" height="12px" />
        <Skeleton width="80px" height="14px" />
      </div>
      {Array.from({ length: itemCount }).map((_, index) => (
        <div key={index} className="p-2 space-y-1">
          <Skeleton width="120px" height="16px" />
          <Skeleton width="180px" height="12px" />
        </div>
      ))}
    </div>
  );
};

interface PriceSkeletonProps {
  className?: string;
  showChange?: boolean;
}

export const PriceSkeleton: React.FC<PriceSkeletonProps> = ({
  className = "",
  showChange = true
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <Skeleton width="100px" height="24px" />
      {showChange && (
        <div className="flex items-center space-x-2">
          <Skeleton width="60px" height="16px" />
          <Skeleton width="80px" height="14px" />
        </div>
      )}
    </div>
  );
};

interface BalanceSkeletonProps {
  className?: string;
  showUSD?: boolean;
}

export const BalanceSkeleton: React.FC<BalanceSkeletonProps> = ({
  className = "",
  showUSD = true
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center space-x-2">
        <Skeleton width="80px" height="20px" />
        <Skeleton width="40px" height="16px" />
      </div>
      {showUSD && <Skeleton width="60px" height="14px" />}
    </div>
  );
};

export default Skeleton;
