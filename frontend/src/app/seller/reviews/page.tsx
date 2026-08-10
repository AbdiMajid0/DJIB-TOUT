"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Send, Star } from "lucide-react";
import { fetchSellerReviews, respondSellerReview, Review } from "@/lib/api";
export default function SellerReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState("PENDING");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const load = useCallback(async () => {
    try {
      const data = await fetchSellerReviews();
      setItems(data);
      setResponses(
        Object.fromEntries(data.map((r) => [r.id, r.sellerResponse || ""])),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, []);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  const visible = useMemo(
    () =>
      items.filter(
        (r) =>
          filter === "ALL" ||
          (filter === "PENDING" ? !r.sellerResponse : !!r.sellerResponse),
      ),
    [items, filter],
  );
  const save = async (id: number) => {
    setBusy(id);
    try {
      await respondSellerReview(id, responses[id]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Réponse impossible.");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-[#0052cc]">Réputation boutique</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">
          Avis clients
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Répondez publiquement avec professionnalisme, sans modifier l’avis du
          client.
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {[
          ["PENDING", "Sans réponse"],
          ["ANSWERED", "Répondus"],
          ["ALL", "Tous"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${filter === v ? "bg-[#0052cc] text-white" : "border border-slate-300 bg-white text-slate-600"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="space-y-4">
        {visible.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white p-12">
            <Star className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-bold text-slate-700">
              Aucun avis dans cette catégorie
            </p>
          </div>
        ) : (
          visible.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div>
                  <p className="text-xs font-bold uppercase text-[#0052cc]">
                    {r.product?.name || "Produit"}
                  </p>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {r.comment}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {r.user?.name || "Client"} ·{" "}
                    {new Date(r.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${r.sellerResponse ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                >
                  {r.sellerResponse ? "Répondu" : "En attente"}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={responses[r.id] || ""}
                  onChange={(e) =>
                    setResponses({ ...responses, [r.id]: e.target.value })
                  }
                  placeholder="Réponse officielle de votre boutique…"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0052cc]"
                />
                <button
                  disabled={busy === r.id || !responses[r.id]?.trim()}
                  onClick={() => save(r.id)}
                  className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-[#0052cc] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {r.sellerResponse ? "Modifier" : "Répondre"}
                </button>
              </div>
              {r.sellerRespondedAt && (
                <p className="mt-2 text-xs text-slate-500">
                  Réponse mise à jour le{" "}
                  {new Date(r.sellerRespondedAt).toLocaleString("fr-FR")}
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
