import type { RequestHandler } from "express";
import { z } from "zod";
import type { Store, StoreSearchResponse, StoreSearchQuery } from "@shared/api";
// Google Maps API key must be set in .env as VITE_GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY
const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

const querySchema = z.object({
  location: z.string().min(1, "location is required"),
  type: z.string().min(1, "type is required"),
  minRating: z
    .string()
    .transform((v) => Number(v))
    .refine((n) => !Number.isNaN(n) && n >= 0 && n <= 5, {
      message: "minRating must be a number between 0 and 5",
    }),
});


async function geocodeLocation(location: string): Promise<{
  lat: number;
  lng: number;
  displayName: string;
} | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results.length > 0) {
      const first = data.results[0];
      return {
        lat: first.geometry.location.lat,
        lng: first.geometry.location.lng,
        displayName: first.formatted_address,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function getNearbyPlaces(center: { lat: number; lng: number }, type: string, minRating: number): Promise<Store[]> {
  if (!GOOGLE_API_KEY) return [];
  // Map UI type to Google Places type (single type for best filtering)
  const typeMap: Record<string, string> = {
    restaurants: "restaurant",
    services: "service",
    cafes: "cafe",
    retail: "store",
    entertainment: "movie_theater",
    all: "establishment",
    "": "establishment",
  };
  const googleType = typeMap[type] || "establishment";
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=3000&type=${googleType}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results) return [];
  return data.results
    .filter((place: any) => (place.rating ?? 0) >= minRating)
    .map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity || place.formatted_address || "",
      rating: place.rating ?? 0,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      type,
    }));
}

function generateStores(
  center: { lat: number; lng: number },
  type: string,
  minRating: number,
  count = 20,
): Store[] {
  const stores: Store[] = [];
  const namesPool = [
    "Prime",
    "Elite",
    "Urban",
    "Corner",
    "Central",
    "Vista",
    "Oasis",
    "Nova",
    "Beacon",
    "Harbor",
    " Summit",
    " Park",
  ];

  for (let i = 0; i < count; i++) {
    const offsetLat = (Math.random() - 0.5) * 0.02; // ~ up to ~1-2km
    const offsetLng = (Math.random() - 0.5) * 0.02;
    const rating = Math.round((Math.random() * 4 + 1) * 10) / 10; // 1.0 - 5.0
    if (rating < minRating) continue;
    const lat = center.lat + offsetLat;
    const lng = center.lng + offsetLng;
    const name = `${namesPool[i % namesPool.length]} ${type}`.trim();
    const address = `${Math.floor(Math.random() * 900 + 100)} ${type} Street, near ${
      i + 1
    } Plaza`;

    stores.push({
      id: `${lat.toFixed(5)}_${lng.toFixed(5)}_${i}`,
      name,
      address,
      rating,
      lat,
      lng,
      type,
    });
  }

  return stores;
}

export const handleStores: RequestHandler = async (req, res) => {
  const parse = querySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: parse.error.flatten(),
    });
  }

  const { location, type, minRating } = parse.data;
  const geocoded = await geocodeLocation(location);


  let stores: Store[] = [];
  if (geocoded) {
    stores = await getNearbyPlaces({ lat: geocoded.lat, lng: geocoded.lng }, type, minRating);
  }

  const response: StoreSearchResponse = {
    query: { location, type, minRating } as StoreSearchQuery,
    geocoded: geocoded ?? null,
    stores,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
};
