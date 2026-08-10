"use client";
import { useEffect, useMemo, useState } from "react";
import { Package, Search, Truck } from "lucide-react";
import {
  fetchSellerFulfillments,
  SellerFulfillment,
  updateSellerFulfillment,
} from "@/lib/api";
const money = (n: number) =>
  new Intl.NumberFormat("fr-DJ", {
    style: "currency",
    currency: "DJF",
    maximumFractionDigits: 0,
  }).format(n);
const labels: Record<string, string> = {
  PENDING: "Paiement en attente",
  PROCESSING: "En préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};
export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerFulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [tracking, setTracking] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const load = () => {
    setLoading(true);
    fetchSellerFulfillments()
      .then((data) => {
        setOrders(data);
        setTracking(
          Object.fromEntries(
            data.map((o) => [o.fulfillmentId, o.trackingNumber || ""]),
          ),
        );
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { queueMicrotask(load); }, []);
  const visible = useMemo(
    () =>
      orders.filter(
        (o) =>
          (filter === "ALL" || o.status === filter) &&
          `#${o.orderId} ${o.items.map((i) => i.product.name).join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [orders, filter, query],
  );
  const update = async (o: SellerFulfillment, status: string) => {
    setBusy(o.fulfillmentId);
    try {
      await updateSellerFulfillment(
        o.fulfillmentId,
        status,
        tracking[o.fulfillmentId],
      );
      setOrders((v) =>
        v.map((x) =>
          x.fulfillmentId === o.fulfillmentId
            ? { ...x, status, trackingNumber: tracking[o.fulfillmentId] }
            : x,
        ),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Mise à jour impossible.");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-[#0052cc]">Exécution vendeur</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">
          Commandes
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Vous ne gérez ici que vos articles, même lorsqu’une commande contient
          plusieurs vendeurs.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Commande ou produit…"
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#0052cc]"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold"
          >
            <option value="ALL">Tous les statuts</option>
            {Object.entries(labels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Chargement des commandes…
          </div>
        ) : visible.length === 0 ? (
          <div className="grid place-items-center p-12 text-center">
            <Package className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-bold text-slate-800">
              Aucune commande trouvée
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((o) => (
              <article key={o.fulfillmentId} className="p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <div>
                    <p className="font-extrabold text-slate-900">
                      Commande #{o.orderId}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(o.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#0052cc]">
                      {labels[o.status] || o.status}
                    </span>
                    <p className="mt-2 font-black text-slate-950">
                      {money(o.subtotal)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {o.items.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="line-clamp-1 font-semibold text-slate-700">
                        {i.product.name}
                      </span>
                      <span className="ml-4 shrink-0 text-slate-500">
                        × {i.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                {!["PENDING", "CANCELLED", "DELIVERED"].includes(o.status) && (
                  <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_190px_auto]">
                    <input
                      value={tracking[o.fulfillmentId] || ""}
                      onChange={(e) =>
                        setTracking({
                          ...tracking,
                          [o.fulfillmentId]: e.target.value,
                        })
                      }
                      placeholder="Numéro de suivi (requis pour expédier)"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0052cc]"
                    />
                    <select
                      id={`status-${o.fulfillmentId}`}
                      defaultValue={o.status}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="PROCESSING">En préparation</option>
                      <option value="SHIPPED">Expédiée</option>
                      <option value="DELIVERED">Livrée</option>
                    </select>
                    <button
                      disabled={busy === o.fulfillmentId}
                      onClick={() => {
                        const el = document.getElementById(
                          `status-${o.fulfillmentId}`,
                        ) as HTMLSelectElement;
                        update(o, el.value);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0052cc] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      <Truck className="h-4 w-4" />
                      Mettre à jour
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
