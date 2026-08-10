"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PackageOpen, RotateCcw } from "lucide-react";
import {
  createReturnRequest,
  fetchMyOrders,
  fetchMyReturns,
  Order,
  ReturnRequest,
} from "@/lib/api";
const labels: Record<string, string> = {
  PENDING: "En attente",
  PROCESSING: "En préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REQUESTED: "Demandé",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
  RECEIVED: "Reçu",
  REFUNDED: "Remboursé",
};
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [selected, setSelected] = useState<{
    orderId: number;
    itemId: number;
    max: number;
    name: string;
  } | null>(null);
  const [form, setForm] = useState({ quantity: 1, reason: "", comment: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const [o, r] = await Promise.all([fetchMyOrders(), fetchMyReturns()]);
      setOrders(o);
      setReturns(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    queueMicrotask(load);
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      await createReturnRequest({
        orderId: selected.orderId,
        orderItemId: selected.itemId,
        quantity: form.quantity,
        reason: form.reason,
        comment: form.comment,
      });
      setSelected(null);
      setForm({ quantity: 1, reason: "", comment: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demande impossible.");
    }
  };
  if (loading)
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">
        Chargement de vos commandes…
      </div>
    );
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-950">
          Mes commandes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Suivez vos achats et demandez un retour après livraison.
        </p>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
          <PackageOpen className="h-12 w-12 text-slate-300" />
          <h2 className="mt-4 font-extrabold text-slate-800">
            Vous n’avez pas encore passé de commande
          </h2>
          <Link
            href="/"
            className="mt-5 rounded-xl bg-[#0052cc] px-6 py-3 text-sm font-bold text-white"
          >
            Commencer mes achats
          </Link>
        </div>
      ) : (
        orders.map((order) => (
          <article
            key={order.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <header className="flex flex-col justify-between gap-2 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row">
              <div>
                <p className="font-extrabold text-slate-900">
                  Commande #{order.id}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(order.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="sm:text-right">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#0052cc]">
                  {labels[order.status] || order.status}
                </span>
                <p className="mt-1 font-black text-slate-950">
                  {order.totalAmount} FDJ
                </p>
              </div>
            </header>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => {
                const existing = returns.find(
                  (r) => r.orderItem.id === item.id,
                );
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {item.product.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Quantité {item.quantity} · {item.price} FDJ/unité
                      </p>
                    </div>
                    {existing ? (
                      <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                        Retour : {labels[existing.status]}
                      </span>
                    ) : (
                      order.status === "DELIVERED" && (
                        <button
                          onClick={() =>
                            setSelected({
                              orderId: order.id,
                              itemId: item.id,
                              max: item.quantity,
                              name: item.product.name,
                            })
                          }
                          className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#0052cc] px-4 py-2 text-sm font-bold text-[#0052cc]"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Demander un retour
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        ))
      )}
      {selected && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4"
          onMouseDown={() => setSelected(null)}
        >
          <form
            onSubmit={submit}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-extrabold text-slate-950">
              Retourner {selected.name}
            </h2>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold">
                Quantité
                <input
                  required
                  min={1}
                  max={selected.max}
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
              <label className="block text-sm font-semibold">
                Motif
                <input
                  required
                  maxLength={120}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Produit défectueux, mauvaise taille…"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
              <label className="block text-sm font-semibold">
                Commentaire
                <textarea
                  maxLength={1000}
                  rows={4}
                  value={form.comment}
                  onChange={(e) =>
                    setForm({ ...form, comment: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold"
              >
                Annuler
              </button>
              <button className="rounded-xl bg-[#0052cc] px-5 py-2.5 text-sm font-bold text-white">
                Envoyer la demande
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
