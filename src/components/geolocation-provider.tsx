"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function GeolocationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (!savedLocation) return;

    const { lat, lng } = JSON.parse(savedLocation);
    const currentLat = searchParams.get("lat");
    const currentLng = searchParams.get("lng");

    // Only update if location params are not already set
    if (!currentLat || !currentLng) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("lat", lat.toString());
      params.set("lng", lng.toString());
      router.replace(`?${params.toString()}`, { scroll: false });
    }
    setHasLocation(true);
  }, [router, searchParams]);

  // Auto-refresh location every 5 minutes when page is visible
  useEffect(() => {
    if (!hasLocation) return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            localStorage.setItem("userLocation", JSON.stringify({ lat: latitude, lng: longitude }));
            
            const params = new URLSearchParams(searchParams.toString());
            params.set("lat", latitude.toString());
            params.set("lng", longitude.toString());
            router.replace(`?${params.toString()}`, { scroll: false });
          },
          () => {
            // Silently fail on refresh
          },
          { timeout: 5000, enableHighAccuracy: false }
        );
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [hasLocation, router, searchParams]);

  return <>{children}</>;
}
