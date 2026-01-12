"use client";

import { useEffect, useRef, useState } from "react";

interface EventMapProps {
  lat: number;
  lng: number;
  title: string;
}

export function EventMap({ lat, lng, title }: EventMapProps) {
  const [isClient, setIsClient] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainer.current || mapRef.current) return;

    // Dynamically import MapLibre GL JS only on client side
    import("maplibre-gl").then((maplibregl) => {
      // Initialize MapLibre GL JS map with OpenStreetMap style (free)
      const map = new maplibregl.Map({
        container: mapContainer.current!,
        style: {
          version: 8,
          sources: {
            "osm": {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors"
            }
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm"
            }
          ]
        },
        center: [lng, lat],
        zoom: 16,
        attributionControl: false,
      });
      
      mapRef.current = map;

      // Add marker
      const marker = new maplibregl.Marker({
        color: "#10b981",
        scale: 1.2,
      })
      .setLngLat([lng, lat])
      .addTo(map);

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isClient, lat, lng]);

  if (!isClient) {
    return (
      <div className="h-64 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-emerald-600 text-white rounded-full mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-gray-600">Laddar karta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 rounded-lg overflow-hidden relative">
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: "256px" }} />
    </div>
  );
}
