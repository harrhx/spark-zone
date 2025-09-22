import { useEffect, useMemo, useState } from "react";
import { SearchForm, type SearchValues } from "@/components/SearchForm";
import { InteractiveMap } from "@/components/InteractiveMap";
import { saveLastSearch } from "@/components/LastSearch";
import { useStores } from "@/hooks/use-stores";
import type { StoreSearchQuery } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LastSearchCard } from "@/components/LastSearch";
export default function Index() {
  const [formValues, setFormValues] = useState<SearchValues | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [pendingSearch, setPendingSearch] = useState<SearchValues | null>(null);

  const query: StoreSearchQuery | null = useMemo(() => {
    if (!formValues) return null;
    return {
      location: formValues.location,
      type: formValues.type,
      minRating: formValues.minRating,
    };
  }, [formValues]);

  const { data, isFetching, refetch } = useStores(query);

  // When user submits a search, set pendingSearch
  function handleSearch(values: SearchValues) {
    setFormValues(values);
    setPendingSearch(values);
  }

  // When data matches pendingSearch, save to history and clear pendingSearch
  useEffect(() => {
    if (
      pendingSearch &&
      data &&
      data.query &&
      data.query.location === pendingSearch.location &&
      data.query.type === pendingSearch.type &&
      data.query.minRating === pendingSearch.minRating
    ) {
      saveLastSearch(data).then(() => setHistoryRefresh(r => r + 1));
      setPendingSearch(null);
    }
  }, [data, pendingSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent to-background">
      <Sheet>
        <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2 font-extrabold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">SF</span>
              <span className="text-lg tracking-tight">Store Finder</span>
            </a>
            <div className="flex items-center gap-2">
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="mr-2 md:mr-2 px-2 py-1 md:px-4 md:py-2 text-xs md:text-base"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" className="mr-1"><path fill="currentColor" d="M12 8a1 1 0 0 1 1 1v3.586l2.293 2.293a1 1 0 1 1-1.414 1.414l-2.586-2.586A1 1 0 0 1 11 13V9a1 1 0 0 1 1-1Zm0-6a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8a8.009 8.009 0 0 1-8 8Z"/></svg>
                  <span className="hidden xs:inline">Search History</span>
                </Button>
              </SheetTrigger>
              <Button variant="ghost" onClick={() => refetch()} disabled={isFetching || !data} className="hidden md:inline-flex">
                Refresh
              </Button>
            </div>
          </div>
        </header>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>Search History</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <LastSearchCard refresh={historyRefresh} />
          </div>
        </SheetContent>
      </Sheet>

      <main className="container mx-auto px-4 py-8">
        <section className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Find stores near you
            </h1>
            <p className="mt-1 text-muted-foreground">
              Search by location, business type, and minimum rating. Results appear on the map.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <SearchForm
              onSearch={handleSearch}
              initial={{ minRating: 3 }}
            />

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <InteractiveMap
                  center={data?.geocoded ? { lat: data.geocoded.lat, lng: data.geocoded.lng } : null}
                  stores={data?.stores ?? []}
                />
              </div>
              <div className="md:col-span-1">
                <div className="rounded-xl border p-4 h-[420px] overflow-y-auto">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-base font-semibold">Results</h3>
                    {isFetching && <span className="text-xs text-muted-foreground">Loading…</span>}
                  </div>
                  {data?.stores?.length ? (
                    <ul className="space-y-2">
                      {data.stores.map((s) => (
                        <li key={s.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">{s.name}</div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs">⭐ {s.rating.toFixed(1)}</span>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.lat + "," + s.lng)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-primary hover:underline"
                                title="Get Directions"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12.707 2.293a1 1 0 0 0-1.414 0l-8 8a1 1 0 0 0 .217 1.578l8 5a1 1 0 0 0 1.06 0l8-5a1 1 0 0 0 .217-1.578l-8-8Zm-6.586 8L12 4.414 17.879 10.293 12 13.586 6.121 10.293ZM12 15.414l-6.364-3.977L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-1.636-8.563L12 15.414Z"/></svg>
                              </a>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {s.address}
                          </div>
                          <div className="text-[10px] text-muted-foreground/70">
                            {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-muted-foreground">No results yet. Enter a location and search.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Removed duplicate LastSearchCard to avoid double rendering and stray closing brace error */}
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">© {new Date().getFullYear()} Store Finder</div>
      </footer>
    </div>
  );
}

