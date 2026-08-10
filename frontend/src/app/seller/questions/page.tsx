"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircleQuestion, Send } from "lucide-react";
import {
  answerSellerQuestion,
  fetchSellerQuestions,
  ProductQuestion,
} from "@/lib/api";
export default function SellerQuestionsPage() {
  const [items, setItems] = useState<ProductQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState("PENDING");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const load = useCallback(async () => {
    try {
      const data = await fetchSellerQuestions();
      setItems(data);
      setAnswers(Object.fromEntries(data.map((q) => [q.id, q.answer || ""])));
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
        (q) =>
          filter === "ALL" || (filter === "PENDING" ? !q.answer : !!q.answer),
      ),
    [items, filter],
  );
  const save = async (id: number) => {
    setBusy(id);
    setError("");
    try {
      await answerSellerQuestion(id, answers[id]);
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
        <p className="text-sm font-bold text-[#0052cc]">Relation client</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">
          Questions produits
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Répondez précisément aux questions concernant votre catalogue.
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {[
          ["PENDING", "Sans réponse"],
          ["ANSWERED", "Répondues"],
          ["ALL", "Toutes"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${filter === v ? "bg-[#0052cc] text-white" : "border border-slate-300 bg-white text-slate-600"}`}
          >
            {l} (
            {v === "ALL"
              ? items.length
              : v === "PENDING"
                ? items.filter((q) => !q.answer).length
                : items.filter((q) => q.answer).length}
            )
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
          <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <MessageCircleQuestion className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-bold text-slate-700">
              Aucune question dans cette catégorie
            </p>
          </div>
        ) : (
          visible.map((q) => (
            <article
              key={q.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#0052cc]">
                    {q.product?.name || "Produit"}
                  </p>
                  <h2 className="mt-2 font-extrabold text-slate-900">
                    {q.question}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Par {q.user?.name || "Client"} ·{" "}
                    {new Date(q.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${q.answer ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                >
                  {q.answer ? "Répondue" : "En attente"}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [q.id]: e.target.value })
                  }
                  placeholder="Rédigez une réponse utile et factuelle…"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0052cc]"
                />
                <button
                  disabled={busy === q.id || !answers[q.id]?.trim()}
                  onClick={() => save(q.id)}
                  className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-[#0052cc] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {q.answer ? "Modifier" : "Répondre"}
                </button>
              </div>
              {q.answeredAt && (
                <p className="mt-2 text-xs text-slate-500">
                  Dernière réponse :{" "}
                  {new Date(q.answeredAt).toLocaleString("fr-FR")} par{" "}
                  {q.answeredBy?.name || "le vendeur"}
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
