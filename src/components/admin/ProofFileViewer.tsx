// client/src/components/admin/ProofFileViewer.tsx

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface ProofFileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName?: string;
}

export const ProofFileViewer: React.FC<ProofFileViewerProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
}) => {
  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const isPdf = (url: string) => {
    return /\.pdf$/i.test(url);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'proof-file';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Proof</DialogTitle>
          <DialogDescription>
            {fileName || 'Viewing payment proof file'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {isImage(fileUrl) ? (
              <img
                src={fileUrl}
                alt="Payment proof"
                className="w-full h-auto max-h-[600px] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'p-8 text-center text-gray-500 dark:text-gray-400';
                  errorDiv.textContent = 'Failed to load image';
                  target.parentNode?.appendChild(errorDiv);
                }}
              />
            ) : isPdf(fileUrl) ? (
              <iframe
                src={fileUrl}
                className="w-full h-[600px]"
                title="Payment proof PDF"
              />
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <X className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Unsupported file type</p>
                <p className="text-sm mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="mt-2"
                  >
                    Download to view
                  </Button>
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProofFileViewer;
