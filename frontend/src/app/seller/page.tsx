"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Boxes,
  CirclePlus,
  MessageCircleQuestion,
  PackageCheck,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { fetchSellerDashboard, SellerDashboard } from "@/lib/api";
const money = (n: number) =>
  new Intl.NumberFormat("fr-DJ", {
    style: "currency",
    currency: "DJF",
    maximumFractionDigits: 0,
  }).format(n);
export default function SellerDashboardPage() {
  const [data, setData] = useState<SellerDashboard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchSellerDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  const cards = [
    {
      label: "Chiffre d’affaires",
      value: data ? money(data.revenue) : "—",
      icon: WalletCards,
    },
    { label: "Commandes", value: data?.orders ?? "—", icon: PackageCheck },
    { label: "Produits actifs", value: data?.products ?? "—", icon: Boxes },
    {
      label: "Stock faible",
      value: data?.lowStock ?? "—",
      icon: TriangleAlert,
    },
    {
      label: "Questions en attente",
      value: data?.pendingQuestions ?? "—",
      icon: MessageCircleQuestion,
    },
  ];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-[#0052cc]">Vue d’ensemble</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">
          Pilotez votre activité
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Vos ventes, commandes et alertes au même endroit.
        </p>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-3 text-2xl font-black text-slate-950">
                  {value}
                </p>
              </div>
              <span className="rounded-xl bg-blue-50 p-3 text-[#0052cc]">
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">
            Actions rapides
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Quick
              href="/seller/products/new"
              icon={<CirclePlus />}
              title="Ajouter un produit"
              text="Publier une nouvelle offre."
            />
            <Quick
              href="/seller/orders"
              icon={<PackageCheck />}
              title="Préparer les commandes"
              text="Gérer les expéditions."
            />
            <Quick
              href="/seller/questions"
              icon={<MessageCircleQuestion />}
              title="Répondre aux clients"
              text="Traiter les questions produit."
            />
          </div>
        </section>
        <section className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
          <p className="text-sm font-bold text-blue-300">Santé du catalogue</p>
          <p className="mt-3 text-4xl font-black">{data?.outOfStock ?? "—"}</p>
          <p className="mt-1 text-sm text-slate-300">produit(s) en rupture</p>
          <Link
            href="/seller/products"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold"
          >
            Gérer le stock <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
function Quick({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-blue-100 bg-blue-50 p-4 [&_svg]:h-6 [&_svg]:w-6 [&_svg]:text-[#0052cc]"
    >
      <span>{icon}</span>
      <p className="mt-3 font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{text}</p>
      <ArrowRight className="mt-4 transition group-hover:translate-x-1" />
    </Link>
  );
}
