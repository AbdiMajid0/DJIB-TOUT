"use client";
import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import {
  Address,
  createAddress,
  deleteAddress,
  fetchAddresses,
} from "@/lib/api";
export default function AddressesPage() {
  const [items, setItems] = useState<Address[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    label: "Maison",
    fullAddress: "",
    city: "Djibouti",
    default: false,
  });
  const [error, setError] = useState("");
  const load = () =>
    fetchAddresses()
      .then(setItems)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createAddress(form);
      setOpen(false);
      setForm({
        label: "Maison",
        fullAddress: "",
        city: "Djibouti",
        default: false,
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Mes adresses</h1>
        <button
          onClick={() => setOpen(!open)}
          className="bg-[#0052cc] text-white px-4 py-2 rounded flex gap-2"
        >
          <Plus />
          Ajouter
        </button>
      </div>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {open && (
        <form onSubmit={save} className="grid gap-3 mt-5 border rounded p-4">
          <input
            className="border p-3 rounded"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Libellé"
            required
          />
          <textarea
            className="border p-3 rounded"
            value={form.fullAddress}
            onChange={(e) => setForm({ ...form, fullAddress: e.target.value })}
            placeholder="Adresse complète"
            required
          />
          <input
            className="border p-3 rounded"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Ville"
            required
          />
          <label>
            <input
              type="checkbox"
              checked={form.default}
              onChange={(e) => setForm({ ...form, default: e.target.checked })}
            />{" "}
            Adresse par défaut
          </label>
          <button className="bg-[#0052cc] text-white p-3 rounded">
            Enregistrer
          </button>
        </form>
      )}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {items.map((a) => (
          <article
            key={a.id}
            className={`border-2 rounded-xl p-4 ${a.default ? "border-[#0052cc]" : "border-gray-200"}`}
          >
            <MapPin className="text-[#0052cc]" />
            <h2 className="font-bold mt-2">{a.label}</h2>
            <p className="text-sm text-gray-600">
              {a.fullAddress}, {a.city}
            </p>
            {a.default && (
              <span className="text-xs text-[#0052cc]">Adresse par défaut</span>
            )}
            <button
              onClick={async () => {
                await deleteAddress(a.id);
                load();
              }}
              className="text-red-600 mt-3 flex gap-1"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
