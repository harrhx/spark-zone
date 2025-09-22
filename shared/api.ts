/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/** Store and search types shared between client and server */
export interface Store {
  id: string;
  name: string;
  address: string;
  rating: number; // 1-5
  lat: number;
  lng: number;
  type: string;
}

export interface StoreSearchQuery {
  location: string; // text entered by user
  type: string; // business type
  minRating: number; // minimum rating filter
}

export interface StoreSearchResponse {
  query: StoreSearchQuery;
  geocoded?: {
    lat: number;
    lng: number;
    displayName: string;
  } | null;
  stores: Store[];
  timestamp: string; // ISO string
}
