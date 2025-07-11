/**
 * SWAP BLOCK MODULE EXPORTS - MODULAR ARCHITECTURE
 * 
 * Centralized exports for all swap block components and types.
 * Provides clean imports for the modular swap architecture.
 */

// Main orchestrator component
export { SwapBlock as default } from './SwapBlock';
export { SwapBlock } from './SwapBlock';
export type { SwapBlockProps } from './SwapBlock';

// Core swap components
export { SwapForm } from './SwapForm';
export type { SwapFormProps } from './SwapForm';

export { SwapPreview } from './SwapPreview';
export type { SwapPreviewProps } from './SwapPreview';

// Modal components
export { AdvancedProtectionModal } from './AdvancedProtectionModal';
export type { AdvancedProtectionModalProps, ProtectionSettings } from './AdvancedProtectionModal';

export { SlippageModal } from './SlippageModal';
export type { SlippageModalProps } from './SlippageModal';

export { WalletModal } from './WalletModal';
export type { WalletModalProps, WalletConnection, FiatConnection } from './WalletModal';

// Component-specific exports for advanced usage
export * from './SwapForm';
export * from './SwapPreview';
export * from './AdvancedProtectionModal';
export * from './SlippageModal';
export * from './WalletModal';
