"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Check } from "lucide-react";

const PREFERENCES = [
  { id: "barnvänligt", label: "Barnvänligt" },
  { id: "gratis", label: "Gratis" },
  { id: "utomhus", label: "Utomhus" },
  { id: "kultur", label: "Kultur" },
  { id: "sport", label: "Sport" },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<"location" | "preferences">("location");
  const [location, setLocation] = useState<"geolocation" | "linkoping" | null>(null);
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLocation = async (choice: "geolocation" | "linkoping") => {
    if (choice === "geolocation") {
      setLoading(true);
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            enableHighAccuracy: false,
          });
        });
        const { latitude, longitude } = pos.coords;
        localStorage.setItem("userLocation", JSON.stringify({ lat: latitude, lng: longitude }));
        setLocation("geolocation");
      } catch {
        // Fallback till Linköping om geolocation misslyckas
        localStorage.setItem("userLocation", JSON.stringify({ lat: 58.4108, lng: 15.6214 }));
        setLocation("linkoping");
      } finally {
        setLoading(false);
      }
    } else {
      localStorage.setItem("userLocation", JSON.stringify({ lat: 58.4108, lng: 15.6214 }));
      setLocation("linkoping");
    }
    setStep("preferences");
  };

  const togglePref = (id: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id].slice(0, 3)
    );
  };

  const finishOnboarding = () => {
    localStorage.setItem("preferences", JSON.stringify(selectedPrefs));
    localStorage.setItem("onboardingComplete", "true");
    router.push("/");
  };

  if (step === "location") {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleLocation("geolocation")}
            disabled={loading}
            className="w-full rounded-2xl border border-black/10 bg-white px-6 py-4 text-left hover:bg-black/5 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="font-medium text-black">Använd min plats</div>
                <div className="text-sm text-black/60">Visa avstånd och närliggande evenemang</div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleLocation("linkoping")}
            className="w-full rounded-2xl border border-black/10 bg-white px-6 py-4 text-left hover:bg-black/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
              </div>
              <div>
                <div className="font-medium text-black">Jag är i Linköping</div>
                <div className="text-sm text-black/60">Standardläge – inga avstånd</div>
              </div>
            </div>
          </button>
        </div>

        {loading && (
          <div className="text-center text-sm text-black/60">Hämtar plats...</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-black">Välj 2–3 intressen</h2>
        <p className="mt-1 text-sm text-black/60">Vi använder detta för att rekommendera evenemang</p>
      </div>

      <div className="space-y-3">
        {PREFERENCES.map((pref) => {
          const selected = selectedPrefs.includes(pref.id);
          return (
            <button
              key={pref.id}
              type="button"
              onClick={() => togglePref(pref.id)}
              className={`w-full rounded-2xl border px-6 py-4 text-left transition-colors ${
                selected
                  ? "border-emerald-600 bg-emerald-50"
                  : "border-black/10 bg-white hover:bg-black/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-black">{pref.label}</span>
                {selected && <Check className="w-5 h-5 text-emerald-600" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-sm text-black/60">
        {selectedPrefs.length}/3 valda
      </div>

      <button
        type="button"
        onClick={finishOnboarding}
        disabled={selectedPrefs.length < 2}
        className="w-full rounded-2xl bg-emerald-600 px-6 py-4 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedPrefs.length < 2 ? `Välj minst 2 intressen` : "Klar"}
      </button>
    </div>
  );
}
