"use client";
import { useEffect, useState } from "react";
import { BarChart3, PackageCheck, RotateCcw, WalletCards } from "lucide-react";
import { fetchSellerAnalytics, SellerAnalytics } from "@/lib/api";
const money = (n: number) =>
  new Intl.NumberFormat("fr-DJ", {
    style: "currency",
    currency: "DJF",
    maximumFractionDigits: 0,
  }).format(n);
export default function SellerAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<SellerAnalytics | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    queueMicrotask(() => {
      setData(null);
      fetchSellerAnalytics(days).then(setData).catch((e) => setError(e.message));
    });
  }, [days]);
  const cards = [
    {
      label: "Chiffre d’affaires",
      value: data ? money(data.revenue) : "—",
      icon: WalletCards,
    },
    { label: "Commandes", value: data?.orders ?? "—", icon: PackageCheck },
    {
      label: "Panier moyen",
      value: data ? money(data.averageOrder) : "—",
      icon: BarChart3,
    },
    {
      label: "Taux de retour",
      value: data ? `${data.returnRate}%` : "—",
      icon: RotateCcw,
    },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold text-[#0052cc]">Rapports</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">
            Statistiques de vente
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Indicateurs réels basés sur vos commandes et retours.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold"
        >
          <option value={7}>7 derniers jours</option>
          <option value={30}>30 derniers jours</option>
          <option value={90}>90 derniers jours</option>
          <option value={365}>12 derniers mois</option>
        </select>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <Icon className="h-5 w-5 text-[#0052cc]" />
            <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-900">
          Produits les plus vendus
        </h2>
        <div className="mt-4 divide-y divide-slate-100">
          {data?.topProducts.length ? (
            data.topProducts.map((p, i) => (
              <div
                key={p.name}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-black text-[#0052cc]">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-800">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-500">{p.units} unité(s)</p>
                  </div>
                </div>
                <strong className="shrink-0 text-slate-900">
                  {money(p.revenue)}
                </strong>
              </div>
            ))
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">
              Aucune vente sur cette période.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
