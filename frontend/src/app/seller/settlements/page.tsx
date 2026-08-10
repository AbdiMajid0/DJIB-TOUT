"use client";
import { useEffect, useState } from "react";
import { WalletCards } from "lucide-react";
import { fetchSellerSettlements, SellerSettlementSummary } from "@/lib/api";
const money = (n: number) =>
  new Intl.NumberFormat("fr-DJ", {
    style: "currency",
    currency: "DJF",
    maximumFractionDigits: 0,
  }).format(n);
export default function SettlementsPage() {
  const [data, setData] = useState<SellerSettlementSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchSellerSettlements()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-[#0052cc]">Finance vendeur</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">
          Commissions et paiements
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Commission plateforme : {data?.commissionRate ?? 10}% sur les
          commandes livrées.
        </p>
      </div>
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-950 p-6 text-white">
          <WalletCards className="h-6 w-6 text-blue-300" />
          <p className="mt-4 text-sm font-semibold text-slate-300">
            Disponible au versement
          </p>
          <p className="mt-1 text-3xl font-black">
            {data ? money(data.available) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-slate-500">Déjà versé</p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {data ? money(data.paid) : "—"}
          </p>
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="p-5 text-lg font-extrabold">
          Historique des règlements
        </h2>
        <div className="divide-y divide-slate-100">
          {data?.settlements.length ? (
            data.settlements.map((s) => (
              <div
                key={s.id}
                className="grid gap-2 p-5 sm:grid-cols-[1fr_auto_auto_auto]"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    Commande #{s.fulfillment.order.id}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <p className="text-sm">
                  Brut <strong>{money(s.grossAmount)}</strong>
                </p>
                <p className="text-sm text-red-600">
                  Commission −{money(s.commissionAmount)}
                </p>
                <div className="sm:text-right">
                  <p className="font-black text-slate-900">
                    {money(s.netAmount)}
                  </p>
                  <span
                    className={`text-xs font-bold ${s.status === "PAID" ? "text-emerald-600" : "text-amber-600"}`}
                  >
                    {s.status === "PAID" ? "Versé" : "Disponible"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="p-10 text-center text-sm text-slate-500">
              Aucun règlement disponible : les règlements sont générés après
              livraison.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
