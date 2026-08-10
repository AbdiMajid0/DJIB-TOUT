"use client";
import { useCallback, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  fetchSellerReturns,
  ReturnRequest,
  updateSellerReturn,
} from "@/lib/api";

const labels: Record<string, string> = {
  REQUESTED: "Demandé",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
  RECEIVED: "Reçu — remboursement à traiter",
  REFUNDED: "Remboursé",
};

export default function SellerReturnsPage() {
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setItems(await fetchSellerReturns());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, []);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  const act = async (id: number, status: string) => {
    try {
      await updateSellerReturn(id, status, responses[id]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible.");
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-[#0052cc]">Service après-vente</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">
          Retours clients
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Traitez uniquement les retours concernant vos propres articles.
        </p>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <RotateCcw className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-bold text-slate-700">
              Aucune demande de retour
            </p>
          </div>
        ) : (
          items.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#0052cc]">
                    Retour #{r.id}
                  </p>
                  <h2 className="mt-1 font-extrabold text-slate-900">
                    {r.orderItem.product.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Quantité : {r.quantity} · Client :{" "}
                    {r.buyer?.name || "Client"}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#0052cc]">
                    {labels[r.status]}
                  </span>
                  <p className="mt-2 font-black text-slate-900">
                    {r.refundAmount} FDJ
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                <p>
                  <strong>Motif :</strong> {r.reason}
                </p>
                {r.customerComment && (
                  <p className="mt-2 text-slate-600">{r.customerComment}</p>
                )}
              </div>
              {r.status === "REQUESTED" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <input
                    value={responses[r.id] || ""}
                    onChange={(e) =>
                      setResponses({ ...responses, [r.id]: e.target.value })
                    }
                    placeholder="Réponse au client (obligatoire en cas de refus)"
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
                  />
                  <button
                    onClick={() => act(r.id, "APPROVED")}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => act(r.id, "REJECTED")}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    Refuser
                  </button>
                </div>
              )}
              {r.status === "APPROVED" && (
                <button
                  onClick={() => act(r.id, "RECEIVED")}
                  className="mt-4 rounded-xl bg-[#0052cc] px-4 py-2.5 text-sm font-bold text-white"
                >
                  Confirmer la réception
                </button>
              )}
              {r.sellerResponse && (
                <p className="mt-3 text-sm text-slate-600">
                  <strong>Votre réponse :</strong> {r.sellerResponse}
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
