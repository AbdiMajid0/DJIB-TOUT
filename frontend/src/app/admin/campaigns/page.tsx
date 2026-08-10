"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest, Campaign } from "@/lib/api";

type CampaignForm = Omit<Campaign, "id">;
const empty: CampaignForm = { title: "", subtitle: "", badge: "NOUVEAU", linkUrl: "/search", imageUrl: "", gradient: "from-[#063b8f] via-[#0052cc] to-[#2c7ef8]", displayOrder: 0, active: true };
const fieldLabels: Record<string, string> = { title: "Titre", subtitle: "Sous-titre", badge: "Badge", linkUrl: "Lien", imageUrl: "Image (optionnelle)", gradient: "Classes du dégradé" };

export default function CampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [form, setForm] = useState<CampaignForm>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () => apiRequest<Campaign[]>("/admin/campaigns").then(setItems).catch((reason) => setError(reason instanceof Error ? reason.message : "Chargement impossible"));
  useEffect(() => { void load(); }, []);

  async function save(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      await apiRequest(`/admin/campaigns${editingId ? `/${editingId}` : ""}`, { method: editingId ? "PUT" : "POST", body: JSON.stringify(form) });
      setForm(empty); setEditingId(null); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Enregistrement impossible"); }
  }

  function edit(item: Campaign) { const { id, ...values } = item; setEditingId(id); setForm(values); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function remove(id: number) { if (!window.confirm("Supprimer cette campagne ?")) return; await apiRequest(`/admin/campaigns/${id}`, { method: "DELETE" }); await load(); }

  return <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
    <form onSubmit={save} className="h-fit rounded-xl border bg-white p-5">
      <h1 className="text-xl font-black">{editingId ? "Modifier la campagne" : "Nouvelle campagne"}</h1>
      <p className="mt-1 text-xs text-slate-500">Ces données alimentent directement le hero et les blocs promotionnels de l’accueil.</p>
      {["title", "subtitle", "badge", "linkUrl", "imageUrl", "gradient"].map((key) => <label key={key} className="mt-4 block text-xs font-bold text-slate-600">{fieldLabels[key]}<input required={key !== "imageUrl"} value={String(form[key as keyof CampaignForm] ?? "")} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 h-10 w-full rounded-lg border px-3 font-normal outline-none focus:border-blue-600" /></label>)}
      <label className="mt-4 block text-xs font-bold text-slate-600">Ordre<input type="number" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: Number(event.target.value) })} className="mt-1 h-10 w-full rounded-lg border px-3" /></label>
      <label className="mt-4 flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Campagne active</label>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex gap-2"><button className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-bold text-white">{editingId ? "Enregistrer" : "Créer"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(empty); }} className="rounded-lg border px-4 text-sm font-bold">Annuler</button>}</div>
    </form>
    <section><h2 className="mb-4 text-2xl font-black">Campagnes publiées</h2><div className="grid gap-4">{items.sort((a, b) => a.displayOrder - b.displayOrder).map((item) => <article key={item.id} className={`overflow-hidden rounded-xl border bg-white ${item.active ? "" : "opacity-60"}`}><div className={`bg-gradient-to-r ${item.gradient} p-5 text-white`}><span className="rounded bg-white/20 px-2 py-1 text-xs font-black">{item.badge}</span><h3 className="mt-3 text-xl font-black">{item.title}</h3><p className="mt-1 text-sm text-white/80">{item.subtitle}</p></div><div className="flex items-center justify-between p-4 text-xs"><span>Ordre {item.displayOrder} · {item.active ? "Active" : "Inactive"}</span><div className="flex gap-2"><button onClick={() => edit(item)} className="rounded border px-3 py-2 font-bold">Modifier</button><button onClick={() => void remove(item.id)} className="rounded bg-red-600 px-3 py-2 font-bold text-white">Supprimer</button></div></div></article>)}</div></section>
  </div>;
}
