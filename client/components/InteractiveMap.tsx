import type { Store } from "@shared/api";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader, DirectionsRenderer } from "@react-google-maps/api";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

// Google Maps API key must be set in .env as VITE_GOOGLE_MAPS_API_KEY
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

export function InteractiveMap({
  center,
  stores,
}: {
  center: { lat: number; lng: number } | null;
  stores: Store[];
}) {
  const mapCenter = center ?? { lat: 28.6139, lng: 77.209 };
  const [selected, setSelected] = useState<Store | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapRef, setMapRef] = useState<any>(null);
  const [directions, setDirections] = useState<any>(null);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  // Fetch directions from userLocation to destination
  async function handleGetDirections(dest: { lat: number; lng: number }) {
    if (!userLocation) {
      alert("Please use 'Locate Me' first to set your location.");
      return;
    }
    setDirectionsLoading(true);
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: userLocation,
        destination: dest,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        setDirectionsLoading(false);
        if (status === "OK") {
          setDirections(result);
        } else {
          alert("Could not get directions: " + status);
        }
      }
    );
  }
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          if (mapRef) {
            mapRef.panTo(coords);
            mapRef.setZoom(15);
          }
        },
        (err) => {
          alert("Could not get your location");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  if (!isLoaded) {
    return <div className="h-[420px] w-full overflow-hidden rounded-xl border flex items-center justify-center">Loading map...</div>;
  }

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border">
      <Button
        variant="secondary"
        size="sm"
        className="absolute z-10 right-4 top-4 shadow"
        onClick={handleLocateMe}
        type="button"
      >
        📍 Locate Me
      </Button>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || mapCenter}
        zoom={userLocation ? 15 : 13}
        onLoad={setMapRef}
      >
        {stores.map((s) => (
          <Marker
            key={s.id}
            position={{ lat: s.lat, lng: s.lng }}
            onClick={() => setSelected(s)}
          />
        ))}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new window.google.maps.Size(40, 40),
            }}
          />
        )}
        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div>
              <div className="font-semibold">{selected.name}</div>
              <div className="text-sm text-muted-foreground">{selected.address}</div>
              <div className="mt-1 text-sm">⭐ {selected.rating.toFixed(1)}</div>
              <button
                className="mt-2 px-3 py-1 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/80"
                onClick={() => handleGetDirections({ lat: selected.lat, lng: selected.lng })}
                disabled={directionsLoading}
              >
                {directionsLoading ? "Loading..." : "Get Directions"}
              </button>
            </div>
          </InfoWindow>
        )}
        {directions && (
          <DirectionsRenderer directions={directions} />
        )}
      </GoogleMap>
    </div>
  );
}
