"use client";

import { create } from "zustand";
import { Product } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";

interface FavoriteState {
  favoriteIds: number[];
  favoritesList: Product[];
  loaded: boolean;
  fetchFavoriteIds: () => Promise<void>;
  fetchFavoritesList: () => Promise<void>;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (product: Product | { id: number }) => Promise<boolean>;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favoriteIds: [],
  favoritesList: [],
  loaded: false,

  fetchFavoriteIds: async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/favorites/ids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const ids: number[] = await res.json();
        set({ favoriteIds: ids, loaded: true });
      }
    } catch (err) {
      console.error("Failed to fetch favorite IDs", err);
    }
  },

  fetchFavoritesList: async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        set({ favoritesList: [], loaded: true });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const products: Product[] = await res.json();
        const ids = products.map(p => p.id);
        set({ favoritesList: products, favoriteIds: ids, loaded: true });
      }
    } catch (err) {
      console.error("Failed to fetch favorites list", err);
      set({ loaded: true });
    }
  },

  isFavorite: (productId: number) => {
    return get().favoriteIds.includes(productId);
  },

  toggleFavorite: async (product: Product | { id: number }) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return false;
    }

    const { favoriteIds, favoritesList } = get();
    const isFav = favoriteIds.includes(product.id);

    try {
      if (isFav) {
        // Optimistic UI update
        const newIds = favoriteIds.filter(id => id !== product.id);
        const newList = favoritesList.filter(p => p.id !== product.id);
        set({ favoriteIds: newIds, favoritesList: newList });

        const res = await fetch(`${API_BASE_URL}/favorites/${product.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          // Revert if failed
          set({ favoriteIds, favoritesList });
          return false;
        }
      } else {
        // Optimistic UI update
        const newIds = [...favoriteIds, product.id];
        const newList = "name" in product ? [...favoritesList, product as Product] : favoritesList;
        set({ favoriteIds: newIds, favoritesList: newList });

        const res = await fetch(`${API_BASE_URL}/favorites/${product.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          // Revert if failed
          set({ favoriteIds, favoritesList });
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error("Error toggling favorite", err);
      set({ favoriteIds, favoritesList });
      return false;
    }
  }
}));
