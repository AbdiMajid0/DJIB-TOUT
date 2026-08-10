"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavoriteStore } from "@/store/useFavoriteStore";
import DjibtoutProductCard from "@/components/DjibtoutProductCard";

export default function FavoritesPage() {
  const favoritesList = useFavoriteStore((state) => state.favoritesList);
  const loaded = useFavoriteStore((state) => state.loaded);
  const fetchFavoritesList = useFavoriteStore(
    (state) => state.fetchFavoritesList,
  );

  useEffect(() => {
    fetchFavoritesList();
  }, [fetchFavoritesList]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            Mes Favoris
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Retrouvez tous les produits que vous avez enregistrés.
          </p>
        </div>
        {loaded && favoritesList.length > 0 && (
          <span className="bg-pink-100 text-pink-700 text-xs font-extrabold px-3 py-1 rounded-full">
            {favoritesList.length} produit(s)
          </span>
        )}
      </div>

      {/* Content */}
      {!loaded ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-4 h-72 animate-pulse space-y-4"
            >
              <div className="bg-gray-200 h-40 rounded-lg w-full"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : favoritesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-pink-50 p-6 rounded-full mb-4">
            <Heart className="h-12 w-12 text-pink-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            Votre liste de favoris est vide
          </h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md">
            Cliquez sur le petit cœur à côté d’un produit pour l’ajouter à vos
            favoris et le retrouver facilement à tout moment.
          </p>
          <Link
            href="/"
            className="bg-[#0052cc] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#003d99] transition-colors shadow-md hover:shadow-lg"
          >
            Découvrir les produits
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {favoritesList.map((product) => (
            <DjibtoutProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
