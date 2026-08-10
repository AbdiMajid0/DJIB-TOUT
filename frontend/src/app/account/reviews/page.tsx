"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, ExternalLink } from "lucide-react";
import { fetchMyReviews, Review } from "@/lib/api";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReviews()
      .then((data) => {
        setReviews(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            Mes Évaluations
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Retrouvez tous les avis et notes que vous avez partagés.
          </p>
        </div>
        {!loading && reviews.length > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-extrabold px-3 py-1 rounded-full">
            {reviews.length} avis rédigé(s)
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="border border-gray-100 rounded-xl p-5 animate-pulse space-y-3"
            >
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-yellow-50 p-6 rounded-full mb-4">
            <Star className="h-12 w-12 text-yellow-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-700 mb-2">
            Vous n’avez laissé aucune évaluation
          </h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md">
            Aidez les autres clients en partageant votre avis sur les produits
            que vous avez achetés. Vos évaluations apparaîtront ici.
          </p>
          <Link
            href="/account/orders"
            className="bg-[#0052cc] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#003d99] transition-colors shadow-md hover:shadow-lg inline-block"
          >
            Consulter mes commandes
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <Link
                  href={rev.product ? `/product/${rev.product.id}` : "#"}
                  className="font-bold text-gray-900 hover:text-[#0052cc] transition-colors flex items-center gap-1.5"
                >
                  {rev.product ? rev.product.name : "Produit"}
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </Link>
                <span className="text-xs text-gray-400 font-medium">
                  Publié le{" "}
                  {new Date(rev.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>

              {/* Rating stars */}
              <div className="flex items-center gap-1 text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < rev.rating ? "fill-current" : "text-gray-200"}`}
                  />
                ))}
                <span className="text-xs font-bold text-gray-700 ml-1">
                  {rev.rating}/5
                </span>
              </div>

              {/* Comment text */}
              <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 leading-relaxed">
                « {rev.comment} »
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
