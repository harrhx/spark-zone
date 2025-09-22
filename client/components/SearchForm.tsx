import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SearchValues {
  location: string;
  type: string;
  minRating: number;
}

export function SearchForm({
  onSearch,
  initial,
  className,
}: {
  onSearch: (values: SearchValues) => void;
  initial?: Partial<SearchValues>;
  className?: string;
}) {
  const [location, setLocation] = useState(initial?.location ?? "");
  const [type, setType] = useState(initial?.type ?? "all");
  const [minRating, setMinRating] = useState<number>(initial?.minRating ?? 3);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim() || !type.trim()) return;
    onSearch({ location: location.trim(), type: type.trim(), minRating });
  }

  // Helper to get user location and reverse geocode
  async function handleFillLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
  // Use Google Maps Geocoding API
  // API key must be set in .env as VITE_GOOGLE_MAPS_API_KEY
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        alert("Google Maps API key not found");
        return;
      }
      try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
        const data = await res.json();
        if (data.status === "OK" && data.results.length > 0) {
          setLocation(data.results[0].formatted_address);
        } else {
          alert("Could not get address from location");
        }
      } catch {
        alert("Failed to fetch address");
      }
    }, () => {
      alert("Could not get your location");
    });
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end",
        className,
      )}
    >
      <div className="md:col-span-5">
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          Location
        </label>
        <div className="relative">
          <Input
            placeholder="Enter city, area, or address"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={handleFillLocation}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary"
            title="Use my location"
            tabIndex={-1}
          >
            <LocateFixed className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="md:col-span-4">
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          Business Type
        </label>
        <Select
          value={type}
          onValueChange={v => setType(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="restaurants">Restaurants</SelectItem>
            <SelectItem value="services">Services</SelectItem>
            <SelectItem value="cafes">Cafes</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="entertainment">Entertainment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          Min Rating
        </label>
        <Select
          value={String(minRating)}
          onValueChange={(v) => setMinRating(Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Minimum rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="3">3+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
            <SelectItem value="4.5">4.5+</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-1">
        <Button type="submit" className="w-full h-10">
          Search
        </Button>
      </div>
    </form>
  );
}
