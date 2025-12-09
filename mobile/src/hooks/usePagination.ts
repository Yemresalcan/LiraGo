import { useState, useCallback } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';

interface UsePaginationResult<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
}

interface UsePaginationOptions {
  pageSize?: number;
}

/**
 * Pagination hook for infinite scroll and load more functionality
 */
export function usePagination<T>(
  fetchFunction: (
    lastDoc: DocumentSnapshot | null,
    pageSize: number
  ) => Promise<{
    items: T[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
  }>,
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const { pageSize = 20 } = options;

  const [items, setItems] = useState<T[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const result = await fetchFunction(lastDoc, pageSize);
      setItems(prev => [...prev, ...result.items]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchFunction, lastDoc, pageSize, isLoadingMore, hasMore]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLastDoc(null);

    try {
      const result = await fetchFunction(null, pageSize);
      setItems(result.items);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, pageSize]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    setItems,
  };
}
