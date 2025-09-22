
const STORAGE_KEY = "store-finder:search-history";
// Save a search result to backend
export async function saveLastSearch(data: StoreSearchResponse) {
  // The backend expects location, type, minRating, stores, timestamp
  const payload = {
    location: data.query.location,
    type: data.query.type,
    minRating: data.query.minRating,
    stores: data.stores,
    timestamp: data.timestamp,
  };
  try {
  const res = await fetch("https://backendmaps-8hpu.onrender.com/api/search-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to save search history:", res.status, text, payload);
    } else {
      const result = await res.json();
      console.log("Search history saved:", result);
    }
  } catch (err) {
    console.error("Error posting search history:", err, payload);
  }
}
import { useEffect, useState } from "react";
import type { StoreSearchResponse } from "@shared/api";
import { formatDistanceToNow, format } from "date-fns";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";



export function useSearchHistory(refresh?: number) {
  const [history, setHistory] = useState<any[]>([]);
  // Fetch history from backend
  async function fetchHistory() {
    try {
  const res = await fetch("https://backendmaps-8hpu.onrender.com/api/search-history");
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistory(data);
    } catch {
      setHistory([]);
    }
  }
  useEffect(() => { fetchHistory(); }, [refresh]);
  // Clear all history (delete all entries)
  const clearHistory = async () => {
  await Promise.all(history.map((item) => fetch(`https://backendmaps-8hpu.onrender.com/api/search-history/${item._id}`, { method: "DELETE" })));
    setHistory([]);
  };
  // Delete a specific entry by id
  const deleteHistoryAt = async (idx: number) => {
    const entry = history[idx];
    if (!entry || !entry._id) return;
  await fetch(`https://backendmaps-8hpu.onrender.com/api/search-history/${entry._id}`, { method: "DELETE" });
    setHistory(history.filter((_, i) => i !== idx));
  };
  return { history, clearHistory, deleteHistoryAt };
}

export function LastSearchCard({ refresh }: { refresh?: number }) {
  const { history, clearHistory, deleteHistoryAt } = useSearchHistory(refresh);
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!history.length) return <div className="text-muted-foreground text-sm">No search history yet.</div>;
  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          onClick={clearHistory}
          className="px-3 py-1 rounded bg-destructive text-destructive-foreground text-xs hover:bg-destructive/80 transition-colors"
        >
          Clear History
        </button>
      </div>
      <div className="overflow-y-auto max-h-[75vh] pr-2 space-y-4">
        {history.map((item, idx) => {
          const exactTime = format(new Date(item.timestamp), "yyyy-MM-dd HH:mm:ss");
          const isOpen = expanded === idx;
          return (
            <div key={item.timestamp + idx} className="rounded-xl border bg-card p-4 shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div
                  className="flex-1 flex flex-col gap-1 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : idx)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {isOpen ? (
                      <span className="font-medium" title={item.location}>{item.location}</span>
                    ) : (
                      <span className="font-medium truncate max-w-[120px]" title={item.location}>{item.location}</span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{item.type}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{item.minRating}+</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{exactTime}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
                <button
                  className="ml-2 p-1 rounded hover:bg-destructive/20 text-destructive"
                  title="Delete this search"
                  onClick={e => { e.stopPropagation(); deleteHistoryAt(idx); }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {isOpen && (
                <div className="mt-3 animate-in fade-in-0">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Business Type</div>
                      <div className="font-medium">{item.type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Minimum Rating</div>
                      <div className="font-medium">{item.minRating}+</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1">Stores</div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {item.stores.slice(0, 6).map((s) => (
                        <div key={s.id} className="rounded-lg border p-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs">⭐ {s.rating.toFixed(1)}</div>
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {s.address}
                          </div>
                          <div className="text-[10px] text-muted-foreground/70">
                            {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
