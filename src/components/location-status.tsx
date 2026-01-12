"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

export function LocationStatus() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => {
      const loc = localStorage.getItem("userLocation");
      if (loc) {
        setLastUpdate(new Date());
      }
    };
    update();

    const interval = setInterval(update, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  if (!lastUpdate) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-black/50">
      <MapPin size={12} />
      <span>Plats uppdaterad</span>
    </div>
  );
}
