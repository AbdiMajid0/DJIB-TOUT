"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Minus,
  PackageOpen,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { fetchProductById } from "@/lib/api";
import { useCartStore, CartItem } from "@/store/useCartStore";
import { useFavoriteStore } from "@/store/useFavoriteStore";

const money = (value: number) =>
  `${new Intl.NumberFormat("fr-DJ").format(value)} FDJ`;
export default function CartPage() {
  const [mounted, setMounted] = useState(false),
    [removed, setRemoved] = useState<CartItem | null>(null),
    [stockMessage, setStockMessage] = useState(""),
    [coupon, setCoupon] = useState("");
  const { items, removeItem, updateQuantity, addItem, getTotalPrice } =
    useCartStore();
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setCoupon(localStorage.getItem("djibtout_coupon") || "");
    });
  }, []);
  const groups = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    items.forEach((item) => {
      const seller = item.product.seller?.name || "DjibTout";
      map.set(seller, [...(map.get(seller) || []), item]);
    });
    return [...map.entries()];
  }, [items]);
  if (!mounted)
    return (
      <div className="dt-container py-10">
        <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  const subtotal = getTotalPrice(),
    delivery = subtotal >= 50000 ? 0 : 1500,
    total = subtotal + delivery,
    remaining = Math.max(0, 50000 - subtotal);
  async function change(item: CartItem, next: number) {
    const current = await fetchProductById(item.product.id);
    if (!current) {
      setStockMessage(`${item.product.name} n’est plus disponible.`);
      return;
    }
    const safe = Math.max(1, Math.min(next, current.stockQuantity));
    updateQuantity(item.product.id, safe);
    setStockMessage(
      safe !== next
        ? `Stock disponible : ${current.stockQuantity} unité(s).`
        : "",
    );
  }
  function remove(item: CartItem) {
    removeItem(item.product.id);
    setRemoved(item);
    window.setTimeout(
      () =>
        setRemoved((current) =>
          current?.product.id === item.product.id ? null : current,
        ),
      5000,
    );
  }
  function undo() {
    if (removed) {
      addItem(removed.product, removed.quantity);
      setRemoved(null);
    }
  }
  async function saveForLater(item: CartItem) {
    if (await toggleFavorite(item.product)) removeItem(item.product.id);
  }
  function saveCoupon() {
    localStorage.setItem("djibtout_coupon", coupon.trim());
    setStockMessage(
      coupon.trim() ? "Le coupon sera vérifié par le serveur au checkout." : "",
    );
  }
  if (!items.length)
    return (
      <main className="min-h-[70vh] bg-[#f6f7f9] py-10">
        <div className="dt-container">
          <div className="grid min-h-[430px] place-items-center rounded-xl border bg-white p-8 text-center">
            <div>
              <PackageOpen size={68} className="mx-auto text-slate-300" />
              <h1 className="mt-5 text-2xl font-black">
                Votre panier est vide
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Découvrez les produits disponibles sur DjibTout.
              </p>
              <Link
                href="/search"
                className="mt-6 inline-flex rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white"
              >
                Explorer le catalogue
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  return (
    <main className="min-h-screen bg-[#f6f7f9] pb-16 pt-6">
      <div className="dt-container">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">Mon panier</h1>
            <p className="mt-1 text-xs text-slate-500">
              {items.reduce((sum, item) => sum + item.quantity, 0)} article(s),
              regroupés par vendeur
            </p>
          </div>
          <Link
            href="/search"
            className="text-xs font-bold text-[var(--primary)]"
          >
            Continuer mes achats
          </Link>
        </div>
        {stockMessage && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-[var(--primary)]"
          >
            {stockMessage}
          </div>
        )}
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_350px]">
          <section className="space-y-4">
            {groups.map(([seller, sellerItems]) => (
              <div
                key={seller}
                className="overflow-hidden rounded-xl border bg-white"
              >
                <header className="flex items-center gap-2 border-b bg-slate-50 px-4 py-3 text-xs">
                  <ShoppingBag size={16} className="text-[var(--primary)]" />
                  <span>Vendeur :</span>
                  <strong>{seller}</strong>
                </header>
                <div className="divide-y">
                  {sellerItems.map((item) => (
                    <CartRow
                      key={item.product.id}
                      item={item}
                      change={change}
                      remove={remove}
                      favorite={saveForLater}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
          <aside className="sticky top-[150px] rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Résumé de la commande</h2>
            <div className="mt-5 rounded-lg bg-emerald-50 p-4">
              <div className="flex items-start gap-2 text-xs font-bold text-emerald-800">
                <Truck size={17} />
                {remaining
                  ? `Plus que ${money(remaining)} pour la livraison gratuite`
                  : "Livraison gratuite atteinte"}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.min(100, (subtotal / 50000) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="mt-5 space-y-3 border-b pb-5 text-sm">
              <Line label="Sous-total" value={money(subtotal)} />
              <Line
                label="Livraison estimée"
                value={delivery ? money(delivery) : "Gratuite"}
                success={!delivery}
              />
            </div>
            <div className="mt-4 flex items-end justify-between">
              <strong>Total estimé</strong>
              <strong className="text-2xl text-[var(--primary)]">
                {money(total)}
              </strong>
            </div>
            <div className="mt-5 flex gap-2">
              <input
                value={coupon}
                onChange={(event) =>
                  setCoupon(event.target.value.toUpperCase())
                }
                className="min-w-0 flex-1 rounded-lg border px-3 text-xs font-bold uppercase"
                placeholder="Code promo"
              />
              <button
                onClick={saveCoupon}
                className="rounded-lg border px-4 py-3 text-xs font-bold"
              >
                Appliquer
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              Le prix final, le coupon et le stock seront recalculés par le
              serveur.
            </p>
            <Link
              href="/checkout"
              className="mt-5 flex h-13 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] text-sm font-black text-white"
            >
              Passer la commande <ArrowRight size={18} />
            </Link>
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
              <ShieldCheck size={16} className="text-emerald-600" />
              Paiement protégé
            </div>
          </aside>
        </div>
      </div>
      {removed && (
        <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl bg-slate-900 px-5 py-3 text-sm text-white shadow-xl">
          <span>Article supprimé</span>
          <button onClick={undo} className="font-black text-blue-300">
            Annuler
          </button>
        </div>
      )}
    </main>
  );
}
function CartRow({
  item,
  change,
  remove,
  favorite,
}: {
  item: CartItem;
  change: (item: CartItem, next: number) => void;
  remove: (item: CartItem) => void;
  favorite: (item: CartItem) => void;
}) {
  const product = item.product;
  const raw = product.images?.[0] || product.imageUrl;
  const image =
    raw && /^(https?:|\/|data:)/.test(raw)
      ? raw
      : "/images/product-placeholder-premium-v2.png";
  return (
    <article className="grid gap-4 p-4 sm:grid-cols-[100px_minmax(0,1fr)_auto] sm:items-center">
      <Link
        href={`/product/${product.id}`}
        className="relative mx-auto h-24 w-24 overflow-hidden rounded-lg bg-slate-50"
      >
        <Image
          src={image}
          alt={product.name}
          fill
          unoptimized
          className="object-contain p-1"
        />
      </Link>
      <div className="min-w-0 text-center sm:text-left">
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 text-sm font-bold text-slate-800"
        >
          {product.name}
        </Link>
        {item.variant && (
          <p className="mt-1 text-[10px] font-bold text-[var(--primary)]">
            {Object.values(item.variant.attributes).join(" · ") ||
              item.variant.sku}
          </p>
        )}
        <p className="mt-1 text-[10px] text-slate-500">
          Stock indiqué : {item.variant?.stockQuantity ?? product.stockQuantity}
        </p>
        <strong className="mt-2 block text-base text-[var(--primary)]">
          {money(item.variant?.price ?? product.price)}
        </strong>
        <button
          onClick={() => favorite(item)}
          className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-red-500"
        >
          <Heart size={13} />
          Déplacer vers les favoris
        </button>
      </div>
      <div className="flex items-center justify-center gap-3">
        <div className="flex h-10 items-center rounded-lg border">
          <button
            aria-label="Diminuer"
            onClick={() => change(item, item.quantity - 1)}
            className="grid h-full w-9 place-items-center"
          >
            <Minus size={14} />
          </button>
          <strong className="w-8 text-center text-sm">{item.quantity}</strong>
          <button
            aria-label="Augmenter"
            onClick={() => change(item, item.quantity + 1)}
            className="grid h-full w-9 place-items-center"
          >
            <Plus size={14} />
          </button>
        </div>
        <button
          aria-label="Supprimer"
          onClick={() => remove(item)}
          className="dt-icon-button text-slate-400 hover:text-red-500"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}
function Line({
  label,
  value,
  success,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <strong className={success ? "text-emerald-600" : ""}>{value}</strong>
    </div>
  );
}
