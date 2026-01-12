"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

interface EventImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function EventImage({ src, alt, className = "" }: EventImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src || hasError) {
    // Placeholder when no image or error
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 ${className}`}>
        <div className="text-center">
          <Calendar className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm text-emerald-700 font-medium">{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-50">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
