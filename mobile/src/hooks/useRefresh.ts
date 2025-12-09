import { useState, useCallback } from 'react';

interface UseRefreshResult {
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
}

/**
 * Pull to refresh hook for list screens
 */
export function useRefresh(
  refreshFunction: () => Promise<void>
): UseRefreshResult {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshFunction();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshFunction]);

  return {
    isRefreshing,
    onRefresh,
  };
}
