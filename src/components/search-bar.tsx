"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBar({ placeholder }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  return (
    <form
      className="mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        const p = new URLSearchParams(searchParams.toString());
        const q = value.trim();
        if (q.length === 0) p.delete("q");
        else p.set("q", q);
        router.push(`${pathname}?${p.toString()}`);
      }}
    >
      <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            placeholder ??
            "Sök t.ex. ‘barnvänligt lördag eftermiddag max 200 kr’ (AI kommer strax)"
          }
          className="w-full bg-transparent px-3 py-2 text-sm text-black outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
        >
          Sök
        </button>
      </div>
    </form>
  );
}
