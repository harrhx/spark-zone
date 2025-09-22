import { useQuery } from "@tanstack/react-query";
import type { StoreSearchQuery, StoreSearchResponse } from "@shared/api";

async function fetchStores(q: StoreSearchQuery): Promise<StoreSearchResponse> {
  const params = new URLSearchParams({
    location: q.location,
    type: q.type,
    minRating: String(q.minRating),
  });
  const res = await fetch(`https://backendmaps-8hpu.onrender.com/api/stores?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch stores");
  return (await res.json()) as StoreSearchResponse;
}

export function useStores(query: StoreSearchQuery | null) {
  return useQuery<StoreSearchResponse>({
    queryKey: ["stores", query],
    queryFn: () => fetchStores(query as StoreSearchQuery),
    enabled: !!query && !!query.location && typeof query.type === "string" && query.type.length > 0,
  });
}
