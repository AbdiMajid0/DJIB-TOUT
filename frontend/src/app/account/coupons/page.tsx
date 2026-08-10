"use client";
import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { Coupon, fetchCoupons } from "@/lib/api";
export default function CouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchCoupons()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="bg-white rounded-lg border p-6">
      <h1 className="text-xl font-bold mb-6">Mes coupons</h1>
      {loading ? (
        <p>Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Aucun coupon actif.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((c) => (
            <article
              key={c.id}
              className="border-2 border-dashed border-[#0052cc] rounded-xl p-5 flex gap-4"
            >
              <Tag className="text-[#0052cc]" />
              <div>
                <p className="font-black text-lg">{c.code}</p>
                <p className="text-gray-600">
                  {c.discountType === "PERCENTAGE"
                    ? `${c.discountValue}% de réduction`
                    : `${c.discountValue.toLocaleString("fr-DJ")} FDJ de réduction`}
                </p>
                {c.expiresAt && (
                  <p className="text-xs text-gray-500">
                    Expire le{" "}
                    {new Date(c.expiresAt).toLocaleDateString("fr-DJ")}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
