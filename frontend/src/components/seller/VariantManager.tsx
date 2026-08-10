"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  createProductVariant,
  deleteProductVariant,
  fetchProductVariants,
  ProductVariant,
  updateProductVariant,
} from "@/lib/api";
const blank = {
  sku: "",
  price: "",
  stockQuantity: "",
  active: true,
  color: "",
  size: "",
  capacity: "",
  images: "",
};
export default function VariantManager({ productId }: { productId: number }) {
  const [items, setItems] = useState<ProductVariant[]>([]),
    [form, setForm] = useState(blank),
    [editing, setEditing] = useState<number | null>(null),
    [message, setMessage] = useState("");
  const load = useCallback(() =>
    fetchProductVariants(productId)
      .then(setItems)
      .catch((e) => setMessage(e.message)), [productId]);
  useEffect(() => {
    void load();
  }, [load]);
  const reset = () => {
    setForm(blank);
    setEditing(null);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const attributes = Object.fromEntries(
      [
        ["Couleur", form.color],
        ["Taille", form.size],
        ["Capacité", form.capacity],
      ].filter(([, v]) => v),
    );
    const data = {
      sku: form.sku,
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      active: form.active,
      attributes,
      images: form.images
        .split("\n")
        .map((v) => v.trim())
        .filter((v) => v.startsWith("http")),
    };
    try {
      if (editing) await updateProductVariant(productId, editing, data);
      else await createProductVariant(productId, data);
      reset();
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
  };
  const edit = (v: ProductVariant) => {
    setEditing(v.id);
    setForm({
      sku: v.sku,
      price: String(v.price),
      stockQuantity: String(v.stockQuantity),
      active: v.active,
      color: v.attributes.Couleur || "",
      size: v.attributes.Taille || "",
      capacity: v.attributes["Capacité"] || "",
      images: (v.images || []).join("\n"),
    });
  };
  return (
    <section className="rounded-2xl border bg-white p-5">
      <h2 className="text-lg font-extrabold">Variantes, SKU et médias</h2>
      <form
        onSubmit={submit}
        className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          required
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
          placeholder="SKU unique"
          className="rounded-lg border px-3 py-2"
        />
        <input
          required
          min="0"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="Prix FDJ"
          className="rounded-lg border px-3 py-2"
        />
        <input
          required
          min="0"
          type="number"
          value={form.stockQuantity}
          onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
          placeholder="Stock"
          className="rounded-lg border px-3 py-2"
        />
        <label className="flex items-center gap-2 rounded-lg border bg-white px-3">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Active
        </label>
        <input
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
          placeholder="Couleur"
          className="rounded-lg border px-3 py-2"
        />
        <input
          value={form.size}
          onChange={(e) => setForm({ ...form, size: e.target.value })}
          placeholder="Taille"
          className="rounded-lg border px-3 py-2"
        />
        <input
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          placeholder="Capacité"
          className="rounded-lg border px-3 py-2"
        />
        <textarea
          value={form.images}
          onChange={(e) => setForm({ ...form, images: e.target.value })}
          placeholder="URLs d’images, une par ligne"
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0052cc] px-3 py-2 font-bold text-white">
          {editing ? (
            <Save className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {editing ? "Modifier" : "Ajouter"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border px-3"
          >
            Annuler
          </button>
        )}
      </form>
      {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
      <div className="mt-4 space-y-2">
        {items.map((v) => (
          <div
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
          >
            <div>
              <b>{v.sku}</b>
              <p className="text-xs text-slate-500">
                {Object.values(v.attributes).join(" · ") || "Sans attribut"} ·{" "}
                {v.stockQuantity} en stock · {(v.images || []).length} image(s)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => edit(v)}
                className="text-sm font-bold text-[#0052cc]"
              >
                Modifier
              </button>
              <button
                onClick={async () => {
                  if (confirm("Supprimer cette variante ?")) {
                    await deleteProductVariant(productId, v.id);
                    load();
                  }
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
