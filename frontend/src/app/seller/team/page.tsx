"use client";
import { useEffect, useState } from "react";
import { Trash2, Users } from "lucide-react";
import {
  fetchSellerStaff,
  inviteSellerStaff,
  removeSellerStaff,
  SellerStaff,
} from "@/lib/api";
const labels: Record<SellerStaff["staffRole"], string> = {
  STORE_MANAGER: "Responsable boutique",
  CATALOG_MANAGER: "Catalogue",
  ORDER_MANAGER: "Commandes",
  SUPPORT: "Support client",
};
export default function SellerTeamPage() {
  const [items, setItems] = useState<SellerStaff[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SellerStaff["staffRole"]>("CATALOG_MANAGER");
  const [error, setError] = useState("");
  const load = () =>
    fetchSellerStaff()
      .then(setItems)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteSellerStaff(email, role);
      setEmail("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invitation impossible.");
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-[#0052cc]">Organisation</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">
          Équipe de boutique
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Ajoutez des comptes DjibTout existants et attribuez-leur un rôle
          opérationnel.
        </p>
      </div>
      <form
        onSubmit={invite}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_210px_auto]"
      >
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="collaborateur@exemple.com"
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as SellerStaff["staffRole"])}
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold"
        >
          {Object.entries(labels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button className="rounded-xl bg-[#0052cc] px-5 py-3 text-sm font-bold text-white">
          Ajouter
        </button>
      </form>
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <article
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-[#0052cc]">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-extrabold text-slate-900">
                    {item.user.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {item.user.email} · {labels[item.staffRole]}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (confirm("Retirer cet employé ?")) {
                    await removeSellerStaff(item.id);
                    load();
                  }
                }}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-slate-500">
            Aucun employé ajouté.
          </div>
        )}
      </div>
    </div>
  );
}
