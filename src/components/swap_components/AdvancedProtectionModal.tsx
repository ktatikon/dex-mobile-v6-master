import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdvancedProtectionModal = ({ showAdvancedProtection, setShowAdvancedProtection }) => (
  <Dialog open={showAdvancedProtection} onOpenChange={setShowAdvancedProtection}>
    <DialogContent className="bg-[#1a1a1a] text-white border-gray-600 max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#B1420A]" />
          Advanced Protection Settings
        </DialogTitle>
      </DialogHeader>
      <div className="text-sm text-gray-300">Set MEV protection rules.</div>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" className="flex-1 border-gray-600 text-white" onClick={() => setShowAdvancedProtection(false)}>
          Cancel
        </Button>
        <Button className="flex-1 bg-[#B1420A] hover:bg-[#8B3208] text-white">
          Apply Settings
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default AdvancedProtectionModal;
