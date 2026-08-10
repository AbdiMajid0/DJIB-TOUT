"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { HomeSection, Product } from "@/lib/api";
import DjibtoutProductCard from "./DjibtoutProductCard";
import RevealSection from "./RevealSection";
import HomeSectionSkeleton from "./HomeSectionSkeleton";

const STORAGE_KEY = "djibtout_recent_products";

export default function PersonalizedHomeShelves({
  products,
  sections,
  mode = "both",
}: {
  products: Product[];
  sections: HomeSection[];
  mode?: "recently_viewed" | "recommended" | "both";
}) {
  const [ids, setIds] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setIds(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
      } catch {
        setIds([]);
      } finally {
        setMounted(true);
      }
    });
  }, []);
  const recent = useMemo(
    () =>
      ids
        .map((id) => products.find((product) => product.id === id))
        .filter(Boolean) as Product[],
    [ids, products],
  );
  const categories = new Set(recent.map((product) => product.category));
  const recommended = products.filter(
    (product) => categories.has(product.category) && !ids.includes(product.id),
  );
  const recentConfig = sections.find(
    (section) => section.key === "recently_viewed",
  );
  const recommendedConfig = sections.find(
    (section) => section.key === "recommended",
  );
  if (!mounted) return <HomeSectionSkeleton type={mode} />;
  return (
    <>
      {(mode === "both" || mode === "recently_viewed") &&
        recentConfig &&
        recent.length > 0 && (
          <Shelf
            title={recentConfig.title}
            subtitle={recentConfig.subtitle}
            products={recent.slice(0, recentConfig.maxItems)}
            icon={<Clock3 size={18} />}
          />
        )}
      {(mode === "both" || mode === "recommended") &&
        recommendedConfig &&
        recommended.length > 0 && (
          <Shelf
            title={recommendedConfig.title}
            subtitle={recommendedConfig.subtitle}
            products={recommended.slice(0, recommendedConfig.maxItems)}
            icon={<Sparkles size={18} />}
          />
        )}
    </>
  );
}

function Shelf({
  title,
  subtitle,
  products,
  icon,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  icon: React.ReactNode;
}) {
  return (
    <RevealSection className="overflow-hidden rounded-lg border border-[#e3e3e3] bg-white">
      <div className="flex items-end justify-between gap-4 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black">
            <span className="text-[var(--primary)]">{icon}</span>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-[11px] text-[#888]">{subtitle}</p>
          )}
        </div>
        <Link
          href="/search"
          className="flex items-center gap-1 text-xs font-bold text-[var(--primary)]"
        >
          Tout voir <ArrowRight size={14} />
        </Link>
      </div>
      <div className="flex snap-x overflow-x-auto border-t [scrollbar-width:none]">
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[160px] max-w-[160px] snap-start border-r sm:min-w-[212px] sm:max-w-[212px]"
          >
            <DjibtoutProductCard product={product} />
          </div>
        ))}
      </div>
    </RevealSection>
  );
}
