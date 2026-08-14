import React from "react";
import {
  Edit3,
  Boxes,
  Eye,
  EyeOff,
  Image,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { api } from "./lib/api";
import "./seller-products.css";
import MediaUploader from "./MediaUploader";
import SellerVariantsModal from "./SellerVariantsModal";

const empty = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  stockQuantity: "",
  category: "",
  brand: "",
  deliveryDays: "2",
  warrantyMonths: "0",
  imageUrl: "",
  visible: true,
};
const money = (n) =>
  new Intl.NumberFormat("fr-FR").format(Number(n || 0)) + " FDJ";
export default function SellerProductsPage() {
  const [items, setItems] = React.useState([]),
    [query, setQuery] = React.useState(""),
    [modal, setModal] = React.useState(false),
    [editing, setEditing] = React.useState(null),
    [form, setForm] = React.useState(empty),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState(""),
    [deleting, setDeleting] = React.useState(null),
    [variantsProduct, setVariantsProduct] = React.useState(null);
  const load = () =>
    api("/products/my-products")
      .then(setItems)
      .catch((e) => setError(e.message));
  React.useEffect(() => {
    load();
  }, []);
  const open = (p) => {
    setEditing(p || null);
    setForm(
      p
        ? {
            ...empty,
            ...p,
            imageUrl: p.images?.[0] || "",
            price: String(p.price),
            originalPrice: p.originalPrice ? String(p.originalPrice) : "",
            stockQuantity: String(p.stockQuantity),
          }
        : empty,
    );
    setError("");
    setModal(true);
  };
  const change = (e) =>
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = {
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        stockQuantity: Number(form.stockQuantity),
        deliveryDays: Number(form.deliveryDays),
        warrantyMonths: Number(form.warrantyMonths),
        images: form.imageUrl ? [form.imageUrl] : [],
      };
      await api(editing ? `/products/${editing.id}` : "/products", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      setModal(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await api(`/products/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function visibility(p) {
    await api(`/products/${p.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...p, visible: !p.visible }),
    });
    load();
  }
  const shown = items.filter((p) =>
    (p.name + " " + p.category + " " + (p.brand || ""))
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="portal-content seller-products">
      <header>
        <div>
          <small>CATALOGUE</small>
          <h1>Mes produits</h1>
          <p>{items.length} produit(s) dans votre boutique.</p>
        </div>
        <button onClick={() => open()}>
          <Plus /> Nouveau produit
        </button>
      </header>
      <div className="seller-product-tools">
        <label>
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom, catégorie ou marque…"
          />
        </label>
        <span>{items.filter((x) => x.visible).length} publiés</span>
        <span>
          {items.filter((x) => x.stockQuantity <= 5).length} stock faible
        </span>
      </div>
      {error && !modal && <div className="api-error">{error}</div>}
      <div className="seller-product-table">
        <div className="head">
          <span>Produit</span>
          <span>Prix</span>
          <span>Stock</span>
          <span>Statut</span>
          <span>Actions</span>
        </div>
        {shown.map((p) => (
          <article key={p.id}>
            <div className="seller-product-name">
              <i>
                {p.images?.[0] ? <img src={p.images[0]} alt="" /> : <Package />}
              </i>
              <span>
                <b>{p.name}</b>
                <small>
                  {p.brand || "Sans marque"} · {p.category}
                </small>
              </span>
            </div>
            <strong>
              {money(p.price)}
              {p.originalPrice && <del>{money(p.originalPrice)}</del>}
            </strong>
            <span className={p.stockQuantity <= 5 ? "low" : ""}>
              {p.stockQuantity} unité(s)
            </span>
            <em className={p.visible ? "published" : "hidden"}>
              {p.visible ? "Publié" : "Masqué"}
            </em>
            <div>
              <button title="Variantes" onClick={() => setVariantsProduct(p)}>
                <Boxes />
              </button>
              <button
                title={p.visible ? "Masquer" : "Publier"}
                onClick={() => visibility(p)}
              >
                {p.visible ? <EyeOff /> : <Eye />}
              </button>
              <button title="Modifier" onClick={() => open(p)}>
                <Edit3 />
              </button>
              <button
                className="danger"
                title="Supprimer"
                onClick={() => setDeleting(p)}
              >
                <Trash2 />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!shown.length && (
        <div className="seller-product-empty">
          <Package />
          <h2>Aucun produit trouvé</h2>
          <p>Ajoutez votre premier produit pour commencer à vendre.</p>
          <button onClick={() => open()}>
            <Plus /> Ajouter un produit
          </button>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop">
          <form className="seller-product-modal" onSubmit={save}>
            <header>
              <div>
                <small>{editing ? "MODIFICATION" : "NOUVEAU PRODUIT"}</small>
                <h2>
                  {editing ? "Modifier le produit" : "Ajouter au catalogue"}
                </h2>
              </div>
              <button type="button" onClick={() => setModal(false)}>
                <X />
              </button>
            </header>
            {error && <div className="api-error">{error}</div>}
            <div className="seller-product-fields">
              <label className="wide">
                Nom du produit
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  required
                />
              </label>
              <label>
                Catégorie
                <input
                  name="category"
                  value={form.category}
                  onChange={change}
                  required
                />
              </label>
              <label>
                Marque
                <input
                  name="brand"
                  value={form.brand || ""}
                  onChange={change}
                />
              </label>
              <label>
                Prix actuel (FDJ)
                <input
                  name="price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={change}
                  required
                />
              </label>
              <label>
                Prix avant promotion
                <input
                  name="originalPrice"
                  type="number"
                  min="0"
                  value={form.originalPrice || ""}
                  onChange={change}
                />
              </label>
              <label>
                Quantité en stock
                <input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={change}
                  required
                />
              </label>
              <label>
                Délai de livraison (jours)
                <input
                  name="deliveryDays"
                  type="number"
                  min="0"
                  value={form.deliveryDays}
                  onChange={change}
                />
              </label>
              <label>
                Garantie (mois)
                <input
                  name="warrantyMonths"
                  type="number"
                  min="0"
                  value={form.warrantyMonths}
                  onChange={change}
                />
              </label>
              <div className="wide">
                <MediaUploader
                  label="Image principale du produit"
                  value={form.imageUrl}
                  onChange={(imageUrl) => setForm({ ...form, imageUrl })}
                />
              </div>
              <label className="wide">
                Description
                <textarea
                  name="description"
                  value={form.description || ""}
                  onChange={change}
                />
              </label>
              <label className="check wide">
                <input
                  name="visible"
                  type="checkbox"
                  checked={form.visible}
                  onChange={change}
                />{" "}
                Publier immédiatement dans la boutique
              </label>
            </div>
            <footer>
              <button type="button" onClick={() => setModal(false)}>
                Annuler
              </button>
              <button disabled={busy}>
                {busy
                  ? "Enregistrement…"
                  : editing
                    ? "Enregistrer les modifications"
                    : "Créer le produit"}
              </button>
            </footer>
          </form>
        </div>
      )}
      {deleting && (
        <div className="modal-backdrop">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <h2>Supprimer ce produit ?</h2>
            <p>
              « {deleting.name} » sera définitivement retiré du catalogue. Cette
              action est impossible si le produit est lié à certaines commandes.
            </p>
            <div>
              <button onClick={() => setDeleting(null)}>Annuler</button>
              <button className="danger" disabled={busy} onClick={remove}>
                {busy ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
      {variantsProduct && (
        <SellerVariantsModal
          product={variantsProduct}
          onClose={() => setVariantsProduct(null)}
        />
      )}
    </div>
  );
}
