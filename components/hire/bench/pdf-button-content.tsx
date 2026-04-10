"use client"

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { MarketingProfilePDF } from './marketing-profile-pdf';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';

interface PDFButtonContentProps {
  candidate: any;
  organization: any;
  className?: string;
}

export default function PDFButtonContent({ candidate, organization, className }: PDFButtonContentProps) {
  return (
    <PDFDownloadLink
      document={<MarketingProfilePDF candidate={candidate} organization={organization} />}
      fileName={`Marketing_Profile_${candidate.firstName}_${candidate.lastName}.pdf`}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) => (
        <Button 
          size="sm" 
          variant="outline" 
          className={`h-7 text-[10px] font-bold uppercase tracking-wider rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary transition-all ${className}`}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
          ) : (
            <FileText className="w-3.5 h-3.5 mr-1.5" />
          )}
          {loading ? "Generating..." : "Download Profile"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
