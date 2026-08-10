"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createProduct, uploadMedia } from "@/lib/api";
import MediaManager from "@/components/seller/MediaManager";

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
    imageUrl: "📦", // using emojis as placeholders for images for now
  });

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

    // Basic validation
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
      await createProduct({
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
    } catch (err) {
      setError("Une erreur s'est produite lors de la création du produit.");
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadMedia(file);
      setFormData((prev) => ({
        ...prev,
        imageUrl: prev.imageUrl ? `${prev.imageUrl}\n${url}` : url,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload impossible.");
    } finally {
      setUploading(false);
    }
  };

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
              Ajouter un produit
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Créez une nouvelle fiche produit dans votre catalogue.
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#0052cc] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#003d99] transition-colors flex items-center shadow-md disabled:opacity-70"
        >
          <Save className="h-5 w-5 mr-2" />
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium border border-red-100">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052cc] focus:border-transparent outline-none"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052cc] focus:border-transparent outline-none"
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
                    className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052cc] focus:border-transparent outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052cc] focus:border-transparent outline-none"
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
                  placeholder="Optionnel"
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

            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4 group-hover:text-[#0052cc]" />
              <p className="text-sm font-medium text-gray-900">
                {uploading ? "Upload en cours…" : "Cliquez pour uploader"}
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu’à 5 MB</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading}
                onChange={(e) => handleImage(e.target.files?.[0])}
                className="hidden"
              />
            </label>
            {formData.imageUrl.startsWith("http") && (
              <Image
                src={formData.imageUrl}
                alt="Aperçu du produit"
                width={800}
                height={176}
                unoptimized
                className="h-44 w-full rounded-xl border border-slate-200 object-contain"
              />
            )}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052cc] focus:border-transparent outline-none"
              >
                <option value="">Sélectionner une catégorie</option>
                <option value="electronics">Électronique</option>
                <option value="informatique">Informatique</option>
                <option value="tv">TV & Audio</option>
                <option value="mode">Mode</option>
                <option value="maison">Maison & Déco</option>
                <option value="electromenager">Électroménager</option>
                <option value="beaute">Beauté</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marque
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052cc] focus:border-transparent outline-none"
                placeholder="Ex: Samsung"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
