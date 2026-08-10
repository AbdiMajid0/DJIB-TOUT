"use client";

import { useCartStore } from "@/store/useCartStore";
import { Product } from "@/lib/api";
import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";

export default function AddToCartSection({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const decrement = () => setQuantity(q => Math.max(1, q - 1));
  const increment = () => setQuantity(q => Math.min(product.stockQuantity, q + 1));

  return (
    <div className="space-y-3">
      {/* Quantity Selector */}
      <div>
        <span className="text-sm font-medium text-gray-700 mb-1 block">Quantité :</span>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-32">
          <button onClick={decrement} className="px-3 py-2 bg-gray-50 hover:bg-gray-100 font-bold transition-colors cursor-pointer text-gray-600">-</button>
          <input type="text" value={quantity} readOnly className="w-full text-center font-bold text-gray-900 focus:outline-none bg-white text-sm" />
          <button onClick={increment} className="px-3 py-2 bg-gray-50 hover:bg-gray-100 font-bold transition-colors cursor-pointer text-gray-600">+</button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button 
        onClick={handleAdd}
        className={`w-full py-3.5 px-6 rounded-lg font-bold text-base flex justify-center items-center gap-2 cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg ${
          added 
            ? "bg-green-500 text-white" 
            : "bg-[#0052cc] text-white hover:bg-[#003d99]"
        }`}
      >
        {added ? (
          <>
            <Check className="h-5 w-5" />
            Ajouté au panier !
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Ajouter au panier
          </>
        )}
      </button>
    </div>
  );
}
