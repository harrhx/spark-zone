import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

const querySchema = z.object({
  location: z.string().min(1, 'location is required'),
  type: z.string().min(1, 'type is required'),
  minRating: z
    .string()
    .transform((v) => Number(v))
    .refine((n) => !Number.isNaN(n) && n >= 0 && n <= 5, {
      message: 'minRating must be a number between 0 and 5',
    }),
});

async function geocodeLocation(location: string) {
  if (!GOOGLE_API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.results.length > 0) {
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

async function getNearbyPlaces(center: { lat: number; lng: number }, type: string, minRating: number) {
  if (!GOOGLE_API_KEY) return [];
  const typeMap: Record<string, string> = {
    restaurants: 'restaurant',
    services: 'service',
    cafes: 'cafe',
    retail: 'store',
    entertainment: 'movie_theater',
    all: 'establishment',
    '': 'establishment',
  };
  const googleType = typeMap[type] || 'establishment';
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=3000&type=${googleType}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results) return [];
  return data.results
    .filter((place: any) => (place.rating ?? 0) >= minRating)
    .map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity || place.formatted_address || '',
      rating: place.rating ?? 0,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      type,
    }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const parse = querySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Invalid query',
      details: parse.error.flatten(),
    });
  }

  const { location, type, minRating } = parse.data;
  const geocoded = await geocodeLocation(location);

  let stores: any[] = [];
  if (geocoded) {
    stores = await getNearbyPlaces({ lat: geocoded.lat, lng: geocoded.lng }, type, minRating);
  }

  const response = {
    query: { location, type, minRating },
    geocoded: geocoded ?? null,
    stores,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}
