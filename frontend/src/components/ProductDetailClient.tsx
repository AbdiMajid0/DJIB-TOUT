"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Maximize2,
  Package,
  Play,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  ThumbsUp,
  Truck,
  X,
} from "lucide-react";
import {
  Product,
  ProductQuestion,
  ProductVariant,
  Review,
  ReviewSummary,
  createProductQuestion,
  createProductReview,
  fetchProductQuestions,
  fetchProductReviews,
  fetchProductReviewSummary,
  fetchProductVariants,
} from "@/lib/api";
import { useCartStore } from "@/store/useCartStore";
import { useFavoriteStore } from "@/store/useFavoriteStore";
import ImageZoom from "./ImageZoom";
import DjibtoutProductCard from "./DjibtoutProductCard";
import CountdownTimer from "./CountdownTimer";
import ProductActivityBadge from "./ProductActivityBadge";
import StockMeter from "./StockMeter";

const money = (value: number) =>
  `${new Intl.NumberFormat("fr-DJ").format(value)} FDJ`;

export default function ProductDetailClient({
  product,
  allProducts,
}: {
  product: Product;
  allProducts: Product[];
}) {
  const addItem = useCartStore((state) => state.addItem);
  const isFavorite = useFavoriteStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState("description");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    averageRating: 0,
    reviewCount: 0,
  });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [question, setQuestion] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    Promise.all([
      fetchProductReviews(product.id),
      fetchProductReviewSummary(product.id),
    ])
      .then(([list, result]) => {
        setReviews(list);
        setSummary({
          averageRating: result.averageRating || 0,
          reviewCount: result.reviewCount || list.length,
        });
      })
      .catch(() => {
        setReviews([]);
        setSummary({ averageRating: 0, reviewCount: 0 });
      });
  }, [product.id]);

  useEffect(() => {
    fetchProductQuestions(product.id).then(setQuestions);
  }, [product.id]);
  useEffect(() => {
    fetchProductVariants(product.id)
      .then((values) => {
        setVariants(values);
        setSelectedVariant(values[0] || null);
      })
      .catch(() => {});
  }, [product.id]);

  useEffect(() => {
    try {
      const key = "djibtout_recent_products";
      const previous = JSON.parse(
        localStorage.getItem(key) || "[]",
      ) as number[];
      localStorage.setItem(
        key,
        JSON.stringify(
          [product.id, ...previous.filter((id) => id !== product.id)].slice(
            0,
            20,
          ),
        ),
      );
      queueMicrotask(() =>
        setRecentIds(previous.filter((id) => id !== product.id)),
      );
    } catch {}
  }, [product.id]);

  const candidateImages = product.images?.length
    ? product.images
    : [product.imageUrl || ""];
  const images = candidateImages.filter((image) =>
    /^(https?:|\/|data:)/.test(image),
  );
  if (!images.length) images.push("/images/product-placeholder-premium-v2.png");
  const similar = allProducts
    .filter(
      (item) => item.id !== product.id && item.category === product.category,
    )
    .slice(0, 6);
  const complementary = allProducts
    .filter(
      (item) => item.id !== product.id && item.category !== product.category,
    )
    .slice(0, 6);
  const otherOffers = allProducts
    .filter(
      (item) =>
        item.id !== product.id &&
        item.name.toLowerCase() === product.name.toLowerCase(),
    )
    .slice(0, 4);
  const recentlyViewed = recentIds
    .map((id) => allProducts.find((item) => item.id === id))
    .filter(Boolean)
    .slice(0, 6) as Product[];
  const sellerName = product.seller?.name;
  const discount = product.discountPercentage || 0;

  function addToCart() {
    addItem(product, quantity, selectedVariant || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createProductReview(product.id, rating, comment);
      const [list, result] = await Promise.all([
        fetchProductReviews(product.id),
        fetchProductReviewSummary(product.id),
      ]);
      setReviews(list);
      setSummary(result);
      setComment("");
      setMessage("Votre avis a été publié.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de publier l’avis.",
      );
    }
  }

  async function submitQuestion(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createProductQuestion(product.id, question);
      setQuestions(await fetchProductQuestions(product.id));
      setQuestion("");
      setQuestionMessage("Votre question a été envoyée.");
    } catch (error) {
      setQuestionMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’envoyer la question.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-14">
      <div className="dt-container pt-2 sm:pt-4">
        <nav className="mb-4 flex items-center gap-2 overflow-hidden text-[11px] font-semibold text-slate-500">
          <Link href="/">Accueil</Link>
          <ChevronRight size={12} />
          <Link href={`/category/${encodeURIComponent(product.category)}`}>
            {product.category}
          </Link>
          <ChevronRight size={12} />
          <span className="truncate text-slate-800">{product.name}</span>
        </nav>

        <section className="dt-card overflow-hidden">
          <div className="grid lg:grid-cols-[420px_minmax(0,1fr)_230px]">
            <Gallery images={images} product={product} />
            <main className="border-t p-4 sm:p-5 lg:border-l lg:border-t-0 lg:p-7">
              <Link
                href={`/category/${encodeURIComponent(product.category)}`}
                className="text-xs font-extrabold uppercase text-[var(--primary)]"
              >
                {product.category}
              </Link>
              <h1 className="mt-2 text-xl font-black leading-tight text-slate-900 sm:text-[22px]">
                {product.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                {summary.reviewCount > 0 ? (
                  <>
                    <span className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 font-black text-white">
                      {summary.averageRating.toFixed(1)}
                      <Star size={12} className="fill-current" />
                    </span>
                    <button
                      onClick={() => setTab("reviews")}
                      className="font-bold text-[var(--primary)]"
                    >
                      {summary.reviewCount} évaluation
                      {summary.reviewCount > 1 ? "s" : ""}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setTab("reviews")}
                    className="font-bold text-[var(--primary)]"
                  >
                    Aucun avis — donnez le premier
                  </button>
                )}
              </div>

              {sellerName && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Vendu par</span>
                  <strong className="text-[var(--primary)]">
                    {sellerName}
                  </strong>
                </div>
              )}

              <div className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex flex-wrap items-end gap-3">
                  <strong className="text-3xl font-black tracking-[-1px] text-slate-900">
                    {money(product.price)}
                  </strong>
                  {product.originalPrice &&
                    product.originalPrice > product.price && (
                      <span className="pb-1 text-sm text-slate-400 line-through">
                        {money(product.originalPrice)}
                      </span>
                    )}
                  {discount > 0 && (
                    <span className="mb-1 rounded bg-red-600 px-2 py-1 text-xs font-black text-white">
                      -{discount}%
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <div className="mt-3">
                    <CountdownTimer endsAt={product.flashSaleEndsAt} />
                  </div>
                )}
                {product.installmentMonths && product.installmentMonths > 1 && (
                  <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">
                    Paiement en {product.installmentMonths} ×{" "}
                    {money(
                      Math.ceil(product.price / product.installmentMonths),
                    )}
                  </p>
                )}
                {(product.couponLabel || product.promotionLabel) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.couponLabel && (
                      <span className="rounded bg-[#fff0e9] px-3 py-1.5 text-[10px] font-black text-[#d95016]">
                        Coupon : {product.couponLabel}
                      </span>
                    )}
                    {product.promotionLabel && (
                      <span className="rounded bg-blue-50 px-3 py-1.5 text-[10px] font-black text-[var(--primary)]">
                        {product.promotionLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <ProductActivityBadge productId={product.id} />

              {(product.deliveryDays || product.warrantyMonths) && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {product.deliveryDays && (
                    <DataCard
                      label="Livraison estimée"
                      value={`${product.deliveryDays} jour${product.deliveryDays > 1 ? "s" : ""}`}
                    />
                  )}
                  {product.warrantyMonths && (
                    <DataCard
                      label="Garantie"
                      value={`${product.warrantyMonths} mois`}
                    />
                  )}
                </div>
              )}

              {variants.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-black text-slate-700">
                    Choisir une variante
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setQuantity(1);
                        }}
                        disabled={!variant.active || variant.stockQuantity < 1}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40 ${selectedVariant?.id === variant.id ? "border-[var(--primary)] bg-blue-50 text-[var(--primary)]" : "border-slate-200 text-slate-600"}`}
                      >
                        {Object.values(variant.attributes).join(" · ") ||
                          variant.sku}{" "}
                        — {money(variant.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-5">
                <p className="mb-2 text-xs font-bold text-slate-700">
                  Quantité
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 items-center rounded-lg border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-full px-4 text-lg"
                    >
                      −
                    </button>
                    <strong className="w-9 text-center">{quantity}</strong>
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(
                            selectedVariant?.stockQuantity ??
                              product.stockQuantity,
                            quantity + 1,
                          ),
                        )
                      }
                      className="h-full px-4 text-lg"
                    >
                      +
                    </button>
                  </div>
                  <StockMeter
                    stock={
                      selectedVariant?.stockQuantity ?? product.stockQuantity
                    }
                  />
                </div>
              </div>

              <motion.button
                animate={
                  added && !reducedMotion
                    ? { scale: [1, 1.06, 0.97, 1] }
                    : undefined
                }
                transition={{ duration: 0.45 }}
                onClick={addToCart}
                disabled={
                  (selectedVariant?.stockQuantity ?? product.stockQuantity) < 1
                }
                className={`mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-black text-white shadow-lg disabled:bg-slate-300 ${added ? "bg-emerald-600" : "bg-[var(--primary)]"}`}
              >
                {added ? (
                  <>
                    <Check />
                    Ajouté au panier
                  </>
                ) : (
                  <>
                    <ShoppingCart />
                    Ajouter au panier
                  </>
                )}
              </motion.button>
              <motion.button
                whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                animate={
                  isFavorite && !reducedMotion
                    ? { scale: [1, 1.03, 1] }
                    : undefined
                }
                onClick={() => toggleFavorite(product)}
                className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border text-xs font-bold ${isFavorite ? "border-red-200 bg-red-50 text-red-600" : "text-slate-600"}`}
              >
                <motion.span
                  animate={
                    isFavorite && !reducedMotion
                      ? { scale: [1, 1.35, 1] }
                      : undefined
                  }
                >
                  <Heart
                    size={16}
                    className={isFavorite ? "fill-current" : ""}
                  />
                </motion.span>
                Favoris
              </motion.button>
              <div className="mt-5 space-y-2 border-t pt-4 text-xs font-semibold text-slate-600">
                {product.deliveryDays && (
                  <Trust
                    icon={Truck}
                    text={`Livraison estimée sous ${product.deliveryDays} jour${product.deliveryDays > 1 ? "s" : ""}`}
                  />
                )}
                <Trust
                  icon={RotateCcw}
                  text="Conditions de retour disponibles au checkout"
                />
                <Trust icon={ShieldCheck} text="Paiement protégé" />
              </div>
            </main>
            <SellerPanel product={product} />
          </div>
        </section>

        <section className="dt-card mt-5 overflow-hidden">
          <div className="flex overflow-x-auto border-b bg-slate-50 [scrollbar-width:none]">
            {[
              { id: "description", label: "Description" },
              { id: "specs", label: "Caractéristiques" },
              { id: "reviews", label: `Avis (${summary.reviewCount})` },
              { id: "questions", label: `Questions (${questions.length})` },
              { id: "delivery", label: "Livraison et retours" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`min-w-max px-6 py-4 text-sm font-extrabold ${tab === item.id ? "border-b-2 border-[var(--primary)] bg-white text-[var(--primary)]" : "text-slate-500"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="p-4 sm:p-8">
            {tab === "description" && <Description product={product} />}
            {tab === "specs" && <Specs product={product} />}
            {tab === "reviews" && (
              <Reviews
                reviews={reviews}
                summary={summary}
                rating={rating}
                setRating={setRating}
                comment={comment}
                setComment={setComment}
                submit={submitReview}
                message={message}
              />
            )}
            {tab === "questions" && (
              <Questions
                questions={questions}
                question={question}
                setQuestion={setQuestion}
                submit={submitQuestion}
                message={questionMessage}
              />
            )}
            {tab === "delivery" && <Delivery product={product} />}
          </div>
        </section>
        {similar.length > 0 && (
          <Shelf title="Produits similaires" products={similar} />
        )}
        {otherOffers.length > 0 && (
          <Shelf title="Autres offres pour ce produit" products={otherOffers} />
        )}
        {complementary.length > 0 && (
          <Shelf title="Produits complémentaires" products={complementary} />
        )}
        {recentlyViewed.length > 0 && (
          <Shelf title="Récemment consultés" products={recentlyViewed} />
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-3 shadow lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <small className="block truncate text-slate-500">
              {product.name}
            </small>
            <strong>{money(product.price)}</strong>
          </div>
          <button
            onClick={addToCart}
            disabled={product.stockQuantity < 1}
            className="flex h-12 items-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-sm font-black text-white disabled:bg-slate-300"
          >
            <ShoppingCart size={18} />
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

function Gallery({ images, product }: { images: string[]; product: Product }) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const favorite = useFavoriteStore((state) => state.isFavorite(product.id));
  const toggle = useFavoriteStore((state) => state.toggleFavorite);
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator
        .share({ title: product.name, url })
        .catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
    }
  }
  return (
    <div className="p-4 sm:p-6">
      <div className="relative aspect-square overflow-hidden rounded-xl border bg-white">
        <ImageZoom
          src={images[active]}
          alt={product.name}
          className="h-full w-full p-4"
        />
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            onClick={() => toggle(product)}
            aria-label="Ajouter aux favoris"
            className="dt-icon-button shadow"
          >
            <Heart
              size={18}
              className={favorite ? "fill-red-500 text-red-500" : ""}
            />
          </button>
          <button
            onClick={() => setFullscreen(true)}
            aria-label="Afficher en plein écran"
            className="dt-icon-button shadow"
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={share}
            aria-label="Partager"
            className="dt-icon-button shadow"
          >
            <Share2 size={18} />
          </button>
        </div>
        {product.videoUrl && (
          <a
            href={product.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-slate-950/80 px-3 py-2 text-xs font-bold text-white"
          >
            <Play size={15} className="fill-current" />
            Vidéo produit
          </a>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setActive((active - 1 + images.length) % images.length)
              }
              className="dt-icon-button absolute left-3 top-1/2 -translate-y-1/2"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => setActive((active + 1) % images.length)}
              className="dt-icon-button absolute right-3 top-1/2 -translate-y-1/2"
            >
              <ChevronRight />
            </button>
          </>
        )}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {images.map((image, index) => (
          <button
            key={image + index}
            onClick={() => setActive(index)}
            aria-label={`Image ${index + 1}`}
            className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${active === index ? "border-[var(--primary)]" : "border-slate-200"}`}
          >
            <ImageZoom
              src={image}
              alt=""
              className="h-full w-full"
              zoomLevel={1}
            />
          </button>
        ))}
      </div>
      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[150] grid place-items-center bg-black/90 p-4"
        >
          <button
            onClick={() => setFullscreen(false)}
            aria-label="Fermer"
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white"
          >
            <X />
          </button>
          <Image
            src={images[active]}
            alt={product.name}
            width={1400}
            height={1400}
            className="max-h-[90vh] max-w-[94vw] object-contain"
          />
        </div>
      )}
    </div>
  );
}

function DataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-blue-50 p-3">
      <small className="font-bold text-slate-500">{label}</small>
      <strong className="block text-sm text-[var(--primary)]">{value}</strong>
    </div>
  );
}
function Trust({ icon: Icon, text }: { icon: typeof Truck; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={17} className="text-emerald-600" />
      {text}
    </div>
  );
}

function SellerPanel({ product }: { product: Product }) {
  return (
    <aside className="border-t bg-slate-50 p-5 lg:border-l lg:border-t-0">
      {product.seller?.name && (
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 text-[var(--primary)]">
              <Store />
            </span>
            <div>
              <small className="text-slate-500">Vendeur</small>
              <strong className="block text-sm">{product.seller.name}</strong>
            </div>
          </div>
        </div>
      )}
      <div className="mt-4 rounded-xl border bg-white p-4 text-xs">
        <h3 className="font-black text-slate-900">Livraison</h3>
        <div className="mt-3 flex items-start gap-2">
          <MapPin size={17} className="text-[var(--primary)]" />
          <span>
            <strong className="block">Adresse choisie au checkout</strong>
            <small className="text-slate-500">
              Le délai exact dépend de votre zone.
            </small>
          </span>
        </div>
        {product.deliveryDays && (
          <div className="mt-3 flex items-start gap-2">
            <Truck size={17} className="text-emerald-600" />
            <span>
              <strong className="block text-emerald-700">
                Délai indicatif : {product.deliveryDays} jour
                {product.deliveryDays > 1 ? "s" : ""}
              </strong>
            </span>
          </div>
        )}
      </div>
      <div className="mt-4 rounded-xl border bg-white p-4 text-xs">
        <h3 className="font-black">Informations produit</h3>
        <dl className="mt-3 space-y-2 text-slate-600">
          <div className="flex justify-between">
            <dt>État</dt>
            <dd className="font-bold">Neuf</dd>
          </div>
          <div className="flex justify-between">
            <dt>Stock</dt>
            <dd className="font-bold">{product.stockQuantity}</dd>
          </div>
          {product.warrantyMonths && (
            <div className="flex justify-between">
              <dt>Garantie</dt>
              <dd className="font-bold">{product.warrantyMonths} mois</dd>
            </div>
          )}
        </dl>
      </div>
    </aside>
  );
}

function Description({ product }: { product: Product }) {
  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-black">À propos de ce produit</h2>
      <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">
        {product.description}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Info icon={Package} title="Emballage sécurisé" />
        <Info icon={ShieldCheck} title="Paiement protégé" />
      </div>
    </div>
  );
}
function Info({ icon: Icon, title }: { icon: typeof Package; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold">
      <Icon className="text-[var(--primary)]" />
      {title}
    </div>
  );
}

function Specs({ product }: { product: Product }) {
  const specs = [
    ["Catégorie", product.category],
    ...(product.brand ? [["Marque", product.brand]] : []),
    ["État", "Neuf"],
    ["Stock", `${product.stockQuantity} unités`],
    ["Référence", `DJT-${String(product.id).padStart(6, "0")}`],
    ...(product.warrantyMonths
      ? [["Garantie", `${product.warrantyMonths} mois`]]
      : []),
  ];
  return (
    <div>
      <h2 className="mb-5 text-lg font-black sm:text-xl">
        Caractéristiques du produit
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {specs.map(([key, value]) => (
          <div
            key={key}
            className="flex min-w-0 items-center justify-between gap-4 rounded bg-[#f5f5f5] px-4 py-3"
          >
            <strong className="text-xs font-medium text-[#555]">{key}</strong>
            <span className="min-w-0 truncate text-right text-xs font-semibold text-[#333]">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Reviews({
  reviews,
  summary,
  rating,
  setRating,
  comment,
  setComment,
  submit,
  message,
}: {
  reviews: Review[];
  summary: ReviewSummary;
  rating: number;
  setRating: (value: number) => void;
  comment: string;
  setComment: (value: string) => void;
  submit: (event: React.FormEvent) => void;
  message: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-black">Avis des clients</h2>
      <div className="mt-5 grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="rounded-xl bg-slate-50 p-6 text-center">
          {summary.reviewCount > 0 ? (
            <>
              <strong className="text-5xl">
                {summary.averageRating.toFixed(1)}
              </strong>
              <Stars value={Math.round(summary.averageRating)} />
              <small className="mt-2 block text-slate-500">
                {summary.reviewCount} avis
              </small>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-500">
              Aucun avis pour le moment.
            </p>
          )}
        </div>
        <form onSubmit={submit} className="rounded-xl border p-5">
          <h3 className="font-black">Donnez votre avis</h3>
          <div className="mt-2 flex">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setRating(value)}
              >
                <Star
                  className={
                    value <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-200"
                  }
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            required
            className="mt-3 w-full rounded-lg border p-3 text-sm outline-none focus:border-[var(--primary)]"
            rows={3}
            placeholder="Partagez votre expérience…"
          />
          <button className="mt-3 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-white">
            Publier mon avis
          </button>
          {message && <p className="mt-2 text-xs text-slate-600">{message}</p>}
        </form>
      </div>
      <div className="mt-8 space-y-4">
        {reviews.length ? (
          reviews.map((review) => (
            <article key={review.id} className="border-t pt-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 font-black text-[var(--primary)]">
                  {review.user?.name?.[0] || "A"}
                </span>
                <strong>{review.user?.name || "Client"}</strong>
                <Stars value={review.rating} />
                <small className="ml-auto text-slate-400">
                  {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                </small>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {review.comment}
              </p>
              <span className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                <ThumbsUp size={13} />
                Avis client
              </span>
              {review.sellerResponse && (
                <div className="mt-4 rounded-xl border-l-4 border-[var(--primary)] bg-blue-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[var(--primary)]">
                    Réponse officielle du vendeur
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {review.sellerResponse}
                  </p>
                  {review.sellerRespondedAt && (
                    <small className="mt-2 block text-slate-400">
                      {new Date(review.sellerRespondedAt).toLocaleDateString(
                        "fr-FR",
                      )}
                    </small>
                  )}
                </div>
              )}
            </article>
          ))
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
            Soyez le premier à partager votre expérience.
          </p>
        )}
      </div>
    </div>
  );
}

function Questions({
  questions,
  question,
  setQuestion,
  submit,
  message,
}: {
  questions: ProductQuestion[];
  question: string;
  setQuestion: (value: string) => void;
  submit: (event: React.FormEvent) => void;
  message: string;
}) {
  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_360px]">
      <div>
        <h2 className="text-xl font-black">Questions et réponses</h2>
        <div className="mt-5 space-y-4">
          {questions.length ? (
            questions.map((item) => (
              <article key={item.id} className="rounded-xl border p-4">
                <p className="font-bold text-slate-800">{item.question}</p>
                <small className="mt-1 block text-slate-400">
                  {item.user?.name || "Client DjibTout"} ·{" "}
                  {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                </small>
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  {item.answer || "Le vendeur n’a pas encore répondu."}
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
              Aucune question pour le moment.
            </p>
          )}
        </div>
      </div>
      <form onSubmit={submit} className="h-fit rounded-xl border p-5">
        <h3 className="font-black">Poser une question</h3>
        <p className="mt-1 text-xs text-slate-500">
          Demandez une précision au vendeur.
        </p>
        <textarea
          required
          maxLength={500}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={5}
          className="mt-4 w-full rounded-lg border p-3 text-sm outline-none focus:border-[var(--primary)]"
          placeholder="Votre question…"
        />
        <button className="mt-3 w-full rounded-lg bg-[var(--primary)] px-5 py-3 text-xs font-bold text-white">
          Envoyer la question
        </button>
        {message && <p className="mt-2 text-xs text-slate-600">{message}</p>}
      </form>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex justify-center text-amber-400">
      {[0, 1, 2, 3, 4].map((index) => (
        <Star
          key={index}
          size={15}
          className={index < value ? "fill-current" : "text-slate-200"}
        />
      ))}
    </span>
  );
}
function Delivery({ product }: { product: Product }) {
  return (
    <div>
      <h2 className="text-xl font-black">Livraison et retours</h2>
      <p className="mt-3 text-sm text-slate-600">
        L’estimation définitive est calculée selon l’adresse sélectionnée au
        checkout.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {product.deliveryDays && (
          <Info
            icon={Truck}
            title={`Délai indicatif : ${product.deliveryDays} jour${product.deliveryDays > 1 ? "s" : ""}`}
          />
        )}
        <Info icon={RotateCcw} title="Retour selon les conditions affichées" />
        <Info icon={ShieldCheck} title="Paiement protégé" />
      </div>
    </div>
  );
}
function Shelf({ title, products }: { title: string; products: Product[] }) {
  return (
    <section className="dt-card mt-4 overflow-hidden sm:mt-5">
      <div className="border-b p-3 sm:p-5">
        <h2 className="text-base font-black sm:text-lg">{title}</h2>
      </div>
      <div className="flex snap-x overflow-x-auto [scrollbar-width:none]">
        {products.map((item) => (
          <div
            className="min-w-[155px] max-w-[155px] snap-start border-r sm:min-w-[200px] sm:max-w-[200px]"
            key={item.id}
          >
            <DjibtoutProductCard product={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
