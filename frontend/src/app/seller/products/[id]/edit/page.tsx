"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Upload } from "lucide-react";
import Link from "next/link";
import { fetchProductById, updateProduct } from "@/lib/api";
import MediaManager from "@/components/seller/MediaManager";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import VariantManager from "@/components/seller/VariantManager";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    category: "",
    brand: "",
    originalPrice: "",
    flashSaleEndsAt: "",
    imageUrl: "📦",
  });

  useEffect(() => {
    if (productId) {
      fetchProductById(productId)
        .then((product) => {
          if (product) {
            setImages(product.images || []);
            setVideoUrl(product.videoUrl || "");
            setFormData({
              name: product.name || "",
              description: product.description || "",
              price: product.price ? product.price.toString() : "",
              stockQuantity: product.stockQuantity
                ? product.stockQuantity.toString()
                : "",
              category: product.category || "",
              brand: product.brand || "",
              originalPrice: product.originalPrice?.toString() || "",
              flashSaleEndsAt: product.flashSaleEndsAt?.slice(0, 16) || "",
              imageUrl:
                product.images && product.images.length > 0
                  ? product.images[0]
                  : "📦",
            });
          } else {
            setError("Produit introuvable.");
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("Erreur lors du chargement du produit.");
          setLoading(false);
        });
    }
  }, [productId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.stockQuantity ||
      !formData.category
    ) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProduct(productId, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity, 10),
        category: formData.category,
        brand: formData.brand || undefined,
        originalPrice: formData.originalPrice
          ? parseFloat(formData.originalPrice)
          : undefined,
        flashSaleEndsAt: formData.flashSaleEndsAt || undefined,
        images,
        videoUrl: videoUrl || undefined,
      });

      router.push("/seller/products");
    } catch (err: unknown) {
      setError(
        (err instanceof Error ? err.message : "") ||
          "Une erreur s'est produite lors de la modification du produit.",
      );
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 py-8">
        <Skeleton height={48} />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <Skeleton height={220} />
            <Skeleton height={180} />
          </div>
          <Skeleton height={320} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/seller/products"
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Modifier le produit #{productId}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Mettez à jour les informations et le stock de votre produit.
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#0052cc] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#003d99] transition-colors flex items-center shadow-md disabled:opacity-70 cursor-pointer"
        >
          <Save className="h-5 w-5 mr-2" />
          {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium border border-red-100 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">
              Informations Générales
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre du produit *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052cc] focus:border-transparent outline-none text-sm text-gray-900"
                placeholder="Ex: Samsung Galaxy S23 Ultra"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description détaillée *
              </label>
              <textarea
                rows={6}
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052cc] focus:border-transparent outline-none text-sm text-gray-900"
                placeholder="Décrivez votre produit en détail..."
              ></textarea>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">
              Prix & Inventaire
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (FDJ) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052cc] focus:border-transparent outline-none text-sm text-gray-900 font-bold"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-medium text-sm">
                      FDJ
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité en stock *
                </label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052cc] focus:border-transparent outline-none text-sm text-gray-900 font-bold"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Prix avant promotion (FDJ)
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#0052cc]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fin de la vente flash
                </label>
                <input
                  type="datetime-local"
                  name="flashSaleEndsAt"
                  value={formData.flashSaleEndsAt}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#0052cc]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <MediaManager
            images={images}
            onImagesChange={setImages}
            videoUrl={videoUrl}
            onVideoChange={setVideoUrl}
          />
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">
              Image du produit
            </h2>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4 group-hover:text-[#0052cc]" />
              <p className="text-sm font-medium text-gray-900">
                Cliquez pour modifier l’image
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu’à 5 MB</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">
              Organisation
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052cc] focus:border-transparent outline-none text-sm text-gray-900"
              >
                <option value="">Sélectionner une catégorie</option>
                <option value="electronics">Électronique</option>
                <option value="informatique">Informatique</option>
                <option value="smartphones">Smartphones & Accessoires</option>
                <option value="tv">TV & Audio</option>
                <option value="mode">Mode</option>
                <option value="maison">Maison & Déco</option>
                <option value="electromenager">Électroménager</option>
                <option value="jus-de-fruits">Boissons & Jus</option>
                <option value="beaute">Beauté</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Marque
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#0052cc]"
              />
            </div>
          </div>
        </div>
      </div>
      <VariantManager productId={productId} />
    </div>
  );
}
