'use client';

import { PricingTable } from '@clerk/nextjs';

export function PricingTableComponent() {
  // Get current domain for absolute URLs
  const baseURL = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <PricingTable 
      billing={{
        successURL: `${baseURL}/api/redirect-dashboard`,
        cancelURL: `${baseURL}/billing/cancelled`,
      }}
    />
  );
}