"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Package,
  User,
  Heart,
  LogOut,
  ChevronRight,
  MessageSquare,
  CreditCard,
  Star,
  List,
  Tag,
  MapPin,
} from "lucide-react";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      const storedUser = localStorage.getItem("user");
      if (!storedUser) router.replace("/login");
      else setUser(JSON.parse(storedUser));
    });
  }, [router]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        Chargement...
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/");
  };

  const navItems = [
    { name: "Mes Commandes", href: "/account/orders", icon: Package },
    {
      name: "Mes Questions et Demandes",
      href: "/account/questions",
      icon: MessageSquare,
    },
    { name: "Djibpay", href: "/account/djibpay", icon: CreditCard },
    { name: "Mes Informations", href: "/account", icon: User },
    { name: "Mes Adresses", href: "/account/addresses", icon: MapPin },
    { name: "Mes Évaluations", href: "/account/reviews", icon: Star },
    { name: "Mes Favoris", href: "/account/favorites", icon: Heart },
    { name: "Toutes mes listes", href: "/account/lists", icon: List },
    { name: "Mes Coupons", href: "/account/coupons", icon: Tag },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8fb] py-5 sm:py-10">
      <div className="mx-auto max-w-[1280px] px-4">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-6 flex items-center">
          <Link href="/" className="hover:text-[#0052cc]">
            Accueil
          </Link>
          <ChevronRight className="h-3 w-3 mx-2" />
          <span className="font-bold text-gray-800">Mon Compte</span>
        </div>

        <div className="flex flex-col gap-5 md:flex-row md:gap-7">
          {/* Sidebar */}
          <div className="w-full min-w-0 md:w-64 md:flex-shrink-0">
            <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_14px_40px_rgba(17,39,72,.08)] ring-1 ring-slate-200/60 md:sticky md:top-40">
              <div className="bg-gradient-to-br from-[#075bd8] to-[#2782ed] p-5 text-white">
                <p className="text-xs font-semibold text-blue-100">Bienvenue,</p>
                <p className="mt-1 truncate text-lg font-black">{user.name}</p>
              </div>
              <div className="flex snap-x overflow-x-auto py-2 [scrollbar-width:none] md:flex-col md:overflow-visible">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex min-w-max snap-start items-center px-3 py-2.5 text-xs font-medium transition-colors md:w-full md:px-4 md:py-3 md:text-sm ${
                        isActive
                          ? "bg-blue-50 text-[#0052cc] md:rounded-xl"
                          : "text-gray-600 hover:bg-slate-50 hover:text-[#0052cc] md:rounded-xl"
                      }`}
                    >
                      <Icon
                        className={`mr-2 h-4 w-4 md:mr-3 md:h-5 md:w-5 ${isActive ? "text-[#0052cc]" : "text-gray-400"}`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="flex min-w-max items-center border-l border-gray-100 px-3 py-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600 md:mt-2 md:w-full md:border-l-0 md:border-t md:px-4 md:py-3 md:text-sm"
                >
                  <LogOut className="h-5 w-5 mr-3 text-gray-400 group-hover:text-red-600" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="min-w-0 flex-1 rounded-[22px] bg-white p-4 shadow-[0_14px_40px_rgba(17,39,72,.06)] ring-1 ring-slate-200/50 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
