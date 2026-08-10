"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  API_BASE_URL,
  AccountProfile,
  deleteAccount,
  fetchAccountProfile,
  updateAccountPreferences,
  updateAccountProfile,
} from "@/lib/api";
import {
  Bell,
  CheckCircle2,
  Download,
  Save,
  ShieldAlert,
  Trash2,
} from "lucide-react";
export default function AccountInfoPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AccountProfile | null>(null),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    fetchAccountProfile()
      .then((value) => {
        setProfile(value);
        setName(value.name);
        setPhone(value.phone || "");
      })
      .catch((error) => setMessage(error.message));
  }, []);
  if (!profile)
    return <div className="h-80 animate-pulse rounded-xl bg-slate-100" />;
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const value = await updateAccountProfile(name, phone);
    setProfile(value);
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: value.name,
        email: value.email,
        role: value.role,
      }),
    );
    setMessage("Informations enregistrées.");
  }
  async function preferences(
    orderNotifications: boolean,
    promotionNotifications: boolean,
  ) {
    const value = await updateAccountPreferences(
      orderNotifications,
      promotionNotifications,
    );
    setProfile(value);
  }
  async function remove() {
    if (!confirm("Supprimer définitivement votre compte DjibTout ?")) return;
    try {
      await deleteAccount(password);
      localStorage.clear();
      router.replace("/");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Suppression impossible",
      );
    }
  }
  async function download() {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/account/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      setMessage("Export impossible.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "djibtout-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="space-y-5">
      {message && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs font-bold text-[var(--primary)]">
          {message}
        </div>
      )}
      <form onSubmit={save} className="rounded-xl border bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black">Mes informations</h1>
            <p className="mt-1 text-xs text-slate-500">
              Gérez les informations utilisées par DjibTout.
            </p>
          </div>
          {profile.emailVerified && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
              <CheckCircle2 size={14} />
              Email vérifié
            </span>
          )}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold">
            Nom complet
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block h-11 w-full rounded-lg border px-3 font-normal"
            />
          </label>
          <label className="text-xs font-bold">
            Téléphone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block h-11 w-full rounded-lg border px-3 font-normal"
            />
          </label>
          <label className="text-xs font-bold md:col-span-2">
            Adresse email
            <input
              value={profile.email}
              disabled
              className="mt-1 block h-11 w-full rounded-lg border bg-slate-50 px-3 font-normal text-slate-500"
            />
          </label>
        </div>
        <button className="mt-5 flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-3 text-xs font-black text-white">
          <Save size={16} />
          Enregistrer
        </button>
      </form>
      <section className="rounded-xl border bg-white p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Bell size={19} className="text-[var(--primary)]" />
          Préférences de notification
        </h2>
        <div className="mt-5 divide-y">
          <Switch
            label="Suivi des commandes"
            description="Recevoir les changements de statut de vos commandes."
            checked={profile.orderNotifications}
            onChange={(checked) =>
              preferences(checked, profile.promotionNotifications)
            }
          />
          <Switch
            label="Promotions DjibTout"
            description="Recevoir les campagnes et offres commerciales."
            checked={profile.promotionNotifications}
            onChange={(checked) =>
              preferences(profile.orderNotifications, checked)
            }
          />
        </div>
      </section>
      <section className="rounded-xl border bg-white p-5 sm:p-6">
        <h2 className="text-lg font-black">Mes données personnelles</h2>
        <button
          onClick={download}
          className="mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs font-bold"
        >
          <Download size={16} />
          Télécharger mes données
        </button>
      </section>
      <section className="rounded-xl border border-red-200 bg-white p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-black text-red-700">
          <ShieldAlert size={19} />
          Zone sensible
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          La suppression anonymise votre profil et rend votre connexion
          impossible. Les commandes sont conservées pour les obligations
          transactionnelles.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 h-11 w-full max-w-sm rounded-lg border px-3 text-sm"
          placeholder="Confirmez votre mot de passe"
        />
        <button
          onClick={remove}
          className="mt-3 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-xs font-black text-white"
        >
          <Trash2 size={16} />
          Supprimer mon compte
        </button>
      </section>
    </div>
  );
}
function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
      <span>
        <strong className="block text-sm">{label}</strong>
        <small className="text-slate-500">{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--primary)]"
      />
    </label>
  );
}
