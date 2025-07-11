import React from 'react';
import SwapForm from './SwapForm';
import SwapPreview from './SwapPreview';
import SlippageModal from './SlippageModal';
import WalletModal from './WalletModal';
import AdvancedProtectionModal from './AdvancedProtectionModal';

const SwapBlock = (props) => {
  return (
    <div className="p-4">
      <SwapForm {...props} />
      <SwapPreview {...props} />
      <SlippageModal {...props} />
      <WalletModal {...props} />
      <AdvancedProtectionModal {...props} />
    </div>
  );
};

export default SwapBlock;
