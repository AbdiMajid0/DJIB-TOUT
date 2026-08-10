"use client";

import { useCartStore } from "@/store/useCartStore";
import { Product } from "@/lib/api";
import { useState } from "react";

export default function AddToCartButton({ product, initialQuantity = 1, className = "" }: { product: Product, initialQuantity?: number, className?: string }) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if this is inside a link
    addItem(product, initialQuantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button 
      className={className || "w-full mt-3 bg-white border-2 border-[#0052cc] text-[#0052cc] py-2 rounded-lg font-semibold text-sm hover:bg-[#0052cc] hover:text-white transition-colors cursor-pointer relative z-10"}
      onClick={handleAdd}
    >
      {added ? "Ajouté !" : "Ajouter au panier"}
    </button>
  );
}
