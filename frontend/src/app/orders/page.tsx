"use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Search } from "lucide-react";
import { cancelOrder } from "@/lib/api";

interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    imageUrl: string;
    price: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/account");
        return;
      }

      const res = await fetch("http://localhost:8082/api/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Impossible de récupérer les commandes.");

      const data = await res.json();
      setOrders(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(fetchOrders);
  }, [fetchOrders]);

  const handleCancel = async (orderId: number) => {
    if (!window.confirm("Voulez-vous vraiment annuler cette commande ?"))
      return;
    try {
      await cancelOrder(orderId);
      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o)),
      );
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Erreur lors de l’annulation.",
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
            En attente
          </span>
        );
      case "PROCESSING":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
            En préparation
          </span>
        );
      case "SHIPPED":
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
            Expédiée
          </span>
        );
      case "DELIVERED":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
            Livrée
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
            Annulée
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Chargement...
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 h-[80px] flex items-center">
          <Link
            href="/"
            className="text-[32px] font-black text-[#0052cc] tracking-tighter flex items-center"
          >
            djibtout<span className="text-gray-900 ml-1 text-4xl">.</span>
          </Link>
          <div className="ml-8 font-bold text-gray-800 text-lg">
            Mes Commandes
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-blue-50">
              <h3 className="font-bold text-[#0052cc]">Mon Compte</h3>
            </div>
            <div className="p-2">
              <Link
                href="/orders"
                className="block px-4 py-3 bg-gray-50 text-[#0052cc] font-bold rounded-xl"
              >
                Mes Commandes
              </Link>
              <Link
                href="#"
                className="block px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-[#0052cc] font-medium rounded-xl transition-colors"
              >
                Mes Évaluations
              </Link>
              <Link
                href="#"
                className="block px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-[#0052cc] font-medium rounded-xl transition-colors"
              >
                Mes Adresses
              </Link>
              <Link
                href="#"
                className="block px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-[#0052cc] font-medium rounded-xl transition-colors"
              >
                Informations du compte
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6 flex items-center justify-between">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une commande par produit ou numéro"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0052cc]"
              />
            </div>
          </div>

          {error && <div className="text-red-500 font-bold mb-4">{error}</div>}

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Vous n’avez passé aucune commande
              </h2>
              <p className="text-gray-500 mb-6">
                Découvrez nos produits et profitez des meilleures offres.
              </p>
              <Link href="/">
                <button className="bg-[#0052cc] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#003d99] transition-colors">
                  Commencer mes achats
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center text-sm">
                    <div className="flex gap-8">
                      <div>
                        <span className="block text-gray-500 font-medium">
                          Date de commande
                        </span>
                        <span className="font-bold text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString(
                            "fr-FR",
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-500 font-medium">
                          Total
                        </span>
                        <span className="font-bold text-gray-900">
                          {order.totalAmount.toLocaleString("fr-DJ")} FDJ
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-500 font-medium">
                          N° de Commande
                        </span>
                        <span className="font-bold text-gray-900">
                          #{order.id}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(order.status)}
                      {(order.status === "PENDING" ||
                        order.status === "PROCESSING") && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1 rounded-full transition-colors"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    {order.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-6 ${idx !== 0 ? "mt-6 pt-6 border-t border-gray-100" : ""}`}
                      >
                        <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-4xl">
                          {item.product.imageUrl || "📦"}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Qté: {item.quantity}
                          </p>
                          <p className="font-bold text-[#0052cc] mt-1">
                            {item.price.toLocaleString("fr-DJ")} FDJ
                          </p>
                        </div>
                        <div className="hidden sm:block">
                          <button className="px-6 py-2 bg-white border border-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                            Évaluer le produit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
