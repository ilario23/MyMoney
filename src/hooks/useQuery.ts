/**
 * useQuery Hook - Reactive Dexie queries with Dexie.Observable
 * Automatically subscribes to database changes for real-time reactivity
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { getDatabase } from "@/lib/db";
import type { Table, Subscription } from "dexie";

export interface UseQueryOptions {
  initialData?: any[];
}

/**
 * Hook for reactive Dexie queries with live updates
 * Uses Dexie.Observable for efficient change detection
 *
 * Usage: useQuery(
 *   (table) => table.where('user_id').equals(userId).filter(e => !e.deleted_at),
 *   'expenses'
 * )
 */
export function useQuery<T = any>(
  queryFn: (table: Table<T>) => any, // Returns a Dexie Query or Promise
  collectionName: "users" | "categories" | "expenses" | "stats_cache",
  options?: UseQueryOptions
) {
  const [data, setData] = useState<T[]>(options?.initialData || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const executeQuery = async () => {
      try {
        const db = getDatabase();
        const table = db[collectionName as keyof typeof db] as Table<T>;

        if (!table) {
          throw new Error(`Collection ${collectionName} not found`);
        }

        // Get the query object from queryFn
        const query = queryFn(table);

        // Initial fetch - convert to array if needed
        const initialData = query.toArray ? await query.toArray() : await query;

        if (isMounted) {
          setData(initialData);
          setLoading(false);
        }

        // Subscribe to changes using Dexie.Observable
        // Only works if query has subscribe method
        if (query.subscribe && typeof query.subscribe === "function") {
          const subscription = query.subscribe({
            onNext: (results: T[]) => {
              if (isMounted) {
                setData(results);
              }
            },
            onError: (error: Error) => {
              if (isMounted) {
                setError(error);
              }
            },
          });

          subscriptionRef.current = subscription;
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    executeQuery();

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [collectionName, queryFn]);

  return { data, loading, error };
}

/**
 * Hook for single document query with live updates
 */
export function useQueryOne<T = any>(
  queryFn: (table: Table<T>) => any, // Returns a Dexie Query or Promise
  collectionName: "users" | "categories" | "expenses" | "stats_cache"
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const executeQuery = async () => {
      try {
        const db = getDatabase();
        const table = db[collectionName as keyof typeof db] as Table<T>;

        if (!table) {
          throw new Error(`Collection ${collectionName} not found`);
        }

        // Get the query object from queryFn
        const query = queryFn(table);

        // Initial fetch
        const result = query.first
          ? await query.first()
          : Array.isArray(query)
            ? query[0]
            : await query;

        if (isMounted) {
          setData(result || null);
          setLoading(false);
        }

        // Subscribe to changes
        if (query.subscribe && typeof query.subscribe === "function") {
          const subscription = query.subscribe({
            onNext: (results: T[]) => {
              if (isMounted) {
                setData(results[0] || null);
              }
            },
            onError: (error: Error) => {
              if (isMounted) {
                setError(error);
              }
            },
          });

          subscriptionRef.current = subscription;
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    executeQuery();

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [collectionName, queryFn]);

  return { data, loading, error };
}

/**
 * Hook for database operations
 */
export function useDB(
  collectionName: "users" | "categories" | "expenses" | "stats_cache"
) {
  const db = getDatabase();
  const table = db[collectionName as keyof typeof db] as Table<any>;

  const insert = useCallback(
    async (data: Partial<any> & { id?: string }) => {
      return table.add({
        ...data,
        id: data.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    [table]
  );

  const update = useCallback(
    async (id: string, data: Partial<any>) => {
      return table.update(id, {
        ...data,
        updated_at: new Date().toISOString(),
      });
    },
    [table]
  );

  const remove = useCallback(
    async (id: string) => {
      return table.delete(id);
    },
    [table]
  );

  const softDelete = useCallback(
    async (id: string) => {
      return table.update(id, {
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    [table]
  );

  const findById = useCallback(
    async (id: string) => {
      return table.get(id);
    },
    [table]
  );

  const findAll = useCallback(async () => {
    return table.toArray();
  }, [table]);

  return {
    table,
    insert,
    update,
    remove,
    softDelete,
    findById,
    findAll,
  };
}
