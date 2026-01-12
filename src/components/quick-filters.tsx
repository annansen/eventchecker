"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Chip = {
  key: string;
  label: string;
  apply: (params: URLSearchParams) => void;
};

function isoNowPlus(hours: number) {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  return d.toISOString();
}

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfTodayIso() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function QuickFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const chips = useMemo<Chip[]>(() => {
    return [
      {
        key: "today",
        label: "Idag",
        apply: (p) => {
          p.set("from", startOfTodayIso());
          p.set("to", endOfTodayIso());
        },
      },
      {
        key: "tonight",
        label: "Ikväll",
        apply: (p) => {
          const from = new Date();
          from.setHours(17, 0, 0, 0);
          const to = new Date();
          to.setHours(23, 59, 59, 999);
          p.set("from", from.toISOString());
          p.set("to", to.toISOString());
          p.set("timeOfDay", "evening");
        },
      },
      {
        key: "weekend",
        label: "I helgen",
        apply: (p) => {
          const now = new Date();
          const day = now.getDay();
          const daysUntilSat = (6 - day + 7) % 7;
          const sat = new Date(now.getTime() + daysUntilSat * 24 * 60 * 60 * 1000);
          sat.setHours(0, 0, 0, 0);
          const sun = new Date(sat.getTime() + 2 * 24 * 60 * 60 * 1000);
          sun.setHours(23, 59, 59, 999);
          p.set("from", sat.toISOString());
          p.set("to", sun.toISOString());
        },
      },
      {
        key: "family",
        label: "Barnvänligt",
        apply: (p) => {
          const current = p.get("tags");
          const tags = new Set((current ? current.split(",") : []).filter(Boolean));
          tags.add("barnvänligt");
          p.set("tags", Array.from(tags).join(","));
        },
      },
      {
        key: "free",
        label: "Gratis",
        apply: (p) => {
          p.set("isFree", "true");
        },
      },
      {
        key: "outdoor",
        label: "Utomhus",
        apply: (p) => {
          p.set("indoorOutdoor", "outdoor");
        },
      },
      {
        key: "indoor",
        label: "Inomhus",
        apply: (p) => {
          p.set("indoorOutdoor", "indoor");
        },
      },
      {
        key: "near",
        label: "30 min",
        apply: (p) => {
          p.set("radiusKm", "12");
        },
      },
      {
        key: "72h",
        label: "72h",
        apply: (p) => {
          p.delete("from");
          p.delete("to");
          p.delete("timeOfDay");
          p.set("to", isoNowPlus(72));
        },
      },
    ];
  }, []);

  const onChip = (chip: Chip) => {
    const p = new URLSearchParams(searchParams.toString());
    chip.apply(p);
    router.push(`${pathname}?${p.toString()}`);
  };

  const onClear = () => {
    router.push(pathname);
  };

  const hasFilters = searchParams.size > 0;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onChip(c)}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-black/5"
          >
            {c.label}
          </button>
        ))}
        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-black/70 hover:bg-black/5"
          >
            Rensa filter
          </button>
        ) : null}
      </div>
    </div>
  );
}
