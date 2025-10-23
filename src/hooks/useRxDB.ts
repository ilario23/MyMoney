/**
 * Compatibility Layer - Maps old RxDB hooks to new Dexie hooks
 * Provides backward compatibility while transitioning from RxDB to Dexie
 */

export {
  useQuery as useRxQuery,
  useQueryOne as useRxDocument,
  useDB as useRxCollection,
} from "./useQuery";

import { getDatabase } from "@/lib/db";

/**
 * Hook to get database instance (alias)
 */
export function useRxDB() {
  return getDatabase();
}

/**
 * Alias for useRxDB
 */
export const useDatabase = useRxDB;
