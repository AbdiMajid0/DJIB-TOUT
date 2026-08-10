"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { PageResponse, Product, searchProducts } from "@/lib/api";
import DjibtoutProductCard from "./DjibtoutProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import ProductFilterSidebar, { FilterState } from "./ProductFilterSidebar";

const empty: PageResponse<Product> = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  size: 20,
  number: 0,
  first: true,
  last: true,
  empty: true,
};
export default function CatalogClient({
  fixedCategory,
  title,
}: {
  fixedCategory?: string;
  title?: string;
}) {
  const params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname();
  const query = params.get("q") || "";
  const category = fixedCategory || params.get("category") || "";
  const brand = params.get("brand") || "";
  const sellerId = params.get("sellerId") || "";
  const minPrice = params.get("minPrice") || "";
  const maxPrice = params.get("maxPrice") || "";
  const inStock = params.get("inStock") === "true";
  const minRating = params.get("minRating") || "";
  const maxDeliveryDays = params.get("maxDeliveryDays") || "";
  const sort = params.get("sort") || "popular";
  const page = Math.max(0, Number(params.get("page") || 0));
  const [data, setData] = useState(empty),
    [loading, setLoading] = useState(true),
    [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => setLoading(true));
    searchProducts({
      q: query,
      category,
      brand,
      sellerId: sellerId ? Number(sellerId) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock,
      minRating: minRating ? Number(minRating) : undefined,
      maxDeliveryDays: maxDeliveryDays ? Number(maxDeliveryDays) : undefined,
      sort,
      page,
      size: 20,
    }).then((value) => {
      if (active) {
        setData(value);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [
    query,
    category,
    brand,
    sellerId,
    minPrice,
    maxPrice,
    inStock,
    minRating,
    maxDeliveryDays,
    sort,
    page,
  ]);
  function update(
    values: Record<string, string | number | boolean | undefined>,
  ) {
    const next = new URLSearchParams(params.toString());
    Object.entries(values).forEach(([key, value]) => {
      if (value === "" || value === false || value === undefined)
        next.delete(key);
      else next.set(key, String(value));
    });
    if (!("page" in values)) next.delete("page");
    router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  function filters(value: FilterState) {
    update({
      category: fixedCategory ? undefined : value.category,
      brand: value.brand,
      sellerId: value.sellerId,
      minPrice: value.minPrice,
      maxPrice: value.maxPrice,
      inStock: value.inStock,
      minRating: value.minRating,
      maxDeliveryDays: value.maxDeliveryDays,
    });
    setFiltersOpen(false);
  }
  const chips = useMemo(
    () =>
      [
        { key: "q", value: query, label: `Recherche : ${query}` },
        {
          key: "category",
          value: fixedCategory ? "" : category,
          label: category.replaceAll("-", " "),
        },
        { key: "brand", value: brand, label: `Marque : ${brand}` },
        { key: "sellerId", value: sellerId, label: "Vendeur sélectionné" },
        {
          key: "minPrice",
          value: minPrice,
          label: `Min. ${Number(minPrice).toLocaleString("fr-DJ")} FDJ`,
        },
        {
          key: "maxPrice",
          value: maxPrice,
          label: `Max. ${Number(maxPrice).toLocaleString("fr-DJ")} FDJ`,
        },
        { key: "inStock", value: inStock ? "1" : "", label: "En stock" },
        {
          key: "minRating",
          value: minRating,
          label: `${minRating} étoiles et plus`,
        },
        {
          key: "maxDeliveryDays",
          value: maxDeliveryDays,
          label: "Livraison rapide",
        },
      ].filter((item) => item.value),
    [
      query,
      category,
      brand,
      sellerId,
      minPrice,
      maxPrice,
      inStock,
      minRating,
      maxDeliveryDays,
      fixedCategory,
    ],
  );
  const displayTitle =
    title ||
    (query
      ? `Résultats pour « ${query} »`
      : category
        ? category.replaceAll("-", " ")
        : "Tous les produits");
  return (
    <div className="min-h-screen bg-[#f6f7f9] pb-14">
      <div className="dt-container pt-5">
        <nav className="mb-4 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <Link href="/">Accueil</Link>
          <ChevronRight size={12} />
          <span>Catalogue</span>
          {category && (
            <>
              <ChevronRight size={12} />
              <strong className="capitalize text-slate-800">
                {category.replaceAll("-", " ")}
              </strong>
            </>
          )}
        </nav>
        {fixedCategory && (
          <section className="mb-4 overflow-hidden rounded-xl bg-gradient-to-r from-[#102a56] via-[#0052cc] to-[#0891b2] px-6 py-7 text-white sm:px-9">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-white/70">
              Univers DjibTout
            </p>
            <h1 className="mt-2 text-2xl font-black capitalize sm:text-3xl">
              {displayTitle}
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-5 text-white/75">
              Comparez les offres disponibles, les vendeurs, le stock et les
              délais de livraison.
            </p>
          </section>
        )}
        <header className="mb-4 rounded-xl border bg-white px-4 py-5 sm:px-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              {!fixedCategory && (
                <h1 className="text-2xl font-black capitalize tracking-[-.5px] text-slate-900">
                  {displayTitle}
                </h1>
              )}
              <p aria-live="polite" className="mt-1 text-xs text-slate-500">
                {loading
                  ? "Recherche en cours…"
                  : `${data.totalElements} produits trouvés`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltersOpen(true)}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-xs font-bold lg:hidden"
              >
                <SlidersHorizontal size={16} />
                Filtres{" "}
                {chips.length > 0 && (
                  <span className="rounded-full bg-[var(--primary)] px-1.5 text-white">
                    {chips.length}
                  </span>
                )}
              </button>
              <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border bg-slate-50 px-3 sm:flex-none">
                <Grid2X2 size={16} className="hidden text-slate-500 sm:block" />
                <label
                  htmlFor="catalog-sort"
                  className="hidden text-xs font-bold text-slate-500 sm:block"
                >
                  Trier :
                </label>
                <select
                  id="catalog-sort"
                  value={sort}
                  onChange={(e) => update({ sort: e.target.value })}
                  className="w-full bg-transparent text-xs font-extrabold outline-none"
                >
                  <option value="popular">Pertinence</option>
                  <option value="newest">Nouveautés</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="rating_desc">Meilleures notes</option>
                </select>
              </div>
            </div>
          </div>
          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => update({ [chip.key]: undefined })}
                  className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-[var(--primary)]"
                >
                  {chip.label}
                  <X size={13} />
                </button>
              ))}
              <button
                onClick={() =>
                  router.push(fixedCategory ? pathname : "/search")
                }
                className="px-2 text-[11px] font-bold text-red-600"
              >
                Tout effacer
              </button>
            </div>
          )}
        </header>
        <div className="grid items-start gap-4 lg:grid-cols-[248px_minmax(0,1fr)]">
          <div className="sticky top-[150px] hidden overflow-hidden rounded-xl border bg-white lg:block">
            <ProductFilterSidebar
              initialFilters={{
                category,
                brand,
                minPrice,
                maxPrice,
                inStock,
                minRating,
                maxDeliveryDays,
              }}
              onFilterChange={filters}
              totalResults={data.totalElements}
              lockCategory={!!fixedCategory}
            />
          </div>
          <main>
            {loading ? (
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-slate-100 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : data.content.length === 0 ? (
              <EmptyState query={query} category={category} />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-slate-100 md:grid-cols-3 xl:grid-cols-4">
                  {data.content.map((product) => (
                    <DjibtoutProductCard
                      key={product.id}
                      product={product}
                      placement={
                        fixedCategory ? "category-grid" : "search-grid"
                      }
                    />
                  ))}
                </div>
                <Pagination
                  data={data}
                  onPage={(value) => update({ page: value })}
                />
              </>
            )}
          </main>
        </div>
      </div>
      {filtersOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <button
            aria-label="Fermer les filtres"
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
              <strong>Filtrer les produits</strong>
              <button
                onClick={() => setFiltersOpen(false)}
                className="dt-icon-button"
              >
                <X />
              </button>
            </div>
            <ProductFilterSidebar
              initialFilters={{
                category,
                brand,
                minPrice,
                maxPrice,
                inStock,
                minRating,
                maxDeliveryDays,
              }}
              onFilterChange={filters}
              totalResults={data.totalElements}
              lockCategory={!!fixedCategory}
            />
          </div>
        </div>
      )}
    </div>
  );
}
function Pagination({
  data,
  onPage,
}: {
  data: PageResponse<Product>;
  onPage: (page: number) => void;
}) {
  if (data.totalPages <= 1) return null;
  const start = Math.max(0, Math.min(data.number - 2, data.totalPages - 5));
  const pages = Array.from(
    { length: Math.min(5, data.totalPages) },
    (_, i) => start + i,
  );
  return (
    <nav
      aria-label="Pagination"
      className="mt-5 flex items-center justify-center gap-1 rounded-xl border bg-white p-4"
    >
      <button
        aria-label="Page précédente"
        disabled={data.first}
        onClick={() => onPage(data.number - 1)}
        className="dt-icon-button disabled:opacity-30"
      >
        <ChevronLeft size={17} />
      </button>
      {pages.map((i) => (
        <button
          key={i}
          onClick={() => onPage(i)}
          aria-current={data.number === i ? "page" : undefined}
          className={`h-10 min-w-10 rounded-lg text-xs font-black ${data.number === i ? "bg-[var(--primary)] text-white" : "hover:bg-slate-100"}`}
        >
          {i + 1}
        </button>
      ))}
      <button
        aria-label="Page suivante"
        disabled={data.last}
        onClick={() => onPage(data.number + 1)}
        className="dt-icon-button disabled:opacity-30"
      >
        <ChevronRight size={17} />
      </button>
    </nav>
  );
}
function EmptyState({ query, category }: { query: string; category: string }) {
  return (
    <div className="dt-card grid min-h-[420px] place-items-center p-8 text-center">
      <div>
        <SearchX className="mx-auto text-slate-300" size={58} />
        <h2 className="mt-4 text-xl font-black">Aucun produit trouvé</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Vérifiez l’orthographe, élargissez votre prix ou supprimez certains
          filtres.
        </p>
        {(query || category) && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/search"
              className="rounded-lg bg-[var(--primary)] px-5 py-3 text-xs font-bold text-white"
            >
              Voir tout le catalogue
            </Link>
            <Link
              href="/"
              className="rounded-lg border px-5 py-3 text-xs font-bold"
            >
              Découvrir les catégories
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
