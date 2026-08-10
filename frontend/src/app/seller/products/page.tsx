"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  FileUp,
  Download,
} from "lucide-react";
import {
  fetchMyProducts,
  deleteProduct,
  Product,
  importSellerProducts,
  importSellerProductsXlsx,
} from "@/lib/api";

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchMyProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { queueMicrotask(() => void loadProducts()); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer le produit "${name}" ?`,
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : "") || "Erreur lors de la suppression du produit.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-DJ", {
      style: "currency",
      currency: "DJF",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("DJF", "FDJ");
  };

  const importCsv = async (file?: File) => {
    if (!file) return;
    setImporting(true);
    setImportMessage("");
    try {
      const result = file.name.toLowerCase().endsWith(".xlsx")
        ? await importSellerProductsXlsx(file)
        : await importSellerProducts(file);
      setImportMessage(
        `${result.imported} produit(s) importé(s), ${result.rejected} rejeté(s).${result.errors.length ? ` ${result.errors.slice(0, 2).join(" · ")}` : ""}`,
      );
      await loadProducts();
    } catch (error) {
      setImportMessage(
        error instanceof Error ? error.message : "Import impossible.",
      );
    } finally {
      setImporting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Produits</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez votre catalogue de produits personnel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="data:text/csv;charset=utf-8,name%2Cdescription%2Cprice%2CstockQuantity%2Ccategory%2Cbrand%2CimageUrl%0AExemple%2CDescription%20du%20produit%2C25000%2C10%2Celectronics%2CMarque%2Chttps%3A%2F%2Fexample.com%2Fimage.jpg"
            download="modele-produits-djibtout.csv"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
          >
            <Download className="h-4 w-4" />
            Modèle CSV
          </a>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-[#0052cc]">
            <FileUp className="h-4 w-4" />
            {importing ? "Import…" : "Importer CSV / XLSX"}
            <input
              type="file"
              accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={importing}
              onChange={(e) => {
                importCsv(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
              className="hidden"
            />
          </label>
          <Link href="/seller/products/new">
            <button className="bg-[#0052cc] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#003d99] transition-colors flex items-center shadow-md cursor-pointer">
              <Plus className="h-5 w-5 mr-2" />
              Ajouter un produit
            </button>
          </Link>
        </div>
      </div>

      {importMessage && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-slate-700">
          {importMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc]"
              placeholder="Rechercher par nom, catégorie..."
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm animate-pulse">
            Chargement de vos produits...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-800 mb-1">
              Aucun produit trouvé
            </h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm">
              Vous n’avez pas encore publié de produit ou aucun produit ne
              correspond à votre recherche.
            </p>
            <Link
              href="/seller/products/new"
              className="px-4 py-2 bg-[#0052cc] text-white text-xs font-bold rounded-lg hover:bg-[#003d99] transition-colors"
            >
              Ajouter votre premier produit
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Produit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Catégorie
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Prix
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Stock
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            product.images[0].length <= 4 ? (
                              product.images[0]
                            ) : (
                              <Image
                                src={
                                  product.images[0].startsWith("http")
                                    ? product.images[0]
                                    : `http://localhost:8082${product.images[0]}`
                                }
                                alt={`Aperçu de ${product.name}`}
                                width={40}
                                height={40}
                                unoptimized
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            "📦"
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {product.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-50 text-[#0052cc]">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`h-2.5 w-2.5 rounded-full mr-2 ${product.stockQuantity > 10 ? "bg-green-500" : product.stockQuantity > 0 ? "bg-yellow-500" : "bg-red-500"}`}
                        ></div>
                        <span className="text-sm text-gray-900 font-medium">
                          {product.stockQuantity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/seller/products/${product.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-4 transition-colors inline-block p-1 hover:bg-blue-50 rounded"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deletingId === product.id}
                        className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded cursor-pointer disabled:opacity-50"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
