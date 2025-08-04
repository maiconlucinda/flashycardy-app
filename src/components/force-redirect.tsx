'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ForceRedirectProps {
  to: string;
  delay?: number;
  fallback?: boolean;
}

export function ForceRedirect({ to, delay = 2000, fallback = true }: ForceRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    // Primary redirect using Next.js router
    const primaryTimer = setTimeout(() => {
      router.push(to);
    }, delay);

    // Fallback redirect using window.location (more reliable for billing flows)
    const fallbackTimer = fallback ? setTimeout(() => {
      window.location.href = to;
    }, delay + 1000) : null;

    return () => {
      clearTimeout(primaryTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [to, delay, fallback, router]);

  return null;
}