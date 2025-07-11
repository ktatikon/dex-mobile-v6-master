import React from 'react';

const SwapPreview = ({ swapPreview, isGettingQuote, gasOptimizationResult }) => {
  if (!(swapPreview || isGettingQuote)) return null;
  return (
    <div className="preview-block">
      {/* Render MEV analysis, TDS estimate, gas savings */}
    </div>
  );
};

export default SwapPreview;
