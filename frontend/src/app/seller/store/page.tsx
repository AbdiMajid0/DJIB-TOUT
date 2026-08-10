"use client";
import { useEffect, useState } from "react";
import { BadgeCheck, Save, Upload } from "lucide-react";
import { fetchSellerStore, updateSellerStore, uploadMedia } from "@/lib/api";
const empty = {
  name: "",
  description: "",
  logoUrl: "",
  bannerUrl: "",
  policies: "",
  businessType: "INDIVIDUAL",
  phone: "",
  businessAddress: "",
  registrationNumber: "",
  identityDocumentUrl: "",
  businessDocumentUrl: "",
  termsAccepted: false,
  onboardingSubmitted: false,
  validated: false,
};
export default function StorePage() {
  const [form, setForm] = useState(empty),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    fetchSellerStore()
      .then((s) => setForm({ ...empty, ...s }))
      .catch((e) => setMessage(e.message));
  }, []);
  const media = async (
    key: "identityDocumentUrl" | "businessDocumentUrl",
    file?: File,
  ) => {
    if (!file) return;
    try {
      const url = await uploadMedia(file);
      setForm((v) => ({ ...v, [key]: url }));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Envoi impossible");
    }
  };
  const save = async (submit = false) => {
    setSaving(true);
    try {
      const value = await updateSellerStore({
        ...form,
        submitOnboarding: submit,
      });
      setForm({ ...empty, ...value });
      setMessage(
        submit && value.onboardingSubmitted
          ? "Dossier envoyé à l’administration."
          : "Boutique enregistrée.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };
  const field = (key: keyof typeof empty, label: string, required = false) => (
    <label className="text-sm font-semibold">
      {label}
      {required && " *"}
      <input
        required={required}
        value={String(form[key] || "")}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-2 w-full rounded-xl border px-3 py-3"
      />
    </label>
  );
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#0052cc]">Onboarding vendeur</p>
          <h1 className="text-2xl font-extrabold">
            Ma boutique et mon dossier
          </h1>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
          <BadgeCheck className="mr-1 inline h-4 w-4" />
          {form.validated
            ? "Validée"
            : form.onboardingSubmitted
              ? "Dossier envoyé"
              : "À compléter"}
        </span>
      </header>
      <section className="grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-2">
        <label className="text-sm font-semibold">
          Type d’activité
          <select
            value={form.businessType}
            onChange={(e) => setForm({ ...form, businessType: e.target.value })}
            className="mt-2 w-full rounded-xl border px-3 py-3"
          >
            <option value="INDIVIDUAL">Individuel</option>
            <option value="COMPANY">Entreprise</option>
          </select>
        </label>
        {field("name", "Nom de la boutique", true)}
        {field("phone", "Téléphone professionnel", true)}
        {field("businessAddress", "Adresse professionnelle", true)}
        {field("registrationNumber", "Numéro d’immatriculation")}
        {field("logoUrl", "URL du logo")}
        {field("bannerUrl", "URL de la bannière")}
        <label className="md:col-span-2 text-sm font-semibold">
          Description
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-2 w-full rounded-xl border px-3 py-3"
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Politiques de vente
          <textarea
            rows={3}
            value={form.policies}
            onChange={(e) => setForm({ ...form, policies: e.target.value })}
            className="mt-2 w-full rounded-xl border px-3 py-3"
          />
        </label>
      </section>
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-extrabold">Documents de vérification</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(
            [
              ["identityDocumentUrl", "Pièce d’identité"],
              ["businessDocumentUrl", "Document d’entreprise"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="cursor-pointer rounded-xl border-2 border-dashed p-5 text-center text-sm font-bold"
            >
              <Upload className="mx-auto mb-2 h-5 w-5" />
              {form[key] ? `${label} ajouté` : label}
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => media(key, e.target.files?.[0])}
              />
            </label>
          ))}
        </div>
        <label className="mt-5 flex gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.termsAccepted}
            onChange={(e) =>
              setForm({ ...form, termsAccepted: e.target.checked })
            }
          />
          J’accepte les conditions vendeurs et certifie les informations
          fournies.
        </label>
      </section>
      {message && (
        <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
          {message}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <button
          disabled={saving}
          onClick={() => save()}
          className="rounded-xl border px-5 py-3 font-bold"
        >
          <Save className="mr-2 inline h-4 w-4" />
          Enregistrer
        </button>
        <button
          disabled={
            saving ||
            !form.termsAccepted ||
            !form.phone ||
            !form.businessAddress ||
            !form.identityDocumentUrl
          }
          onClick={() => save(true)}
          className="rounded-xl bg-[#0052cc] px-5 py-3 font-bold text-white disabled:opacity-40"
        >
          Envoyer le dossier
        </button>
      </div>
    </div>
  );
}
