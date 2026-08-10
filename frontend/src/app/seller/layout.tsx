"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  CirclePlus,
  Download,
  LogOut,
  MessageCircleQuestion,
  PackageCheck,
  RotateCcw,
  Star,
  Store,
  Users,
  WalletCards,
} from "lucide-react";

const links = [
  { href: "/seller", label: "Tableau de bord", icon: BarChart3 },
  { href: "/seller/analytics", label: "Statistiques", icon: BarChart3 },
  { href: "/seller/products", label: "Mes produits", icon: Boxes },
  { href: "/seller/products/new", label: "Ajouter", icon: CirclePlus },
  { href: "/seller/orders", label: "Commandes", icon: PackageCheck },
  { href: "/seller/returns", label: "Retours", icon: RotateCcw },
  {
    href: "/seller/questions",
    label: "Questions",
    icon: MessageCircleQuestion,
  },
  { href: "/seller/reviews", label: "Avis", icon: Star },
  { href: "/seller/notifications", label: "Notifications", icon: Bell },
  { href: "/seller/store", label: "Ma boutique", icon: Store },
  { href: "/seller/team", label: "Équipe", icon: Users },
  { href: "/seller/settlements", label: "Paiements", icon: WalletCards },
  { href: "/seller/exports", label: "Exports", icon: Download },
];

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const value = localStorage.getItem("user");
        const parsed = value ? JSON.parse(value) : null;
        if (!parsed) return router.replace("/login");
        if (!["SELLER", "ADMIN"].includes(parsed.role)) return router.replace("/");
        setUser(parsed);
      } catch { router.replace("/login"); }
    });
  }, [router]);
  if (!user)
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-slate-500">
        Chargement de l’espace vendeur…
      </div>
    );
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/");
    router.refresh();
  };
  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <div className="mx-auto max-w-[1280px] px-3 py-5 sm:px-5 lg:flex lg:gap-6 lg:py-8">
        <aside className="mb-5 lg:mb-0 lg:w-64 lg:shrink-0">
          <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_16px_45px_rgba(17,39,72,.1)] ring-1 ring-slate-200/60 lg:sticky lg:top-40">
            <div className="bg-gradient-to-br from-[#063d91] via-[#075bd8] to-[#09a7b9] p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-100">
                DjibTout Seller
              </p>
              <p className="mt-1 truncate text-lg font-extrabold">
                {user.name}
              </p>
            </div>
            <nav className="flex gap-1 overflow-x-auto p-2 lg:block">
              {links.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/seller"
                    ? pathname === href
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-blue-50 text-[#0052cc]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                );
              })}
              <button
                onClick={logout}
                className="flex w-full shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
            </nav>
          </div>
        </aside>
        <main className="min-w-0 flex-1 rounded-[22px] bg-white p-4 shadow-[0_14px_40px_rgba(17,39,72,.06)] ring-1 ring-slate-200/50 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
