'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MintStatusProps {
  status?: 'idle' | 'minting' | 'success' | 'error';
  errorMessage?: string;
  transactionSignature?: string;
}

export default function MintStatus({ 
  status = 'idle', 
  errorMessage = '',
  transactionSignature = ''
}: MintStatusProps) {
  if (status === 'idle') return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-400" />;
      case 'minting':
        return <Loader2 className="w-6 h-6 animate-spin text-purple-400" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return 'NFT minted successfully! 🎉';
      case 'error':
        return errorMessage || 'Minting failed. Please try again.';
      case 'minting':
        return 'Minting your NFT... Please wait and do not close this window.';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'minting':
        return 'text-purple-400';
      default:
        return 'text-white';
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {getStatusIcon()}
          <div className="flex-1">
            <p className={`font-semibold text-lg ${getStatusColor()}`}>
              {getStatusMessage()}
            </p>
            
            {status === 'success' && transactionSignature && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-purple-400/50 text-purple-300 hover:bg-purple-400/20 hover:text-white backdrop-blur-sm rounded-lg"
                  onClick={() => window.open(`https://solscan.io/tx/${transactionSignature}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Solscan
                </Button>
              </div>
            )}
            
            {status === 'minting' && (
              <p className="text-white/60 text-sm mt-2">
                This may take a few moments. Please keep this window open.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}