import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sliders } from 'lucide-react';

const SlippageModal = ({ showSlippageSettings, setShowSlippageSettings }) => (
  <Dialog open={showSlippageSettings} onOpenChange={setShowSlippageSettings}>
    <DialogContent className="bg-[#1a1a1a] text-white border-gray-600">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#B1420A]" />
          Slippage Tolerance
        </DialogTitle>
      </DialogHeader>
    </DialogContent>
  </Dialog>
);

export default SlippageModal;
