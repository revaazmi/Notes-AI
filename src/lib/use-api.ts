import { useQuery } from "@tanstack/react-query";

export function useApi<T>(key: string[], url: string, enabled = true, staleTime?: number) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
    enabled,
    staleTime,
  });
}
