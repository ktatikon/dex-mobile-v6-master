/**
 * Transaction History Panel
 * Enhanced transaction history with detailed information
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  History, ExternalLink, Copy, Search, 
  ArrowUpRight, ArrowDownLeft, Clock, 
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatAddress } from '@/services/ethersService';

interface TransactionHistoryPanelProps {
  transactions: any[];
  activeNetwork: string;
}

export const TransactionHistoryPanel: React.FC<TransactionHistoryPanelProps> = ({
  transactions,
  activeNetwork
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 border-green-600';
      case 'failed':
        return 'text-red-600 border-red-600';
      case 'pending':
        return 'text-yellow-600 border-yellow-600';
      default:
        return 'text-gray-600 border-gray-600';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'receive':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const getBlockExplorerUrl = (txHash: string) => {
    const baseUrls: Record<string, string> = {
      'sepolia': 'https://sepolia.etherscan.io/tx/',
      'ganache': '#', // Local network
    };
    return baseUrls[activeNetwork.toLowerCase()] + txHash;
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.from.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Transaction History</span>
          </CardTitle>
          
          <Badge variant="outline">
            {transactions.length} transactions
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            {transactions.length === 0 ? (
              <>
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
                <p className="text-muted-foreground">
                  Your transaction history will appear here once you start sending transactions
                </p>
              </>
            ) : (
              <>
                <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No transactions match your search</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getTransactionIcon(tx.type)}
                    <span className="font-medium capitalize">{tx.type}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(tx.status)}`}
                    >
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(tx.status)}
                        <span className="capitalize">{tx.status}</span>
                      </div>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(tx.hash, 'Transaction Hash')}
                      title="Copy transaction hash"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {activeNetwork.toLowerCase() !== 'ganache' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(getBlockExplorerUrl(tx.hash), '_blank')}
                        title="View on block explorer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Amount</div>
                    <div className="font-medium">{tx.amount} ETH</div>
                  </div>
                  
                  <div>
                    <div className="text-muted-foreground">Gas Fee</div>
                    <div className="font-medium">
                      {tx.gasUsed && tx.gasPrice ? 
                        ((parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice)) / 1e18).toFixed(6) + ' ETH' :
                        'N/A'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-muted-foreground">From</div>
                    <div className="font-mono text-xs">{formatAddress(tx.from)}</div>
                  </div>
                  
                  <div>
                    <div className="text-muted-foreground">To</div>
                    <div className="font-mono text-xs">{formatAddress(tx.to)}</div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                      <span>Hash: {formatAddress(tx.hash)}</span>
                    </div>
                    <div>
                      <span>{new Date(tx.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {tx.blockNumber && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Block #{tx.blockNumber.toLocaleString()}
                      {tx.gasUsed && (
                        <span className="ml-4">Gas Used: {parseInt(tx.gasUsed).toLocaleString()}</span>
                      )}
                      {tx.gasPrice && (
                        <span className="ml-4">Gas Price: {(parseFloat(tx.gasPrice) / 1e9).toFixed(2)} gwei</span>
                      )}
                    </div>
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
