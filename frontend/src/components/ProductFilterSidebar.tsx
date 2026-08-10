"use client";
import { Check, ChevronDown, RotateCcw, Star, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { CatalogMetadata, fetchCatalogMetadata } from "@/lib/api";

export interface FilterState {
  category?: string;
  brand?: string;
  sellerId?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: boolean;
  minRating?: string;
  maxDeliveryDays?: string;
}
export default function ProductFilterSidebar({
  initialFilters,
  onFilterChange,
  totalResults,
  lockCategory = false,
}: {
  initialFilters: FilterState;
  onFilterChange: (f: FilterState) => void;
  totalResults?: number;
  lockCategory?: boolean;
}) {
  const [metadata, setMetadata] = useState<CatalogMetadata>({
    categories: [],
    brands: [],
    sellers: [],
  });
  const [filters, setFilters] = useState(initialFilters);
  useEffect(() => {
    fetchCatalogMetadata().then(setMetadata);
  }, []);
  useEffect(() => {
    queueMicrotask(() => setFilters(initialFilters));
  }, [initialFilters]);
  function apply(next: Partial<FilterState>) {
    const value = { ...filters, ...next };
    setFilters(value);
    onFilterChange(value);
  }
  function reset() {
    const value = {
      category: lockCategory ? initialFilters.category : "",
      brand: "",
      sellerId: "",
      minPrice: "",
      maxPrice: "",
      inStock: false,
      minRating: "",
      maxDeliveryDays: "",
    };
    setFilters(value);
    onFilterChange(value);
  }
  return (
    <aside className="bg-white text-[13px] text-slate-700">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <strong className="text-base">Filtrer</strong>
          <small className="ml-2 text-slate-400">{totalResults || 0}</small>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1 text-[11px] font-bold text-[var(--primary)]"
        >
          <RotateCcw size={13} />
          Effacer
        </button>
      </div>
      <Group title="Disponibilité">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={(e) => apply({ inStock: e.target.checked })}
            className="accent-[var(--primary)]"
          />
          En stock uniquement
        </label>
      </Group>
      {!lockCategory && (
        <Group title="Catégories">
          <Options
            items={metadata.categories}
            value={filters.category}
            onChange={(value) => apply({ category: value })}
          />
        </Group>
      )}
      <Group title="Marques">
        <Options
          items={metadata.brands}
          value={filters.brand}
          onChange={(value) => apply({ brand: value })}
          empty="Aucune marque renseignée"
        />
      </Group>
      <Group title="Vendeurs">
        <Options
          items={metadata.sellers.map((item) => ({
            value: String(item.id),
            label: item.name,
            count: item.count,
          }))}
          value={filters.sellerId}
          onChange={(value) => apply({ sellerId: value })}
          empty="Aucun vendeur renseigné"
        />
      </Group>
      <Group title="Prix">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onFilterChange(filters);
          }}
        >
          <div className="flex items-center gap-2">
            <input
              aria-label="Prix minimum"
              type="number"
              min="0"
              value={filters.minPrice || ""}
              onChange={(e) =>
                setFilters({ ...filters, minPrice: e.target.value })
              }
              className="min-w-0 flex-1 rounded border p-2"
              placeholder="Min"
            />
            <span>–</span>
            <input
              aria-label="Prix maximum"
              type="number"
              min="0"
              value={filters.maxPrice || ""}
              onChange={(e) =>
                setFilters({ ...filters, maxPrice: e.target.value })
              }
              className="min-w-0 flex-1 rounded border p-2"
              placeholder="Max"
            />
          </div>
          <button className="mt-2 w-full rounded bg-[var(--primary)] py-2 text-xs font-bold text-white">
            Appliquer
          </button>
        </form>
      </Group>
      <Group title="Note client">
        <div className="space-y-2">
          {[4, 3, 2].map((value) => (
            <button
              key={value}
              onClick={() =>
                apply({
                  minRating:
                    filters.minRating === String(value) ? "" : String(value),
                })
              }
              className={`flex w-full items-center justify-between rounded p-2 ${filters.minRating === String(value) ? "bg-blue-50 text-[var(--primary)]" : "hover:bg-slate-50"}`}
            >
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {value} et plus
              </span>
              {filters.minRating === String(value) && <Check size={13} />}
            </button>
          ))}
        </div>
      </Group>
      <Group title="Livraison">
        <button
          onClick={() =>
            apply({
              maxDeliveryDays: filters.maxDeliveryDays === "1" ? "" : "1",
            })
          }
          className={`flex w-full items-center gap-2 rounded p-2 ${filters.maxDeliveryDays === "1" ? "bg-blue-50 font-bold text-[var(--primary)]" : "hover:bg-slate-50"}`}
        >
          <Truck size={15} />
          Sous 24–48 h
        </button>
      </Group>
    </aside>
  );
}
function Options({
  items,
  value,
  onChange,
  empty,
}: {
  items: { value: string; label?: string; count: number }[];
  value?: string;
  onChange: (value: string) => void;
  empty?: string;
}) {
  if (!items.length)
    return <p className="text-xs text-slate-400">{empty || "Aucune valeur"}</p>;
  return (
    <div className="max-h-52 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const active = value === item.value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(active ? "" : item.value)}
            className={`flex w-full justify-between rounded-md px-2 py-2 text-left capitalize ${active ? "bg-blue-50 font-bold text-[var(--primary)]" : "hover:bg-slate-50"}`}
          >
            <span>{(item.label || item.value).replaceAll("-", " ")}</span>
            <small className="flex items-center gap-1 text-slate-400">
              {item.count}
              {active && <Check size={12} />}
            </small>
          </button>
        );
      })}
    </div>
  );
}
function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b p-4">
      <h3 className="mb-3 flex justify-between font-extrabold text-slate-900">
        {title}
        <ChevronDown size={15} />
      </h3>
      {children}
    </section>
  );
}
