'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type RowRecord = Record<string, unknown>;

import { createClient } from "@/utils/supabase/clients";

type Primitive = string | number | boolean | null;
type Match = Record<string, Primitive | undefined>;

interface OrderOptions {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
}

interface RealtimeCollectionOptions<T extends object> {
  table: string;
  select: string;
  match?: Match;
  initialData?: T[];
  schema?: string;
  orderBy?: OrderOptions;
  fetchOnMount?: boolean;
  transform?: (row: RowRecord) => T;
  primaryKey?: string;
}

interface RealtimeCollectionResult<T extends object> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  mutate: (updater: (collection: T[]) => T[]) => void;
}

interface RealtimeRowOptions<T extends object>
  extends Omit<RealtimeCollectionOptions<T>, "initialData"> {
  initialData?: T | null;
}

export function useRealtimeCollection<T extends object>(
  options: RealtimeCollectionOptions<T>,
): RealtimeCollectionResult<T> {
  const {
    table,
    select,
    match,
    initialData = [],
    schema = "public",
    orderBy,
    fetchOnMount = true,
    transform,
    primaryKey = "id",
  } = options;

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;

  const [data, setData] = useState<T[]>(() => initialData);
  const [loading, setLoading] = useState<boolean>(fetchOnMount);
  const [error, setError] = useState<Error | null>(null);

  const matchKey = useMemo(() => JSON.stringify(match ?? {}), [match]);
  const orderKey = useMemo(
    () => (orderBy ? `${orderBy.column}:${orderBy.ascending ?? true}:${orderBy.nullsFirst ?? false}` : ""),
    [orderBy]
  );

  const normalizedMatch = useMemo<Match | undefined>(() => {
    if (!match) return undefined;
    return Object.fromEntries(
      Object.entries(match).filter(([, value]) => value !== undefined)
    ) as Match;
  }, [match]);

  const orderMemo = useMemo<OrderOptions | null>(() => {
    return orderBy ? { ...orderBy } : null;
  }, [orderBy]);

  const isInitialMount = useRef(true);
  const prevInitialDataRef = useRef(initialData);

  useEffect(() => {
    // Only update if this is the initial mount or if the data has actually changed
    if (isInitialMount.current) {
      setData(initialData);
      prevInitialDataRef.current = initialData;
      isInitialMount.current = false;
    } else if (initialData !== prevInitialDataRef.current) {
      // Use reference comparison first for performance, then deep comparison if needed
      const hasChanged = initialData.length !== (prevInitialDataRef.current as T[]).length ||
                        initialData.some((item, index) => item !== (prevInitialDataRef.current as T[])[index]);
      if (hasChanged) {
        setData(initialData);
        prevInitialDataRef.current = initialData;
      }
    }
  }, [initialData, matchKey]);

  const transformRow = useCallback(
    (row: RowRecord) => {
      return transform ? transform(row) : (row as unknown as T);
    },
    [transform]
  );

  const applyOrder = useCallback(
    (collection: T[]) => {
      if (!orderMemo?.column) return collection;
      const { column, ascending = true, nullsFirst = false } = orderMemo;
      const sorted = [...collection].sort((a, b) => {
        const recordA = a as RowRecord;
        const recordB = b as RowRecord;
        const av = recordA[column];
        const bv = recordB[column];
        const aNull = av === null || av === undefined;
        const bNull = bv === null || bv === undefined;
        if (aNull && bNull) return 0;
        if (aNull) return nullsFirst ? -1 : 1;
        if (bNull) return nullsFirst ? 1 : -1;
        if (typeof av === "number" && typeof bv === "number") {
          return ascending ? av - bv : bv - av;
        }
        return ascending
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
      return sorted;
    },
    [orderMemo]
  );

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = supabase.from(table).select(select);
    if (normalizedMatch) {
      for (const [key, value] of Object.entries(normalizedMatch)) {
        if (value === null) {
          query = query.is(key, null);
        } else {
          query = query.eq(key, value as string | number | boolean);
        }
      }
    }
    if (orderMemo?.column) {
      query = query.order(orderMemo.column, {
        ascending: orderMemo.ascending ?? true,
        nullsFirst: orderMemo.nullsFirst ?? false,
      });
    }
    const { data: rows, error: fetchError } = await query;
    if (!isMountedRef.current) return;
    if (fetchError) {
      setError(fetchError);
    } else {
      setError(null);
      const mapped = Array.isArray(rows) && rows.every(row => typeof row === 'object' && row !== null && !('error' in row))
        ? rows.map(transformRow)
        : [];
      setData(applyOrder(mapped));
    }
    setLoading(false);
  }, [supabase, table, select, normalizedMatch, orderMemo, transformRow, applyOrder]);
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!fetchOnMount) {
      setLoading(false);
      return;
    }
    refreshRef.current();
  }, [fetchOnMount, table, select, matchKey, orderKey]);

  const mutate = useCallback(
    (updater: (collection: T[]) => T[]) => {
      setData((current) => {
        const base = Array.isArray(current) ? [...current] : [];
        const next = updater(base);
        return applyOrder(next);
      });
    },
    [applyOrder]
  );

  const getPrimaryKeyValue = useCallback(
    (row: RowRecord | null | undefined) => {
      if (!row) return undefined;
      return row[primaryKey];
    },
    [primaryKey]
  );

  const rowMatches = useCallback(
    (row: RowRecord | null | undefined) => {
      if (!normalizedMatch) return true;
      const record = row ?? {};
      return Object.entries(normalizedMatch).every(([key, expected]) => {
        if (expected === null) {
          const value = record[key];
          return value === null || value === undefined;
        }
        return record[key] === expected;
      });
    },
    [normalizedMatch]
  );

  const channelFilter = useMemo(() => {
    if (!normalizedMatch) return undefined;
    const entries = Object.entries(normalizedMatch).filter(([, value]) => value !== null);
    if (entries.length === 0) return undefined;
    // Supabase Realtime only supports single filter per channel
    // If we have multiple conditions, don't use server-side filter
    // and rely on client-side rowMatches instead
    if (entries.length > 1) return undefined;
    const [key, value] = entries[0];
    return `${key}=eq.${value}`;
  }, [normalizedMatch]);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${schema}:${table}:${matchKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema,
          table,
          ...(channelFilter ? { filter: channelFilter } : {}),
        },
        (payload: RealtimePostgresChangesPayload<RowRecord>) => {
          setData((current) => {
            const next = Array.isArray(current) ? [...current] : [];
            if (payload.eventType === "DELETE") {
              const oldRow = payload.old;
              if (!oldRow || !rowMatches(oldRow)) return next;
              const pk = getPrimaryKeyValue(oldRow);
              if (pk === undefined) return next;
              const idx = next.findIndex((item) => getPrimaryKeyValue(item as RowRecord) === pk);
              if (idx >= 0) {
                next.splice(idx, 1);
              }
              return applyOrder(next);
            }

            const newRow = payload.new;
            if (!newRow) return next;
            const pk = getPrimaryKeyValue(newRow);
            if (pk === undefined) return next;

            if (!rowMatches(newRow)) {
              const idx = next.findIndex((item) => getPrimaryKeyValue(item as RowRecord) === pk);
              if (idx >= 0) {
                next.splice(idx, 1);
                return applyOrder(next);
              }
              return next;
            }

            const mapped = transformRow(newRow);
            const idx = next.findIndex((item) => getPrimaryKeyValue(item as RowRecord) === pk);
            if (idx >= 0) {
              next[idx] = mapped;
            } else {
              next.push(mapped);
            }
            return applyOrder(next);
          });
        }
      )
      .subscribe((status) => {
        // After we are fully subscribed, refresh once to avoid race conditions
        // where an INSERT/UPDATE happens between initial fetch and subscription setup.
        if (status === "SUBSCRIBED" && fetchOnMount) {
          try {
            refreshRef.current();
          } catch (e) {
            // no-op
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, schema, table, matchKey, channelFilter, rowMatches, getPrimaryKeyValue, transformRow, applyOrder]);

  return {
    data,
    loading,
    error,
    refresh,
    mutate,
  };
}

export function useRealtimeRow<T extends object>(options: RealtimeRowOptions<T>) {
  const { initialData, ...rest } = options;
  const { data, loading, error, refresh } = useRealtimeCollection<T>({
    ...rest,
    initialData: initialData ? [initialData] : [],
  });

  return {
    data: data[0] ?? null,
    loading,
    error,
    refresh,
  };
}
