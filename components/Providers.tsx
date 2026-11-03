"use client";

import { SessionProvider } from "next-auth/react";

// Google access tokens expire after 60 minutes; refreshing the session every
// 50 minutes keeps the encrypted JWT cookie valid during long focus sessions.
const SESSION_REFETCH_SECONDS = 50 * 60;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={SESSION_REFETCH_SECONDS}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
