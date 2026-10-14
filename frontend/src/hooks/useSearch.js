import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../services/search.api.js';

export function useSearch(params, enabled = true) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => searchApi.search(params),
    enabled: enabled && Boolean(params?.q),
  });
}

export default useSearch;
