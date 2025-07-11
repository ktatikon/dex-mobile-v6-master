import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet } from 'lucide-react';

const WalletModal = ({ showWalletSelector, setShowWalletSelector }) => (
  <Dialog open={showWalletSelector} onOpenChange={setShowWalletSelector}>
    <DialogContent className="bg-[#1a1a1a] text-white border-gray-600">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#B1420A]" />
          Connect Wallet
        </DialogTitle>
      </DialogHeader>
    </DialogContent>
  </Dialog>
);

export default WalletModal;
