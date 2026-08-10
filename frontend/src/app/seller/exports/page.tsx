"use client";
import { Download, FileSpreadsheet } from "lucide-react";
import { downloadSellerExport } from "@/lib/api";
const exports = [
  {
    label: "Commandes",
    description: "Statuts, suivi, produits et sous-totaux.",
    path: "/seller/orders/export",
    file: "commandes-djibtout.csv",
  },
  {
    label: "Retours",
    description: "Demandes, motifs, statuts et remboursements.",
    path: "/seller/returns/export",
    file: "retours-djibtout.csv",
  },
  {
    label: "Statistiques (30 jours)",
    description: "Unités vendues et chiffre d’affaires par produit.",
    path: "/seller/analytics/export?days=30",
    file: "statistiques-djibtout.csv",
  },
  {
    label: "Règlements",
    description: "Montants bruts, commissions, nets et paiements.",
    path: "/seller/settlements/export",
    file: "reglements-djibtout.csv",
  },
];
export default function ExportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-[#0052cc]">Données vendeur</p>
        <h1 className="text-2xl font-extrabold">Exports</h1>
        <p className="mt-2 text-sm text-slate-500">
          Téléchargez uniquement les données de votre boutique.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {exports.map((x) => (
          <article key={x.path} className="rounded-2xl border bg-white p-5">
            <FileSpreadsheet className="h-6 w-6 text-[#0052cc]" />
            <h2 className="mt-4 font-extrabold">{x.label}</h2>
            <p className="mt-1 text-sm text-slate-500">{x.description}</p>
            <button
              onClick={() => downloadSellerExport(x.path, x.file)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0052cc] px-4 py-2.5 text-sm font-bold text-white"
            >
              <Download className="h-4 w-4" />
              Télécharger CSV
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
