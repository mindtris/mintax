"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';

const PDFButtonContent = dynamic(() => import('./pdf-button-content'), {
  ssr: false,
  loading: () => (
    <Button 
      size="sm" 
      variant="outline" 
      className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-lg border-primary/20 bg-muted/20 animate-pulse opacity-50"
      disabled
    >
      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
      Loading...
    </Button>
  ),
});

interface DownloadProfileButtonProps {
  candidate: any;
  organization: any;
  className?: string;
}

export function DownloadProfileButton({ candidate, organization, className }: DownloadProfileButtonProps) {
  return (
    <PDFButtonContent 
      candidate={candidate} 
      organization={organization} 
      className={className} 
    />
  );
}
