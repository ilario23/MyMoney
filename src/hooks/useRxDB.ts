/**
 * Custom hooks for RxDB integration
 */

import { useEffect, useState } from "react";
import { getDatabase } from "@/lib/rxdb";
import type { RxDocument, RxQuery } from "rxdb";

/**
 * Hook to get RxDB database instance
 */
export function useRxDB() {
  return getDatabase();
}

/**
 * Alias for useRxDB
 */
export const useDatabase = useRxDB;

/**
 * Hook for reactive RxDB query
 * Automatically subscribes and updates state when data changes
 */
export function useRxQuery<T = any>(queryFn: () => RxQuery<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const query = queryFn();

      if (!query) {
        setLoading(false);
        return;
      }

      // Subscribe to query results
      const subscription = query.$.subscribe({
        next: (results: any) => {
          setData(results);
          setLoading(false);
        },
        error: (err: Error) => {
          setError(err);
          setLoading(false);
        },
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [queryFn]);

  return { data, loading, error };
}

/**
 * Hook for reactive single document
 */
export function useRxDocument<T = any>(queryFn: () => RxQuery<T> | null) {
  const [doc, setDoc] = useState<RxDocument<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const query = queryFn();

      if (!query) {
        setLoading(false);
        return;
      }

      // Subscribe to single document
      const subscription = query.$.subscribe({
        next: (results: any) => {
          setDoc(results[0] || null);
          setLoading(false);
        },
        error: (err: Error) => {
          setError(err);
          setLoading(false);
        },
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [queryFn]);

  return { doc, loading, error };
}

/**
 * Hook for RxDB collection operations
 */
export function useRxCollection<T = any>(collectionName: string) {
  const db = useRxDB();
  const collection = (db as any)[collectionName];

  const insert = async (data: Partial<T> & { id?: string }) => {
    return collection.insert({
      ...data,
      id: data.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  const update = async (id: string, data: Partial<T>) => {
    const doc = await collection.findOne(id).exec();
    if (doc) {
      await doc.update({
        $set: {
          ...data,
          updated_at: new Date().toISOString(),
        },
      });
    }
  };

  const remove = async (id: string) => {
    const doc = await collection.findOne(id).exec();
    if (doc) {
      await doc.remove();
    }
  };

  const softDelete = async (id: string) => {
    const doc = await collection.findOne(id).exec();
    if (doc) {
      await doc.update({
        $set: {
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }
  };

  const findById = async (id: string) => {
    return collection.findOne(id).exec();
  };

  const findAll = async () => {
    return collection.find().exec();
  };

  return {
    collection,
    insert,
    update,
    remove,
    softDelete,
    findById,
    findAll,
  };
}
