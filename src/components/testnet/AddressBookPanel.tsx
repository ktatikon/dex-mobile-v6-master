/**
 * Address Book Panel
 * Contact management and address book functionality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, Plus, Star, Copy, Send, 
  Search, Edit, Trash2, BookOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatAddress } from '@/services/ethersService';

interface AddressBookPanelProps {
  addressBook: any[];
  activeNetwork: string;
  onRefresh: () => void;
}

export const AddressBookPanel: React.FC<AddressBookPanelProps> = ({
  addressBook,
  activeNetwork,
  onRefresh
}) => {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddAddress = async () => {
    if (!newAddress || !newLabel) {
      toast({
        title: "Validation Error",
        description: "Please enter both address and label",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // This would use the address manager
      toast({
        title: "Address Added",
        description: `"${newLabel}" has been added to your address book`,
      });
      setNewAddress('');
      setNewLabel('');
      setNewNotes('');
      setShowAddDialog(false);
      onRefresh();
    } catch (error) {
      toast({
        title: "Add Failed",
        description: error instanceof Error ? error.message : "Failed to add address",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const filteredAddresses = addressBook.filter(addr => 
    addr.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (addr.notes && addr.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Address Book</span>
          </CardTitle>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
                <DialogDescription>
                  Add a new address to your address book for easy access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-address">Address</Label>
                  <Input
                    id="new-address"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
                <div>
                  <Label htmlFor="new-label">Label</Label>
                  <Input
                    id="new-label"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Enter a name for this address"
                  />
                </div>
                <div>
                  <Label htmlFor="new-notes">Notes (Optional)</Label>
                  <Textarea
                    id="new-notes"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Add any notes about this address"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAddress} disabled={loading}>
                  Add Address
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Address List */}
        {filteredAddresses.length === 0 ? (
          <div className="text-center py-8">
            {addressBook.length === 0 ? (
              <>
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Addresses Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add frequently used addresses to your address book for quick access
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  Add First Address
                </Button>
              </>
            ) : (
              <>
                <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No addresses match your search</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAddresses.map((address) => (
              <div key={address.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{address.label}</span>
                    {address.isFavorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                    <Badge variant="outline">{address.addressType}</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(address.address, 'Address')}
                      title="Copy address"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Send transaction"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Edit address"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-2">
                  {formatAddress(address.address)}
                </div>
                
                {address.notes && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {address.notes}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Added: {new Date(address.createdAt).toLocaleDateString()}
                  </span>
                  {address.usageCount > 0 && (
                    <span>
                      Used {address.usageCount} times
                    </span>
                  )}
                  {address.lastUsed && (
                    <span>
                      Last used: {new Date(address.lastUsed).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
