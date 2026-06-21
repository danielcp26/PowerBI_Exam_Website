import { useEffect, useState } from 'react';

interface QueryState<T> {
  data: T[];
  error: string | null;
  loading: boolean;
}

export function useSupabaseQuery<T>(query: () => Promise<{ data: T[] | null; error: { message: string } | null }>) {
  const [state, setState] = useState<QueryState<T>>({ data: [], error: null, loading: true });

  useEffect(() => {
    let active = true;

    query().then(({ data, error }) => {
      if (!active) {
        return;
      }

      setState({
        data: data || [],
        error: error?.message || null,
        loading: false,
      });
    });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
