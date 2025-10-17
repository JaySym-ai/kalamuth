'use client';

import { useCallback } from "react";
import { useRealtimeRow } from "@/lib/supabase/realtime";
import type { Ludus } from "@/types/ludus";

/**
 * Custom hook for real-time ludus data subscription
 * Standardizes the pattern used across multiple client components
 */
export function useLudusRealtime(initialLudus: Ludus & { id: string }) {
  const { data: realtimeLudus, loading, error, refresh } = useRealtimeRow<Ludus & { id: string }>({
    table: "ludi",
    select:
      "id,userId,serverId,name,logoUrl,treasury,reputation,morale,facilities,maxGladiators,gladiatorCount,motto,locationCity,createdAt,updatedAt",
    match: { id: initialLudus.id },
    initialData: initialLudus,
    primaryKey: "id",
    transform: useCallback((row: Record<string, unknown>) => {
      const record = row as Record<string, unknown>;
      return {
        ...(initialLudus as Ludus & { id: string }),
        ...(record as Partial<Ludus>),
        id: String(record.id ?? initialLudus.id),
      } as Ludus & { id: string };
    }, [initialLudus]),
  });

  return {
    ludus: realtimeLudus ?? initialLudus,
    loading,
    error,
    refresh,
  };
}
