import React from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FileText,
  Headphones,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Truck,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import HomePage from "./App";
import { api, imageUrl, money } from "./lib/api";
import { useUser } from "./context/UserContext";
import AccountDeletionPage from "./AccountDeletionPage";
import ProductDetailPage from "./ProductDetailPage";
import SellerLanding from "./SellerLanding";
import SellerAuth from "./SellerAuth";
import SellerOnboarding from "./SellerOnboarding";
import SellerDashboardHome from "./SellerDashboardHome";
import SellerProductsPage from "./SellerProductsPage";
import SellerOrdersPage from "./SellerOrdersPage";
import SellerSupportPage from "./SellerSupportPage";
import SellerFinancePage from "./SellerFinancePage";
import SellerSettingsPage from "./SellerSettingsPage";
import SellerAnalyticsPage from "./SellerAnalyticsPage";
import SellerNotificationsPage from "./SellerNotificationsPage";
import SellerExportsPage from "./SellerExportsPage";
import "./portal-notifications.css";

const products = [
  [
    "📱",
    "Smartphone 128 Go double SIM",
    "Djib Electronics",
    "24 900 FDJ",
    "4,8",
  ],
  [
    "🎧",
    "Casque sans fil réduction de bruit",
    "Sound Corner",
    "7 500 FDJ",
    "4,5",
  ],
  ["⌚", "Montre connectée sport", "Time Shop DJ", "9 200 FDJ", "4,4"],
  ["👟", "Baskets running homme", "Balbala Style", "5 400 FDJ", "4,7"],
  ["🔌", "Batterie externe 20 000 mAh", "Power Djib", "3 900 FDJ", "4,3"],
  ["🧴", "Coffret soin visage", "Beauty Djib", "4 200 FDJ", "4,9"],
  ["☕", "Café moulu premium 500 g", "Café d'Arta", "1 800 FDJ", "4,8"],
  ["🪑", "Chaise de bureau ergonomique", "Maison & Co", "18 500 FDJ", "4,2"],
];
const sellerNav = [
  [LayoutDashboard, "Tableau de bord", "/seller"],
  [Package, "Produits", "/seller/products"],
  [ClipboardList, "Commandes", "/seller/orders"],
  [Truck, "Retours", "/seller/returns"],
  [MessageSquare, "Questions", "/seller/questions"],
  [Star, "Avis clients", "/seller/reviews"],
  [CircleDollarSign, "Règlements", "/seller/settlements"],
  [BarChart3, "Statistiques", "/seller/analytics"],
  [Users, "Équipe", "/seller/team"],
  [Store, "Ma boutique", "/seller/store"],
  [FileText, "Exports", "/seller/exports"],
  [Bell, "Notifications", "/seller/notifications"],
];
const adminNav = [
  [LayoutDashboard, "Vue générale", "/admin"],
  [Users, "Utilisateurs", "/admin/users"],
  [Store, "Vendeurs", "/admin/sellers"],
  [Package, "Produits", "/admin/products"],
  [Boxes, "Catégories", "/admin/categories"],
  [ClipboardList, "Opérations", "/admin/operations"],
  [ShieldCheck, "Modération", "/admin/moderation"],
  [Tags, "Campagnes", "/admin/campaigns"],
  [Tags, "Coupons", "/admin/coupons"],
  [Home, "Accueil", "/admin/home-sections"],
  [FileText, "Journal d'audit", "/admin/audit"],
];
const accountNav = [
  [UserRound, "Vue générale", "/account"],
  [ClipboardList, "Mes commandes", "/account/orders"],
  [CreditCard, "Mes paiements", "/payments"],
  [Truck, "Mes retours", "/account/returns"],
  [Heart, "Mes favoris", "/account/favorites"],
  [FileText, "Mes listes", "/account/lists"],
  [Wallet, "DjibPay", "/account/djibpay"],
  [Tags, "Mes coupons", "/account/coupons"],
  [MessageSquare, "Mes questions", "/account/questions"],
  [Star, "Mes avis", "/account/reviews"],
  [Home, "Mes adresses", "/account/addresses"],
  [ShieldCheck, "Supprimer mon compte", "/account/delete"],
];
const titles = {
  products: "Produits",
  orders: "Mes commandes",
  payments: "Mes paiements",
  returns: "Mes retours",
  questions: "Mes questions",
  reviews: "Mes avis",
  settlements: "Règlements",
  analytics: "Statistiques",
  team: "Équipe",
  store: "Ma boutique",
  exports: "Exports",
  notifications: "Notifications",
  users: "Utilisateurs",
  sellers: "Vendeurs",
  categories: "Catégories",
  operations: "Commandes et retours",
  moderation: "Modération",
  campaigns: "Campagnes",
  coupons: "Mes coupons",
  audit: "Journal d'audit",
  "home-sections": "Sections de l'accueil",
  favorites: "Mes favoris",
  djibpay: "Mon portefeuille DjibPay",
  addresses: "Mes adresses",
};
function Brand() {
  return (
    <Link to="/" className="portal-brand">
      <span>DT</span>
      <b>
        DJIB<em>TOUT</em>
      </b>
    </Link>
  );
}
function ShopHeader() {
  const { user, cart, favoriteIds } = useUser();
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  return (
    <>
      <div className="mini-top">
        <div className="shell">
          Livraison offerte dès 5 000 FDJ{" "}
          <span>Aide · Devenir vendeur · FR</span>
        </div>
      </div>
      <header className="site-header">
        <div className="shell">
          <Brand />
          <form
            className="route-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/search?q=" + encodeURIComponent(q));
            }}
          >
            <Search />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit, une marque…"
            />
            <button>Rechercher</button>
          </form>
          <nav>
            <Link to={user ? "/account" : "/login"}>
              <UserRound />
              {user?.name?.split(" ")[0] || "Compte"}
            </Link>
            <Link to="/account/favorites">
              <Heart />
              Favoris {favoriteIds.length > 0 && <i>{favoriteIds.length}</i>}
            </Link>
            <Link to="/cart">
              <ShoppingCart />
              Panier{" "}
              {cart.length > 0 && (
                <i>{cart.reduce((n, x) => n + x.quantity, 0)}</i>
              )}
            </Link>
          </nav>
        </div>
      </header>
      <nav className="route-cats">
        <div className="shell">
          <Link to="/search?sort=discount">🔥 Ventes flash</Link>
          {[
            "Électronique",
            "Mode",
            "Maison & Cuisine",
            "Beauté",
            "Téléphones",
            "Sport",
          ].map((x) => (
            <Link key={x} to={"/category/" + encodeURIComponent(x)}>
              {x}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
function ShopFooter() {
  return (
    <footer className="route-footer">
      <div className="shell footer-cols">
        <div>
          <Brand />
          <p>
            La marketplace de Djibouti, pensée pour acheter local simplement et
            en toute confiance.
          </p>
        </div>
        <div>
          <b>Acheter</b>
          <Link to="/search">Toutes les catégories</Link>
          <Link to="/cart">Mon panier</Link>
        </div>
        <div>
          <b>Mon compte</b>
          <Link to="/login">Se connecter</Link>
          <Link to="/orders">Mes commandes</Link>
        </div>
        <div>
          <b>Aide</b>
          <a>Livraison</a>
          <a>Nous contacter</a>
        </div>
      </div>
    </footer>
  );
}
function Crumb({ current }) {
  return (
    <div className="crumb shell">
      <Link to="/">Accueil</Link>
      <ChevronRight />
      <b>{current}</b>
    </div>
  );
}
function Head({ title, text, action = "Tout voir →", href = "/search" }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {action && <Link to={href}>{action}</Link>}
    </div>
  );
}
function SaveToList({ productId }) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [lists, setLists] = React.useState([]);
  const [name, setName] = React.useState("");
  const [message, setMessage] = React.useState("");
  async function show() {
    if (!user) {
      navigate("/login");
      return;
    }
    setOpen(true);
    setMessage("");
    setLists(await api("/lists"));
  }
  async function add(list) {
    await api(`/lists/${list.id}/products/${productId}`, { method: "POST" });
    setMessage(`Ajouté à « ${list.name} »`);
    setLists(await api("/lists"));
  }
  async function create(e) {
    e.preventDefault();
    const list = await api("/lists", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setName("");
    await add(list);
  }
  return (
    <div className="save-list">
      <button type="button" onClick={show}>
        <FileText /> Ajouter à une liste
      </button>
      {open && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <section
            className="confirm-dialog list-picker"
            role="dialog"
            aria-modal="true"
            aria-labelledby="list-picker-title"
          >
            <button
              aria-label="Fermer"
              className="modal-close"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
            <h2 id="list-picker-title">Enregistrer ce produit</h2>
            {message && <div className="api-success">{message}</div>}
            <div className="list-picker-items">
              {lists.map((list) => (
                <button key={list.id} onClick={() => add(list)}>
                  <FileText />
                  <span>
                    <b>{list.name}</b>
                    <small>{list.productIds?.length || 0} produit(s)</small>
                  </span>
                </button>
              ))}
            </div>
            <form onSubmit={create}>
              <input
                aria-label="Nom de la nouvelle liste"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nouvelle liste"
                required
              />
              <button>Créer et ajouter</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
function ProductGrid({ items = [], loading = false }) {
  const { favoriteIds, toggleFavorite, addToCart } = useUser();
  if (loading)
    return <div className="catalog-message">Chargement des produits…</div>;
  if (!items.length)
    return (
      <div className="catalog-message">
        Aucun produit ne correspond à votre recherche.
      </div>
    );
  return (
    <div className="catalog-grid">
      {items.map((p, i) => (
        <article className="catalog-card" key={p.id}>
          <Link to={"/product/" + p.id}>
            <div className={"catalog-img shade" + (i % 5)}>
              {imageUrl(p) ? <img src={imageUrl(p)} alt="" /> : "📦"}
              {p.discountPercentage > 0 && (
                <small>−{p.discountPercentage}%</small>
              )}
            </div>
          </Link>
          <button
            aria-label="Favoris"
            className={favoriteIds.includes(p.id) ? "liked" : ""}
            onClick={() => toggleFavorite(p.id).catch((e) => alert(e.message))}
          >
            {favoriteIds.includes(p.id) ? "♥" : "♡"}
          </button>
          <div>
            <label>{p.seller?.name || p.brand || "DJIB TOUT"}</label>
            <Link to={"/product/" + p.id}>
              <h3>{p.name}</h3>
            </Link>
            <p className="rating">
              ★★★★★{" "}
              <span>
                {Number(p.averageRating || 0).toFixed(1)} ({p.reviewCount || 0})
              </span>
            </p>
            <strong>{money(p.price)}</strong>
            <small>
              {p.deliveryDays
                ? `Livraison sous ${p.deliveryDays} jours`
                : "Livraison disponible"}
            </small>
            <span onClick={() => addToCart(p)}>Ajouter au panier</span>
          </div>
        </article>
      ))}
    </div>
  );
}
function Catalog() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [data, setData] = React.useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = React.useState(true);
  const q = params.get("q") || "";
  const sort = params.get("sort") || "";
  React.useEffect(() => {
    setLoading(true);
    const search = new URLSearchParams({ page: "0", size: "20" });
    if (q) search.set("q", q);
    if (slug) search.set("category", decodeURIComponent(slug));
    if (sort) search.set("sort", sort);
    api("/products?" + search)
      .then(setData)
      .catch((e) =>
        setData({ content: [], totalElements: 0, error: e.message }),
      )
      .finally(() => setLoading(false));
  }, [q, slug, sort]);
  return (
    <Shop>
      <Crumb current={slug ? decodeURIComponent(slug) : "Tous les produits"} />
      <main className="shell page-space">
        <div className="catalog-title">
          <div>
            <h1>
              {q
                ? `Résultats pour « ${q} »`
                : slug
                  ? decodeURIComponent(slug)
                  : "Trouvez exactement ce qu'il vous faut"}
            </h1>
            <p>Les produits disponibles auprès des boutiques locales.</p>
          </div>
        </div>
        <div className="catalog-layout">
          <aside className="filters">
            <h3>Catégories</h3>
            {[
              "Téléphones",
              "Informatique",
              "Mode",
              "Maison",
              "Beauté",
              "Sport",
            ].map((x) => (
              <Link key={x} to={"/category/" + encodeURIComponent(x)}>
                {x}
              </Link>
            ))}
            <h3>Livraison</h3>
            <label>
              <input type="checkbox" /> Livraison gratuite
            </label>
            <label>
              <input type="checkbox" /> Sous 48 heures
            </label>
          </aside>
          <section className="catalog-results">
            <div className="catalog-tools">
              <b>{data.totalElements || 0} résultats</b>
              <select
                value={sort}
                onChange={(e) => {
                  const next = new URLSearchParams(params);
                  e.target.value
                    ? next.set("sort", e.target.value)
                    : next.delete("sort");
                  setParams(next);
                }}
              >
                <option value="">Les plus populaires</option>
                <option value="priceAsc">Prix croissant</option>
                <option value="priceDesc">Prix décroissant</option>
                <option value="newest">Nouveautés</option>
              </select>
            </div>
            {data.error && <div className="api-error">{data.error}</div>}
            <ProductGrid items={data.content || []} loading={loading} />
          </section>
        </div>
      </main>
    </Shop>
  );
}
function ProductDetail() {
  const { id } = useParams();
  const { addToCart, favoriteIds, toggleFavorite } = useUser();
  const [p, setP] = React.useState(null);
  const [error, setError] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  React.useEffect(() => {
    api("/products/" + id)
      .then(setP)
      .catch((e) => setError(e.message));
  }, [id]);
  if (error)
    return (
      <Shop>
        <main className="notfound">
          <h1>Produit indisponible</h1>
          <p>{error}</p>
          <Link to="/search">Retour au catalogue</Link>
        </main>
      </Shop>
    );
  if (!p)
    return (
      <Shop>
        <main className="notfound">
          <p>Chargement du produit…</p>
        </main>
      </Shop>
    );
  return (
    <Shop>
      <Crumb current={p.name} />
      <main className="shell product-page">
        <div className="product-gallery">
          <div>
            {imageUrl(p) ? <img src={imageUrl(p)} alt={p.name} /> : "📦"}
          </div>
          <div className="gallery-dots">
            {(p.images || []).map((src, i) => (
              <button key={src}>
                <img src={src} alt={`${p.name} ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>
        <article className="product-info">
          <label>
            {p.seller?.name || p.brand || "DJIB TOUT"} · ✓ Vendeur vérifié
          </label>
          <h1>{p.name}</h1>
          <p className="rating">
            ★★★★★{" "}
            <span>
              {Number(p.averageRating || 0).toFixed(1)} · {p.reviewCount || 0}{" "}
              avis
            </span>
          </p>
          <div className="detail-price">
            <strong>{money(p.price)}</strong>
            {p.originalPrice && <del>{money(p.originalPrice)}</del>}
            {p.discountPercentage > 0 && <b>−{p.discountPercentage} %</b>}
          </div>
          <p>{p.description || "Description à venir."}</p>
          <p className={p.stockQuantity > 0 ? "stock-ok" : "stock-out"}>
            {p.stockQuantity > 0
              ? `${p.stockQuantity} articles en stock`
              : "Rupture de stock"}
          </p>
          <div className="buyline">
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            >
              {Array.from(
                { length: Math.min(p.stockQuantity || 1, 10) },
                (_, i) => (
                  <option key={i + 1}>{i + 1}</option>
                ),
              )}
            </select>
            <button
              disabled={!p.stockQuantity}
              onClick={() => addToCart(p, quantity)}
            >
              Ajouter au panier
            </button>
            <button
              className="fav-detail"
              onClick={() =>
                toggleFavorite(p.id).catch((e) => alert(e.message))
              }
            >
              {favoriteIds.includes(p.id) ? "♥" : "♡"}
            </button>
          </div>
          <div className="detail-trust">
            <span>
              <Truck />
              Livraison sous {p.deliveryDays || 2} jours
            </span>
            <span>
              <ShieldCheck />
              Achat protégé et retour sous 14 jours
            </span>
            <span>
              <CreditCard />
              Waafi, D-Money ou espèces
            </span>
          </div>
        </article>
      </main>
      <section className="shell tabs">
        <b>Description</b>
        <span>Caractéristiques</span>
        <span>Avis ({p.reviewCount || 0})</span>
        <span>Questions</span>
      </section>
    </Shop>
  );
}
function Cart() {
  const { cart, updateCart } = useUser();
  const subtotal = cart.reduce(
    (n, x) => n + Number(x.product.price) * x.quantity,
    0,
  );
  const delivery = subtotal >= 50000 || !cart.length ? 0 : 1500;
  return (
    <Shop>
      <Crumb current="Panier" />
      <main className="shell page-space">
        <h1>
          Votre panier{" "}
          <small>({cart.reduce((n, x) => n + x.quantity, 0)} articles)</small>
        </h1>
        {!cart.length ? (
          <div className="empty-state">
            <ShoppingCart />
            <h2>Votre panier est vide</h2>
            <p>
              Découvrez les produits disponibles auprès de nos boutiques
              locales.
            </p>
            <Link to="/search">Découvrir les produits</Link>
          </div>
        ) : (
          <div className="cart-layout-new">
            <section>
              <div className="free-ship">
                🚚{" "}
                {subtotal >= 50000
                  ? "Votre livraison standard est offerte."
                  : `Plus que ${money(50000 - subtotal)} pour profiter de la livraison gratuite.`}
              </div>
              {cart.map(({ product: p, quantity }) => (
                <article className="cart-row" key={p.id}>
                  <div>
                    {imageUrl(p) ? <img src={imageUrl(p)} alt="" /> : "📦"}
                  </div>
                  <span>
                    <b>{p.name}</b>
                    <small>
                      {p.seller?.name || p.brand || "DJIB TOUT"} ·{" "}
                      {p.stockQuantity > 0 ? "En stock" : "Rupture"}
                    </small>
                    <a onClick={() => updateCart(p.id, 0)}>Supprimer</a>
                  </span>
                  <select
                    value={quantity}
                    onChange={(e) => updateCart(p.id, Number(e.target.value))}
                  >
                    {Array.from(
                      { length: Math.min(p.stockQuantity || 1, 10) },
                      (_, i) => (
                        <option key={i + 1}>{i + 1}</option>
                      ),
                    )}
                  </select>
                  <strong>{money(Number(p.price) * quantity)}</strong>
                </article>
              ))}
            </section>
            <aside className="summary-new">
              <h2>Résumé</h2>
              <p>
                <span>Sous-total</span>
                <b>{money(subtotal)}</b>
              </p>
              <p>
                <span>Livraison</span>
                <b>{delivery ? money(delivery) : "Gratuite"}</b>
              </p>
              <hr />
              <p className="total">
                <span>Total</span>
                <b>{money(subtotal + delivery)}</b>
              </p>
              <Link to="/checkout">Passer la commande</Link>
              <small>🔒 Paiement sécurisé</small>
            </aside>
          </div>
        )}
      </main>
    </Shop>
  );
}
function Checkout() {
  const { user, cart, setCart } = useUser();
  const navigate = useNavigate();
  const [addresses, setAddresses] = React.useState([]);
  const [addressId, setAddressId] = React.useState("");
  const [method, setMethod] = React.useState("WAAFI");
  const [phone, setPhone] = React.useState("");
  const [coupon, setCoupon] = React.useState("");
  const [delivery, setDelivery] = React.useState("STANDARD");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const subtotal = cart.reduce(
    (n, x) => n + Number(x.product.price) * x.quantity,
    0,
  );
  const fee = delivery === "EXPRESS" ? 3000 : subtotal >= 50000 ? 0 : 1500;
  React.useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    api("/addresses")
      .then((x) => {
        setAddresses(x);
        const d = x.find((a) => a.default) || x[0];
        if (d) setAddressId(String(d.id));
      })
      .catch((e) => setError(e.message));
  }, [user, navigate]);
  async function submit() {
    if (!cart.length) return;
    setBusy(true);
    setError("");
    try {
      const order = await api("/orders/create", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          paymentMethod: method,
          addressId: Number(addressId),
          couponCode: coupon || null,
          deliveryMethod: delivery,
          items: cart.map((x) => ({
            productId: x.product.id,
            variantId: x.variant?.id || null,
            quantity: x.quantity,
          })),
        }),
      });
      if (method !== "CASH") {
        const paid = await api("/payments/process", {
          method: "POST",
          body: JSON.stringify({
            orderId: order.orderId,
            paymentMethod: method,
            phoneNumber: method === "DJIBPAY" ? null : phone,
            amount: order.totalAmount,
          }),
        });
        if (!paid.success) throw new Error(paid.message);
      }
      setCart([]);
      navigate("/orders?success=" + order.orderId);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!cart.length)
    return (
      <Shop>
        <main className="empty-state">
          <ShoppingCart />
          <h2>Votre panier est vide</h2>
          <Link to="/search">Retour au catalogue</Link>
        </main>
      </Shop>
    );
  return (
    <Shop>
      <main className="shell checkout">
        <div>
          <Crumb current="Paiement" />
          <h1>Finaliser votre commande</h1>
          {error && <div className="api-error">{error}</div>}
          <FormCard title="1. Adresse de livraison">
            {addresses.length ? (
              <div className="address-select">
                {addresses.map((a) => (
                  <label key={a.id}>
                    <input
                      type="radio"
                      name="address"
                      value={a.id}
                      checked={addressId === String(a.id)}
                      onChange={(e) => setAddressId(e.target.value)}
                    />
                    <span>
                      <b>
                        {a.label}
                        {a.default && " · Par défaut"}
                      </b>
                      <small>
                        {a.fullAddress}, {a.city}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="api-error">
                Ajoutez d'abord une adresse dans votre compte.{" "}
                <Link to="/account/addresses">Ajouter une adresse</Link>
              </div>
            )}
          </FormCard>
          <FormCard title="2. Livraison">
            <div className="pay-choices">
              <label>
                <input
                  type="radio"
                  name="delivery"
                  checked={delivery === "STANDARD"}
                  onChange={() => setDelivery("STANDARD")}
                />
                <b>Standard</b>
                <small>
                  24–48 h · {subtotal >= 50000 ? "Gratuite" : "1 500 FDJ"}
                </small>
              </label>
              <label>
                <input
                  type="radio"
                  name="delivery"
                  checked={delivery === "EXPRESS"}
                  onChange={() => setDelivery("EXPRESS")}
                />
                <b>Express</b>
                <small>Le jour même · 3 000 FDJ</small>
              </label>
            </div>
          </FormCard>
          <FormCard title="3. Mode de paiement">
            <div className="pay-choices">
              {[
                ["WAAFI", "Waafi", "Paiement mobile sécurisé"],
                ["DMONEY", "D-Money", "Paiement mobile"],
                ["DJIBPAY", "DjibPay", "Votre portefeuille"],
                ["CASH", "Espèces", "À la livraison"],
              ].map((x) => (
                <label key={x[0]}>
                  <input
                    type="radio"
                    name="pay"
                    checked={method === x[0]}
                    onChange={() => setMethod(x[0])}
                  />
                  <b>{x[1]}</b>
                  <small>{x[2]}</small>
                </label>
              ))}
            </div>
            {["WAAFI", "DMONEY"].includes(method) && (
              <Field
                label="Numéro de téléphone"
                value={phone}
                onChange={setPhone}
              />
            )}
          </FormCard>
        </div>
        <aside className="summary-new">
          <h2>Votre commande</h2>
          {cart.map((x) => (
            <p key={x.product.id}>
              <span>
                {x.quantity}× {x.product.name}
              </span>
              <b>{money(Number(x.product.price) * x.quantity)}</b>
            </p>
          ))}
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="Code promo"
          />
          <hr />
          <p>
            <span>Livraison</span>
            <b>{fee ? money(fee) : "Gratuite"}</b>
          </p>
          <p className="total">
            <span>Total estimé</span>
            <b>{money(subtotal + fee)}</b>
          </p>
          <button disabled={busy || !addressId} onClick={submit}>
            {busy
              ? "Traitement…"
              : method === "CASH"
                ? "Confirmer la commande"
                : "Confirmer et payer"}
          </button>
        </aside>
      </main>
    </Shop>
  );
}
function Field({ label, value = "", type = "text", placeholder, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={onChange ? value : undefined}
        defaultValue={onChange ? undefined : value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
      />
    </label>
  );
}
function FormCard({ title, children }) {
  return (
    <section className="form-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function CouponValidator({ code, setCode, subtotal, onValidated }) {
  const [coupon, setCoupon] = React.useState(null);
  const [error, setError] = React.useState("");
  async function validate() {
    if (!code) {
      setCoupon(null);
      setError("");
      onValidated?.(null, 0);
      return;
    }
    try {
      const value = await api("/coupons/validate/" + encodeURIComponent(code));
      const raw =
        value.discountType === "PERCENTAGE"
          ? (subtotal * Number(value.discountValue)) / 100
          : Number(value.discountValue);
      const discount = Math.min(raw, subtotal);
      setCoupon(value);
      setError("");
      onValidated?.(value, discount);
    } catch (e) {
      setCoupon(null);
      onValidated?.(null, 0);
      setError(e.message);
    }
  }
  return (
    <div className="coupon-validator">
      <div>
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setCoupon(null);
            onValidated?.(null, 0);
          }}
          placeholder="Code promo"
        />
        <button type="button" onClick={validate}>
          Appliquer
        </button>
      </div>
      {coupon && (
        <p className="positive">
          <span>Réduction appliquée</span>
          <b>
            −{" "}
            {money(
              Math.min(
                coupon.discountType === "PERCENTAGE"
                  ? (subtotal * Number(coupon.discountValue)) / 100
                  : Number(coupon.discountValue),
                subtotal,
              ),
            )}
          </b>
        </p>
      )}
      {error && <small className="coupon-error">{error}</small>}
    </div>
  );
}
function Auth({ kind = "login" }) {
  const { login, register } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = React.useState({ name: "", email: "", password: "" });
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  let title = "Bon retour parmi nous",
    sub = "Connectez-vous pour retrouver vos commandes et vos favoris";
  if (kind === "register") {
    title = "Créer votre compte";
    sub = "Rejoignez la marketplace de Djibouti en quelques secondes";
  }
  if (kind === "forgot") {
    title = "Mot de passe oublié";
    sub = "Nous vous enverrons un lien de réinitialisation";
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (kind === "login") {
        const user = await login(form.email, form.password);
        navigate(user.role === "BUYER" ? "/account" : "/");
      } else if (kind === "register") {
        const data = await register(form.name, form.email, form.password);
        setMessage(data.message);
        setTimeout(() => navigate("/login"), 1000);
      } else {
        const data = await api("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email: form.email }),
        });
        setMessage(data.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return (
    <div className="auth-page">
      <aside>
        <Brand />
        <div>
          <span>La marketplace locale</span>
          <h1>
            Tout Djibouti,
            <br />à portée de main.
          </h1>
          <p>
            Achetez auprès des meilleures boutiques locales et faites-vous
            livrer rapidement.
          </p>
        </div>
        <small>© 2026 DJIB TOUT</small>
      </aside>
      <main>
        <Link to="/" className="back">
          ← Retour à l'accueil
        </Link>
        <form className="auth-card" onSubmit={submit}>
          <h1>{title}</h1>
          <p>{sub}</p>
          {error && <div className="api-error">{error}</div>}
          {message && <div className="api-success">{message}</div>}
          {kind === "register" && (
            <label className="field">
              <span>Nom complet</span>
              <input name="name" value={form.name} onChange={change} required />
            </label>
          )}
          <label className="field">
            <span>Adresse e-mail</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              required
            />
          </label>
          {kind !== "forgot" && (
            <label className="field">
              <span>Mot de passe</span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={change}
                minLength="8"
                required
              />
            </label>
          )}
          {kind === "login" && (
            <Link to="/forgot-password" className="forgot">
              Mot de passe oublié ?
            </Link>
          )}
          <button disabled={busy}>
            {busy
              ? "Veuillez patienter…"
              : kind === "login"
                ? "Se connecter"
                : kind === "register"
                  ? "S'inscrire"
                  : "Envoyer le lien"}
          </button>
          {kind !== "forgot" && (
            <small>
              {kind === "login" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
              <Link to={kind === "login" ? "/register" : "/login"}>
                {kind === "login" ? "S'inscrire" : "Se connecter"}
              </Link>
            </small>
          )}
        </form>
      </main>
    </div>
  );
}
function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [resetLink, setResetLink] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResetLink("");
    try {
      const data = await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage(data.message);
      if (data.developmentResetToken && !data.emailSent)
        setResetLink(
          "/reset-password?token=" +
            encodeURIComponent(data.developmentResetToken),
        );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <aside>
        <Brand />
        <div>
          <span>Sécurité du compte</span>
          <h1>Récupérez votre accès en toute sécurité.</h1>
        </div>
      </aside>
      <main>
        <Link to="/login" className="back">
          ← Retour à la connexion
        </Link>
        <form className="auth-card" onSubmit={submit}>
          <h1>Mot de passe oublié</h1>
          <p>Recevez un lien de réinitialisation.</p>
          {error && <div className="api-error">{error}</div>}
          {message && <div className="api-success">{message}</div>}
          {resetLink && (
            <Link className="local-reset-link" to={resetLink}>
              Ouvrir le lien de réinitialisation
            </Link>
          )}
          <label className="field">
            <span>Adresse e-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button disabled={busy}>
            {busy ? "Veuillez patienter…" : "Envoyer le lien"}
          </button>
        </form>
      </main>
    </div>
  );
}
function Protected({ children }) {
  const { user, checking } = useUser();
  if (checking)
    return (
      <div className="route-loading">
        <span />
        <p>Vérification de votre session…</p>
      </div>
    );
  return user ? children : <Auth />;
}
function SellerProtected({ children, onboarding = false }) {
  const { user, checking } = useUser();
  const [store, setStore] = React.useState(null),
    [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (user && (user.role === "SELLER" || user.role === "ADMIN"))
      api("/seller/store")
        .then(setStore)
        .finally(() => setLoading(false));
    else setLoading(false);
  }, [user]);
  if (checking || loading)
    return (
      <div className="route-loading">
        <span />
        <p>Vérification de votre espace vendeur…</p>
      </div>
    );
  if (!user || !["SELLER", "ADMIN"].includes(user.role))
    return <SellerAuth mode="login" />;
  if (onboarding || !store?.validated)
    return <SellerOnboarding store={store} onRefresh={setStore} />;
  return children;
}
function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  danger = false,
  onConfirm,
  onCancel,
  children,
}) {
  const cancelRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    cancelRef.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Tab") {
        const nodes = [
          ...document.querySelectorAll(
            ".confirm-dialog button,.confirm-dialog input,.confirm-dialog select,.confirm-dialog textarea",
          ),
        ].filter((x) => !x.disabled);
        if (!nodes.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus?.();
    };
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-description">{description}</p>
        {children}
        <div>
          <button ref={cancelRef} type="button" onClick={onCancel}>
            Annuler
          </button>
          <button
            type="button"
            className={danger ? "danger" : ""}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
function Account() {
  return (
    <Protected>
      <Portal type="account" nav={accountNav}>
        <UserAccountContent />
      </Portal>
    </Protected>
  );
}
function Dashboard({ type }) {
  const { pathname } = useLocation();
  let content = <PortalContent type={type} />;
  if (type === "seller" && pathname === "/seller")
    content = <SellerDashboardHome />;
  if (type === "seller" && pathname === "/seller/products")
    content = <SellerProductsPage />;
  if (type === "seller" && pathname === "/seller/orders")
    content = <SellerOrdersPage />;
  if (type === "seller" && pathname === "/seller/returns")
    content = <SellerSupportPage type="returns" />;
  if (type === "seller" && pathname === "/seller/questions")
    content = <SellerSupportPage type="questions" />;
  if (type === "seller" && pathname === "/seller/reviews")
    content = <SellerSupportPage type="reviews" />;
  if (type === "seller" && pathname === "/seller/settlements")
    content = <SellerFinancePage />;
  if (type === "seller" && pathname === "/seller/analytics")
    content = <SellerAnalyticsPage />;
  if (type === "seller" && pathname === "/seller/store")
    content = <SellerSettingsPage />;
  if (type === "seller" && pathname === "/seller/team")
    content = <SellerSettingsPage teamMode />;
  if (type === "seller" && pathname === "/seller/notifications")
    content = <SellerNotificationsPage />;
  if (type === "seller" && pathname === "/seller/exports")
    content = <SellerExportsPage />;
  return (
    <Portal type={type} nav={type === "seller" ? sellerNav : adminNav}>
      {content}
    </Portal>
  );
}
function Portal({ type, nav, children }) {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [orderCount, setOrderCount] = React.useState(0);
  const [storeName, setStoreName] = React.useState("");
  React.useEffect(() => {
    if (type !== "seller") return;
    const refresh = () => api("/seller/notifications").then(items => setNotificationCount(items.filter(item => !item.read).length)).catch(() => {});
    refresh();
    api("/seller/store").then(store => setStoreName(store.name)).catch(() => {});
    api("/seller/orders").then(items => setOrderCount(items.filter(item => ["PAID", "PROCESSING"].includes(item.status)).length)).catch(() => {});
    window.addEventListener("dt:notifications", refresh);
    return () => window.removeEventListener("dt:notifications", refresh);
  }, [type]);
  return (
    <div className={"portal " + type}>
      <aside className={open ? "open" : ""}>
        <div className="side-head">
          <Brand />
          <button onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <small>
          {type === "seller"
            ? "ESPACE VENDEUR"
            : type === "admin"
              ? "ADMINISTRATION"
              : "MON COMPTE"}
        </small>
        <nav>
          {nav.map(([I, l, u]) => (
            <NavLink
              key={u}
              to={u}
              end={u === "/seller" || u === "/admin" || u === "/account"}
            >
              <I />
              {l}
              {type === "seller" && u === "/seller/orders" && orderCount > 0 && <b className="nav-count">{orderCount}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="side-user">
          <i>{type === "admin" ? "AD" : (storeName || user?.name || "VE").slice(0, 2).toUpperCase()}</i>
          <span>
            <b>
              {type === "admin"
                ? "Administrateur"
                : type === "seller"
                  ? storeName || user?.name || "Ma boutique"
                  : user?.name || "Mon compte"}
            </b>
            <small>
              {type === "seller" ? "Boutique vérifiée" : "Compte actif"}
            </small>
          </span>
          <button className="side-logout" aria-label="Se déconnecter" onClick={() => { logout(); navigate(type === "seller" ? "/vendeur/login" : "/"); }}><LogOut /></button>
        </div>
      </aside>
      <main>
        <header>
          <button onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div>
            <Search />
            <input placeholder="Rechercher…" />
          </div>
          <Link to={type === "seller" ? "/seller/notifications" : "#"} className="portal-bell">
            <Bell />
            {notificationCount > 0 && <i>{notificationCount > 99 ? "99+" : notificationCount}</i>}
          </Link>
          <Link to="/">Voir la boutique</Link>
        </header>
        {children}
      </main>
    </div>
  );
}
function UserAccountContent() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const key = location.pathname.split("/").filter(Boolean).pop() || "account";
  const [profile, setProfile] = React.useState(null);
  const [data, setData] = React.useState([]);
  const [summary, setSummary] = React.useState({
    orders: 0,
    addresses: 0,
    favorites: 0,
    balance: 0,
  });
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    setError("");
    setData([]);
    if (key === "account")
      Promise.all([
        api("/account/profile"),
        api("/orders/my-orders"),
        api("/addresses"),
        api("/favorites"),
        api("/wallet"),
      ])
        .then(([p, o, a, f, w]) => {
          setProfile(p);
          setSummary({
            orders: o.length,
            addresses: a.length,
            favorites: f.length,
            balance: w.balance,
          });
        })
        .catch((e) => setError(e.message));
    else if (key === "addresses")
      api("/addresses")
        .then(setData)
        .catch((e) => setError(e.message));
    else if (key === "favorites")
      api("/favorites")
        .then(setData)
        .catch((e) => setError(e.message));
    else if (key === "orders")
      api("/orders/my-orders")
        .then(setData)
        .catch((e) => setError(e.message));
    else if (key === "returns")
      api("/returns/my")
        .then(setData)
        .catch((e) => setError(e.message));
    else if (key === "reviews")
      api("/reviews/my-reviews")
        .then(setData)
        .catch((e) => setError(e.message));
    else if (key === "questions")
      api("/products/0/questions/mine")
        .then(setData)
        .catch((e) => setError(e.message));
    else if (key === "coupons")
      api("/coupons/active")
        .then(setData)
        .catch((e) => setError(e.message));
    else if (key === "djibpay")
      Promise.all([api("/wallet"), api("/wallet/transactions")])
        .then(([wallet, transactions]) => setData({ wallet, transactions }))
        .catch((e) => setError(e.message));
  }, [key, user, navigate]);
  if (!user) return null;
  return (
    <div className="portal-content">
      <PageTitle
        title={key === "account" ? "Mon profil" : titles[key] || "Mon compte"}
        subtitle={
          key === "account"
            ? "Vos informations, préférences et services DJIB TOUT."
            : undefined
        }
      />
      {error && <div className="api-error">{error}</div>}
      {key === "account" ? (
        <ProfileForm
          profile={profile}
          summary={summary}
          onSaved={setProfile}
          onLogout={() => {
            logout();
            navigate("/");
          }}
        />
      ) : key === "addresses" ? (
        <AddressManager
          items={data}
          reload={() => api("/addresses").then(setData)}
        />
      ) : key === "favorites" ? (
        <ProductGrid items={Array.isArray(data) ? data : []} />
      ) : key === "orders" ? (
        <OrdersPanel orders={data} />
      ) : key === "returns" ? (
        <ReturnsPanel items={data} />
      ) : key === "reviews" ? (
        <ReviewsPanel items={data} />
      ) : key === "questions" ? (
        <QuestionsPanel items={data} />
      ) : key === "coupons" ? (
        <CouponsPanel items={data} />
      ) : key === "djibpay" ? (
        <WalletPanel
          data={data}
          reload={() =>
            Promise.all([api("/wallet"), api("/wallet/transactions")]).then(
              ([wallet, transactions]) => setData({ wallet, transactions }),
            )
          }
        />
      ) : null}
    </div>
  );
}
function ProfileForm({ profile, summary, onSaved, onLogout }) {
  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    birthDate: "",
    preferredLanguage: "fr",
    deliveryInstructions: "",
  });
  const [prefs, setPrefs] = React.useState({
    orderNotifications: true,
    promotionNotifications: false,
  });
  const [message, setMessage] = React.useState("");
  React.useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        phone: profile.phone || "",
        birthDate: profile.birthDate || "",
        preferredLanguage: profile.preferredLanguage || "fr",
        deliveryInstructions: profile.deliveryInstructions || "",
      });
      setPrefs({
        orderNotifications: profile.orderNotifications,
        promotionNotifications: profile.promotionNotifications,
      });
    }
  }, [profile]);
  if (!profile)
    return <div className="catalog-message">Chargement du profil…</div>;
  const initials = (profile.name || "Client")
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
  const completeness = Math.round(
    ([
      profile.name,
      profile.email,
      profile.phone,
      profile.emailVerified,
      profile.birthDate,
      profile.deliveryInstructions,
    ].filter(Boolean).length /
      6) *
      100,
  );
  async function save(e) {
    e.preventDefault();
    const value = await api("/account/profile", {
      method: "PUT",
      body: JSON.stringify(form),
    });
    onSaved(value);
    setMessage("Informations personnelles enregistrées.");
  }
  async function savePrefs(next) {
    setPrefs(next);
    const value = await api("/account/preferences", {
      method: "PUT",
      body: JSON.stringify(next),
    });
    onSaved(value);
    setMessage("Préférences mises à jour.");
  }
  async function exportData() {
    const value = await api("/account/export");
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "djibtout-mes-donnees.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="profile-layout">
      <section className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div>
          <span>Compte client</span>
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>
          <div className="profile-badges">
            <b className={profile.emailVerified ? "verified" : "pending"}>
              {profile.emailVerified ? "✓ E-mail vérifié" : "E-mail à vérifier"}
            </b>
            <b>
              Membre depuis{" "}
              {profile.createdAt
                ? new Date(profile.createdAt).getFullYear()
                : "2026"}
            </b>
          </div>
        </div>
        <div className="completion">
          <strong>{completeness}%</strong>
          <span>Profil complété</span>
          <i>
            <b style={{ width: completeness + "%" }} />
          </i>
          <small>
            Complétez vos informations pour accélérer vos commandes.
          </small>
        </div>
      </section>
      <section className="profile-stats">
        {[
          [ClipboardList, summary.orders, "Commandes", "/account/orders"],
          [Heart, summary.favorites, "Favoris", "/account/favorites"],
          [Home, summary.addresses, "Adresses", "/account/addresses"],
          [Wallet, money(summary.balance), "DjibPay", "/account/djibpay"],
        ].map(([I, v, l, u]) => (
          <Link to={u} key={l}>
            <I />
            <span>
              <strong>{v}</strong>
              <small>{l}</small>
            </span>
            <ChevronRight />
          </Link>
        ))}
      </section>
      {message && <div className="api-success">{message}</div>}
      <div className="profile-columns">
        <form className="form-card account-form advanced" onSubmit={save}>
          <div className="card-heading">
            <div>
              <h2>Informations personnelles</h2>
              <p>Utilisées pour vos commandes et livraisons.</p>
            </div>
            <UserRound />
          </div>
          <div className="form-grid">
            <Field
              label="Nom complet"
              value={form.name}
              onChange={(name) => setForm({ ...form, name })}
            />
            <Field
              label="Téléphone"
              value={form.phone}
              onChange={(phone) => setForm({ ...form, phone })}
            />
            <Field
              label="Date de naissance"
              type="date"
              value={form.birthDate}
              onChange={(birthDate) => setForm({ ...form, birthDate })}
            />
            <label className="field">
              <span>Langue préférée</span>
              <select
                value={form.preferredLanguage}
                onChange={(e) =>
                  setForm({ ...form, preferredLanguage: e.target.value })
                }
              >
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
          <label className="field delivery-note">
            <span>Instructions de livraison</span>
            <textarea
              value={form.deliveryInstructions}
              onChange={(e) =>
                setForm({ ...form, deliveryInstructions: e.target.value })
              }
              placeholder="Repère, étage, disponibilité ou consigne pour le livreur…"
              maxLength="500"
            />
          </label>
          <div className="account-actions">
            <button>Enregistrer les modifications</button>
          </div>
        </form>
        <section className="form-card preferences">
          <div className="card-heading">
            <div>
              <h2>Compte et préférences</h2>
              <p>{profile.email} · Acheteur</p>
            </div>
            <Bell />
          </div>
          <label>
            <span>
              <b>Suivi des commandes</b>
              <small>Confirmation, expédition et livraison.</small>
            </span>
            <input
              type="checkbox"
              checked={prefs.orderNotifications}
              onChange={(e) =>
                savePrefs({ ...prefs, orderNotifications: e.target.checked })
              }
            />
          </label>
          <label>
            <span>
              <b>Promotions et nouveautés</b>
              <small>Offres locales et ventes flash.</small>
            </span>
            <input
              type="checkbox"
              checked={prefs.promotionNotifications}
              onChange={(e) =>
                savePrefs({
                  ...prefs,
                  promotionNotifications: e.target.checked,
                })
              }
            />
          </label>
        </section>
      </div>
      <section className="profile-services">
        <div>
          <ShieldCheck />
          <span>
            <b>Sécurité du compte</b>
            <small>Modifiez votre mot de passe en toute sécurité.</small>
          </span>
          <Link to="/forgot-password">Modifier le mot de passe</Link>
        </div>
        <div>
          <FileText />
          <span>
            <b>Vos données</b>
            <small>Téléchargez votre profil, adresses et commandes.</small>
          </span>
          <button onClick={exportData}>Télécharger</button>
        </div>
        <div>
          <LogOut />
          <span>
            <b>Fin de session</b>
            <small>Déconnectez-vous de cet appareil.</small>
          </span>
          <button onClick={onLogout}>Se déconnecter</button>
        </div>
      </section>
    </div>
  );
}
function AddressManager({ items, reload }) {
  const empty = {
    label: "Domicile",
    fullAddress: "",
    city: "Djibouti-ville",
    phone: "",
    deliveryInstructions: "",
    isDefault: false,
  };
  const [editing, setEditing] = React.useState(null);
  const [deleting, setDeleting] = React.useState(null);
  const [form, setForm] = React.useState(empty);
  function edit(a = null) {
    setEditing(a?.id || "new");
    setForm(
      a
        ? {
            label: a.label,
            fullAddress: a.fullAddress,
            city: a.city,
            phone: a.phone || "",
            deliveryInstructions: a.deliveryInstructions || "",
            isDefault: a.default,
          }
        : empty,
    );
  }
  async function save(e) {
    e.preventDefault();
    await api(editing === "new" ? "/addresses" : "/addresses/" + editing, {
      method: editing === "new" ? "POST" : "PUT",
      body: JSON.stringify(form),
    });
    setEditing(null);
    setForm(empty);
    reload();
  }
  async function remove() {
    await api("/addresses/" + deleting.id, { method: "DELETE" });
    setDeleting(null);
    reload();
  }
  return (
    <>
      <div className="address-grid">
        {items.map((a) => (
          <article key={a.id}>
            <label>
              {a.label}
              {a.default && " · Par défaut"}
            </label>
            <b>{a.city}</b>
            <p>
              {a.fullAddress}
              {a.phone && (
                <>
                  <br />
                  📞 {a.phone}
                </>
              )}
              {a.deliveryInstructions && (
                <>
                  <br />
                  <small>Consigne : {a.deliveryInstructions}</small>
                </>
              )}
            </p>
            <div className="address-actions">
              <button onClick={() => edit(a)}>Modifier</button>
              <button onClick={() => setDeleting(a)}>Supprimer</button>
            </div>
          </article>
        ))}
        <button className="new-address" onClick={() => edit()}>
          + Ajouter une adresse
        </button>
      </div>
      {editing && (
        <form className="form-card address-form" onSubmit={save}>
          <h2>
            {editing === "new" ? "Nouvelle adresse" : "Modifier l’adresse"}
          </h2>
          <div className="form-grid">
            <Field
              label="Libellé"
              value={form.label}
              onChange={(label) => setForm({ ...form, label })}
            />
            <Field
              label="Ville"
              value={form.city}
              onChange={(city) => setForm({ ...form, city })}
            />
            <Field
              label="Téléphone du destinataire"
              value={form.phone}
              onChange={(phone) => setForm({ ...form, phone })}
            />
          </div>
          <label className="field">
            <span>Adresse complète</span>
            <textarea
              value={form.fullAddress}
              onChange={(e) =>
                setForm({ ...form, fullAddress: e.target.value })
              }
              required
            />
          </label>
          <label className="field">
            <span>Instructions pour le livreur</span>
            <textarea
              value={form.deliveryInstructions}
              onChange={(e) =>
                setForm({ ...form, deliveryInstructions: e.target.value })
              }
              placeholder="Repère, étage, horaires…"
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) =>
                setForm({ ...form, isDefault: e.target.checked })
              }
            />{" "}
            Définir comme adresse par défaut
          </label>
          <button>Enregistrer l'adresse</button>
        </form>
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Supprimer cette adresse ?"
        description={
          deleting ? `${deleting.label} — ${deleting.fullAddress}` : ""
        }
        confirmLabel="Supprimer l’adresse"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </>
  );
}
function OrdersPanel({ orders = [] }) {
  const [values, setValues] = React.useState(orders);
  const [cancelling, setCancelling] = React.useState(null);
  React.useEffect(() => setValues(orders), [orders]);
  async function cancel() {
    await api(`/orders/${cancelling.id}/cancel`, { method: "POST" });
    setValues((x) =>
      x.map((o) =>
        o.id === cancelling.id ? { ...o, status: "CANCELLED" } : o,
      ),
    );
    setCancelling(null);
  }
  return (
    <>
      <div className="order-list">
        {!values.length && (
          <div className="catalog-message">
            Vous n'avez encore aucune commande.
          </div>
        )}
        {values.map((o) => (
          <article key={o.id}>
            <header>
              <span>
                <small>Commande</small>
                <b>#DT-{o.id}</b>
              </span>
              <span>
                <small>Passée le</small>
                <b>{new Date(o.createdAt).toLocaleDateString("fr-FR")}</b>
              </span>
              <em>{statusLabel(o.status)}</em>
            </header>
            <div className="order-products">
              <span>
                <b>{o.items?.length || 0} article(s)</b>
                <small>{o.deliveryAddress}</small>
              </span>
              <strong>{money(o.totalAmount)}</strong>
            </div>
            <footer>
              <Link to={"/orders/" + o.id}>Voir le détail et le suivi</Link>
              {["PENDING", "PROCESSING"].includes(o.status) && (
                <button onClick={() => setCancelling(o)}>
                  Annuler la commande
                </button>
              )}
            </footer>
          </article>
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Annuler cette commande ?"
        description={
          cancelling
            ? `La commande #DT-${cancelling.id} sera annulée et le stock sera libéré.`
            : ""
        }
        confirmLabel="Annuler la commande"
        danger
        onCancel={() => setCancelling(null)}
        onConfirm={cancel}
      />
    </>
  );
}
function ReturnsPanel({ items = [] }) {
  return (
    <div className="support-list">
      {!items.length && (
        <div className="catalog-message">Aucune demande de retour.</div>
      )}
      {items.map((x) => (
        <article key={x.id}>
          <div className="support-icon">
            <Truck />
          </div>
          <div>
            <small>Retour #{x.id}</small>
            <h3>{x.orderItem?.product?.name || "Article retourné"}</h3>
            <p>{x.reason}</p>
            {x.sellerResponse && (
              <blockquote>Réponse du vendeur : {x.sellerResponse}</blockquote>
            )}
          </div>
          <span className="status">
            {{
              REQUESTED: "Demandé",
              APPROVED: "Accepté",
              REJECTED: "Refusé",
              RECEIVED: "Reçu",
              REFUNDED: "Remboursé",
            }[x.status] || x.status}
          </span>
          <strong>{money(x.refundAmount)}</strong>
        </article>
      ))}
    </div>
  );
}
function ReviewsPanel({ items = [] }) {
  return (
    <div className="support-list">
      {!items.length && (
        <div className="catalog-message">Vous n'avez publié aucun avis.</div>
      )}
      {items.map((x) => (
        <article key={x.id}>
          <div className="support-icon">
            {imageUrl(x.product) ? (
              <img src={imageUrl(x.product)} alt="" />
            ) : (
              <Star />
            )}
          </div>
          <div>
            <small>{x.product?.name}</small>
            <div className="review-stars">
              {"★".repeat(x.rating)}
              {"☆".repeat(5 - x.rating)}
            </div>
            <p>{x.comment}</p>
            {x.sellerResponse && (
              <blockquote>Réponse du vendeur : {x.sellerResponse}</blockquote>
            )}
          </div>
          <span>{new Date(x.createdAt).toLocaleDateString("fr-FR")}</span>
        </article>
      ))}
    </div>
  );
}
function QuestionsPanel({ items = [] }) {
  return (
    <div className="support-list">
      {!items.length && (
        <div className="catalog-message">Vous n'avez posé aucune question.</div>
      )}
      {items.map((x) => (
        <article key={x.id}>
          <div className="support-icon">
            <MessageSquare />
          </div>
          <div>
            <small>{x.product?.name}</small>
            <h3>{x.question}</h3>
            {x.answer ? (
              <blockquote>
                <b>Réponse :</b> {x.answer}
              </blockquote>
            ) : (
              <p>Le vendeur n'a pas encore répondu.</p>
            )}
          </div>
          <span className="status">{x.answer ? "Répondue" : "En attente"}</span>
        </article>
      ))}
    </div>
  );
}
function CouponsPanel({ items = [] }) {
  function copy(code) {
    navigator.clipboard?.writeText(code);
  }
  return (
    <div className="coupon-grid">
      {!items.length && (
        <div className="catalog-message">
          Aucun coupon disponible actuellement.
        </div>
      )}
      {items.map((x) => (
        <article key={x.id}>
          <div>
            <Tags />
            <span>
              <small>CODE PROMO</small>
              <strong>{x.code}</strong>
            </span>
          </div>
          <h3>
            {x.discountType === "PERCENTAGE"
              ? `${x.discountValue}% de réduction`
              : `${money(x.discountValue)} de réduction`}
          </h3>
          <p>
            {x.expiresAt
              ? `Valable jusqu'au ${new Date(x.expiresAt).toLocaleDateString("fr-FR")}`
              : "Sans date d’expiration"}
          </p>
          <button onClick={() => copy(x.code)}>Copier le code</button>
        </article>
      ))}
    </div>
  );
}
function ListsPanel({ items = [], reload }) {
  const [name, setName] = React.useState("");
  const [productIds, setProductIds] = React.useState({});
  const [error, setError] = React.useState("");
  async function run(action) {
    try {
      setError("");
      await action();
      await reload();
    } catch (e) {
      setError(e.message);
    }
  }
  async function create(e) {
    e.preventDefault();
    await run(() =>
      api("/lists", { method: "POST", body: JSON.stringify({ name }) }),
    );
    setName("");
  }
  async function rename(x) {
    const next = prompt("Nouveau nom de la liste", x.name);
    if (next)
      run(() =>
        api("/lists/" + x.id, {
          method: "PUT",
          body: JSON.stringify({ name: next }),
        }),
      );
  }
  async function remove(id) {
    if (confirm("Supprimer cette liste ?"))
      run(() => api("/lists/" + id, { method: "DELETE" }));
  }
  async function addProduct(id) {
    const productId = Number(productIds[id]);
    if (productId > 0) {
      await run(() =>
        api(`/lists/${id}/products/${productId}`, { method: "POST" }),
      );
      setProductIds((v) => ({ ...v, [id]: "" }));
    }
  }
  return (
    <>
      {error && <div className="api-error">{error}</div>}
      <form className="list-create" onSubmit={create}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la nouvelle liste"
          required
        />
        <button>Créer une liste</button>
      </form>
      <div className="list-grid">
        {items.map((x) => (
          <article key={x.id}>
            <FileText />
            <div>
              <h3>{x.name}</h3>
              <p>{x.productIds?.length || 0} produit(s)</p>
              <div className="list-products">
                {x.productIds?.map((id) => (
                  <span key={id}>
                    <Link to={"/product/" + id}>Produit #{id}</Link>
                    <button
                      title="Retirer"
                      onClick={() =>
                        run(() =>
                          api(`/lists/${x.id}/products/${id}`, {
                            method: "DELETE",
                          }),
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="list-add">
                <input
                  type="number"
                  min="1"
                  value={productIds[x.id] || ""}
                  onChange={(e) =>
                    setProductIds((v) => ({ ...v, [x.id]: e.target.value }))
                  }
                  placeholder="ID du produit"
                />
                <button onClick={() => addProduct(x.id)}>Ajouter</button>
              </div>
            </div>
            <button onClick={() => rename(x)}>Renommer</button>
            <button onClick={() => remove(x.id)}>Supprimer</button>
          </article>
        ))}
      </div>
    </>
  );
}
function ListsPage() {
  const [items, setItems] = React.useState([]);
  const load = () => api("/lists").then(setItems);
  React.useEffect(load, []);
  return (
    <Protected>
      <Portal type="account" nav={accountNav}>
        <div className="portal-content">
          <PageTitle
            title="Mes listes"
            subtitle="Organisez les produits que vous souhaitez retrouver plus tard."
          />
          <ListsPanel items={items} reload={load} />
        </div>
      </Portal>
    </Protected>
  );
}
function WalletPanel({ data, reload }) {
  const [amount, setAmount] = React.useState("");
  if (!data?.wallet)
    return <div className="catalog-message">Chargement du portefeuille…</div>;
  async function topup(e) {
    e.preventDefault();
    await api("/wallet/topup", {
      method: "POST",
      body: JSON.stringify({ amount: Number(amount) }),
    });
    setAmount("");
    reload();
  }
  return (
    <div className="wallet-layout">
      <section className="wallet-card">
        <small>Solde disponible</small>
        <strong>{money(data.wallet.balance)}</strong>
        <span>DJIBPAY</span>
      </section>
      <form className="form-card" onSubmit={topup}>
        <h2>Recharger le portefeuille</h2>
        <Field
          label="Montant en FDJ"
          type="number"
          value={amount}
          onChange={setAmount}
        />
        <button>Recharger</button>
      </form>
      <section className="panel transactions">
        <h2>Dernières opérations</h2>
        {(data.transactions || []).map((t) => (
          <p key={t.id}>
            <span>
              {t.reason}
              <small>{new Date(t.createdAt).toLocaleDateString("fr-FR")}</small>
            </span>
            <b className={t.type === "CREDIT" ? "positive" : ""}>
              {t.type === "CREDIT" ? "+" : "−"} {money(t.amount)}
            </b>
          </p>
        ))}
      </section>
    </div>
  );
}
const statusLabel = (s) =>
  ({
    PENDING: "En attente",
    PROCESSING: "En préparation",
    SHIPPED: "Expédiée",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
  })[s] || s;
function PortalContent({ type = "account" }) {
  const location = useLocation();
  const key = location.pathname.split("/").filter(Boolean).pop() || type;
  const root = key === type;
  const title = root
    ? type === "seller"
      ? "Bonjour, Djib Electronics 👋"
      : type === "admin"
        ? "Vue générale de l'activité"
        : "Bonjour, Ayan 👋"
    : titles[key] || key;
  if (!root)
    return (
      <div className="portal-content">
        <PageTitle title={title} />
        {key === "products" ? (
          <>
            <div className="toolbar-new">
              <input placeholder="Rechercher un produit…" />
              <button>+ Nouveau produit</button>
            </div>
            <DataTable
              rows={products
                .slice(0, 6)
                .map((p, i) => [
                  p[0] + " " + p[1],
                  p[2],
                  p[3],
                  i % 2 ? "12" : "28",
                  "Actif",
                ])}
            />
          </>
        ) : key === "addresses" ? (
          <AddressCards />
        ) : key === "favorites" ? (
          <ProductGrid />
        ) : key === "store" ? (
          <StoreForm />
        ) : (
          <GenericManagement name={title} />
        )}
      </div>
    );
  return (
    <div className="portal-content">
      <PageTitle
        title={title}
        subtitle={
          type === "account"
            ? "Gérez votre activité et vos informations personnelles."
            : "Voici ce qui se passe aujourd’hui sur DJIB TOUT."
        }
      />
      <div className="kpis">
        {(type === "account"
          ? [
              ["6", "Commandes"],
              ["3", "Favoris"],
              ["12 500 FDJ", "Solde DjibPay"],
              ["2", "Coupons"],
            ]
          : type === "seller"
            ? [
                ["187 500 FDJ", "Chiffre d'affaires"],
                ["24", "Nouvelles commandes"],
                ["68", "Produits actifs"],
                ["4,8/5", "Note moyenne"],
              ]
            : [
                ["12 482", "Utilisateurs"],
                ["384", "Vendeurs actifs"],
                ["2,8 M FDJ", "Volume du jour"],
                ["96", "Commandes du jour"],
              ]
        ).map((x, i) => (
          <article key={x[1]}>
            <i>
              {[ShoppingBag, ClipboardList, CircleDollarSign, Star].map(
                (I, j) => j === i && <I key={j} />,
              )}
            </i>
            <span>
              <small>{x[1]}</small>
              <b>{x[0]}</b>
              <em>+{i + 4},2 % ce mois</em>
            </span>
          </article>
        ))}
      </div>
      <div className="dash-grid">
        <section className="panel">
          <h2>Activité récente</h2>
          <DataTable
            rows={products
              .slice(0, 5)
              .map((p, i) => [
                "#DT-2026-" + (1048 - i),
                p[2],
                p[3],
                i % 2 ? "En préparation" : "Livrée",
              ])}
          />
        </section>
        <section className="panel">
          <h2>Actions rapides</h2>
          {[
            "Ajouter un produit",
            "Voir les commandes",
            "Répondre aux clients",
            "Mettre à jour la boutique",
          ].map((x) => (
            <button className="quick" key={x}>
              {x}
              <ChevronRight />
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
function PageTitle({ title, subtitle }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <button>Exporter</button>
    </div>
  );
}
function DataTable({ rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {["Référence", "Détail", "Montant", "Statut", ""]
              .slice(0, rows[0]?.length || 4)
              .map((h, i) => (
                <th key={i}>{h}</th>
              ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>
                  {j === r.length - 1 ? <span className="status">{c}</span> : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function GenericManagement({ name }) {
  return (
    <>
      <div className="toolbar-new">
        <input placeholder={"Rechercher dans " + name.toLowerCase() + "…"} />
        <select>
          <option>Tous les statuts</option>
          <option>Actif</option>
          <option>En attente</option>
        </select>
        <button>+ Ajouter</button>
      </div>
      <div className="panel">
        <DataTable
          rows={products
            .slice(0, 6)
            .map((p, i) => [
              "#DT-" + (2500 + i),
              p[1],
              p[3],
              i % 3 === 0 ? "En attente" : "Actif",
            ])}
        />
      </div>
    </>
  );
}
function AddressCards() {
  return (
    <div className="address-grid">
      {[
        ["Domicile", "Ayan Mohamed", "Rue de Genève, Héron", "77 00 00 00"],
        ["Bureau", "Ayan Mohamed", "Place Lagarde, Plateau", "77 00 00 00"],
      ].map((a) => (
        <article key={a[0]}>
          <label>{a[0]}</label>
          <b>{a[1]}</b>
          <p>
            {a[2]}
            <br />
            Djibouti-ville
            <br />
            {a[3]}
          </p>
          <button>Modifier</button>
        </article>
      ))}
      <button className="new-address">+ Ajouter une adresse</button>
    </div>
  );
}
function StoreForm() {
  return (
    <div className="form-card store-form">
      <div className="store-cover">
        <span>📱</span>
      </div>
      <div className="form-grid">
        <Field label="Nom de la boutique" value="Djib Electronics" />
        <Field label="Téléphone professionnel" value="77 00 00 00" />
        <Field label="Catégorie" value="Téléphones & accessoires" />
        <Field label="Quartier" value="Centre-ville" />
      </div>
      <label className="field">
        <span>Description</span>
        <textarea defaultValue="Votre spécialiste local en téléphones, accessoires et électronique." />
      </label>
      <button>Enregistrer les modifications</button>
    </div>
  );
}
function Orders() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [orders, setOrders] = React.useState([]);
  const [error, setError] = React.useState("");
  const [params] = useSearchParams();
  React.useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    api("/orders/my-orders")
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, [user, navigate]);
  return (
    <Shop>
      <Crumb current="Mes commandes" />
      <main className="shell page-space">
        <h1>Mes commandes</h1>
        {params.get("success") && (
          <div className="api-success">
            Commande #{params.get("success")} confirmée avec succès.
          </div>
        )}
        {error && <div className="api-error">{error}</div>}
        <OrdersPanel orders={orders} />
      </main>
    </Shop>
  );
}
function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = React.useState(null);
  const [message, setMessage] = React.useState("");
  React.useEffect(() => {
    api("/orders/" + id)
      .then(setOrder)
      .catch((e) => setMessage(e.message));
  }, [id]);
  if (!order)
    return (
      <Shop>
        <main className="notfound">
          <p>{message || "Chargement de la commande…"}</p>
        </main>
      </Shop>
    );
  const steps = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"],
    current = steps.indexOf(order.status);
  return (
    <Shop>
      <Crumb current={"Commande #DT-" + order.id} />
      <main className="shell page-space order-detail">
        <div className="order-detail-head">
          <div>
            <small>
              Commande du{" "}
              {new Date(order.createdAt).toLocaleDateString("fr-FR")}
            </small>
            <h1>Commande #DT-{order.id}</h1>
          </div>
          <span className="status">{statusLabel(order.status)}</span>
        </div>
        <section className="tracking">
          <h2>Suivi de la commande</h2>
          <div>
            {steps.map((s, i) => (
              <span className={i <= current ? "done" : ""} key={s}>
                <i>{i < current ? "✓" : i + 1}</i>
                <b>{statusLabel(s)}</b>
              </span>
            ))}
          </div>
        </section>
        <div className="order-detail-grid">
          <section className="panel">
            <h2>Articles commandés</h2>
            {order.items?.map((item) => (
              <article className="detail-item" key={item.id}>
                <div>
                  {imageUrl(item.product) ? (
                    <img src={imageUrl(item.product)} alt="" />
                  ) : (
                    "📦"
                  )}
                </div>
                <span>
                  <b>{item.product.name}</b>
                  <small>Quantité : {item.quantity}</small>
                  <strong>{money(Number(item.price) * item.quantity)}</strong>
                </span>
                {order.status === "DELIVERED" && (
                  <footer>
                    <ReviewButton item={item} />
                    <ReturnButton order={order} item={item} />
                  </footer>
                )}
              </article>
            ))}
          </section>
          <aside className="panel order-meta">
            <h2>Livraison et paiement</h2>
            <p>
              <small>Adresse</small>
              <b>{order.deliveryAddress}</b>
            </p>
            <p>
              <small>Livraison</small>
              <b>{order.deliveryMethod}</b>
            </p>
            <p>
              <small>Paiement</small>
              <b>{order.paymentMethod}</b>
            </p>
            <hr />
            <p className="total">
              <small>Total</small>
              <b>{money(order.totalAmount)}</b>
            </p>
          </aside>
        </div>
      </main>
    </Shop>
  );
}
function ReviewButton({ item }) {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [done, setDone] = React.useState(false);
  async function send(e) {
    e.preventDefault();
    await api(`/products/${item.product.id}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating: Number(rating), comment }),
    });
    setOpen(false);
    setDone(true);
  }
  return (
    <>
      {done ? (
        <span className="positive">Avis publié</span>
      ) : (
        <button onClick={() => setOpen(true)}>Donner mon avis</button>
      )}
      {open && (
        <div className="modal-backdrop">
          <form className="action-modal" onSubmit={send}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
            <h2>Donner votre avis</h2>
            <label className="field">
              <span>Note</span>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                {[5, 4, 3, 2, 1].map((x) => (
                  <option key={x} value={x}>
                    {x} étoile{x > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Commentaire</span>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
            <button className="primary-action">Publier</button>
          </form>
        </div>
      )}
    </>
  );
}
function ReturnButton({ order, item }) {
  const [open, setOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [reason, setReason] = React.useState("Produit non conforme");
  const [done, setDone] = React.useState(false);
  const close = React.useCallback(() => {
    setOpen(false);
    setConfirming(false);
  }, []);
  React.useEffect(() => {
    if (!open) return;
    const key = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, close]);
  async function send() {
    await api("/returns", {
      method: "POST",
      body: JSON.stringify({
        orderId: order.id,
        orderItemId: item.id,
        quantity: 1,
        reason,
        comment: "",
        evidenceUrls: [],
      }),
    });
    close();
    setDone(true);
  }
  return (
    <>
      {done ? (
        <span className="positive">Retour demandé</span>
      ) : (
        <button onClick={() => setOpen(true)}>Demander un retour</button>
      )}
      {open && !confirming && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <form
            className="action-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-title"
            onSubmit={(e) => {
              e.preventDefault();
              setConfirming(true);
            }}
          >
            <button
              type="button"
              aria-label="Fermer"
              className="modal-close"
              onClick={close}
            >
              ×
            </button>
            <h2 id="return-title">Demander un retour</h2>
            <label className="field">
              <span>Motif</span>
              <select
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option>Produit non conforme</option>
                <option>Produit endommagé</option>
                <option>Mauvais article reçu</option>
                <option>Autre</option>
              </select>
            </label>
            <button className="primary-action">Continuer</button>
          </form>
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        title="Confirmer la demande de retour ?"
        description={`Article : ${item.product.name}. Motif : ${reason}.`}
        confirmLabel="Envoyer la demande"
        onCancel={() => setConfirming(false)}
        onConfirm={send}
      />
    </>
  );
}
function PaymentHistory() {
  const [items, setItems] = React.useState([]);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    api("/payments/my/history")
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <Shop>
      <Crumb current="Mes paiements" />
      <main className="shell page-space">
        <h1>Historique des paiements</h1>
        {error && <div className="api-error">{error}</div>}
        <div className="support-list">
          {!items.length && !error && (
            <div className="catalog-message">Aucun paiement enregistré.</div>
          )}
          {items.map((p) => (
            <article key={p.id}>
              <div className="support-icon">
                <CreditCard />
              </div>
              <div>
                <small>Commande #DT-{p.orderId}</small>
                <h3>{p.paymentMethod}</h3>
                <p>
                  {p.transactionId ||
                    p.failureReason ||
                    "Transaction sans référence"}
                </p>
              </div>
              <span className={"payment-status " + p.status.toLowerCase()}>
                {p.status === "SUCCESS"
                  ? "Réussi"
                  : p.status === "FAILED"
                    ? "Refusé"
                    : "En attente"}
              </span>
              <strong>{money(p.amount)}</strong>
            </article>
          ))}
        </div>
      </main>
    </Shop>
  );
}
function VerifyEmail() {
  const [params] = useSearchParams();
  const [token, setToken] = React.useState(params.get("token") || "");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  async function submit(e) {
    e.preventDefault();
    try {
      const value = await api("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setMessage(value.message);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="auth-page">
      <aside>
        <Brand />
        <div>
          <span>Sécurité du compte</span>
          <h1>
            Vérifiez votre
            <br />
            adresse e-mail.
          </h1>
          <p>
            La vérification protège vos commandes et facilite la récupération du
            compte.
          </p>
        </div>
      </aside>
      <main>
        <form className="auth-card" onSubmit={submit}>
          <h1>Vérification e-mail</h1>
          <p>Collez le jeton reçu dans votre lien de vérification.</p>
          {message && <div className="api-success">{message}</div>}
          {error && <div className="api-error">{error}</div>}
          <Field
            label="Jeton de vérification"
            value={token}
            onChange={setToken}
          />
          <button>Vérifier mon e-mail</button>
          <small>
            <Link to="/login">Retour à la connexion</Link>
          </small>
        </form>
      </main>
    </div>
  );
}
function ResetPassword() {
  const [params] = useSearchParams();
  const urlToken = params.get("token") || "";
  const [token, setToken] = React.useState(urlToken);
  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  async function submit(e) {
    e.preventDefault();
    if (password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const value = await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setMessage(value.message);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <aside>
        <Brand />
        <div>
          <span>Sécurité du compte</span>
          <h1>Choisissez un nouveau mot de passe.</h1>
          <p>
            Utilisez au moins huit caractères et évitez un ancien mot de passe.
          </p>
        </div>
      </aside>
      <main>
        <form className="auth-card" onSubmit={submit}>
          <h1>Nouveau mot de passe</h1>
          <p>
            Le lien sécurisé a été reconnu. Saisissez votre nouveau mot de
            passe.
          </p>
          {message && (
            <div className="api-success">
              {message} <Link to="/login">Se connecter</Link>
            </div>
          )}
          {error && <div className="api-error">{error}</div>}
          {!urlToken && (
            <Field
              label="Jeton de réinitialisation"
              value={token}
              onChange={setToken}
            />
          )}
          <Field
            label="Nouveau mot de passe"
            type="password"
            value={password}
            onChange={setPassword}
          />
          <Field
            label="Confirmer le mot de passe"
            type="password"
            value={confirmation}
            onChange={setConfirmation}
          />
          <button disabled={busy}>
            {busy ? "Modification…" : "Modifier le mot de passe"}
          </button>
        </form>
      </main>
    </div>
  );
}
function Confirmation() {
  const [params] = useSearchParams();
  const id = params.get("order");
  const status = params.get("status") || "SUCCESS";
  const ref = params.get("ref");
  const amount = params.get("amount");
  return (
    <Shop>
      <main className="confirmation-page">
        <div
          className={
            status === "SUCCESS"
              ? "confirm-icon success"
              : "confirm-icon failed"
          }
        >
          {status === "SUCCESS" ? "✓" : "!"}
        </div>
        <span>
          {status === "SUCCESS" ? "COMMANDE CONFIRMÉE" : "PAIEMENT REFUSÉ"}
        </span>
        <h1>
          {status === "SUCCESS"
            ? "Merci pour votre commande !"
            : "Le paiement n’a pas abouti"}
        </h1>
        <p>
          {status === "SUCCESS"
            ? `Votre commande #DT-${id} a bien été enregistrée.`
            : "Aucun débit n’a été effectué. Vous pouvez réessayer avec un autre moyen de paiement."}
        </p>
        {(ref || amount) && (
          <div className="confirm-ref">
            {ref && (
              <>
                <small>Référence de transaction</small>
                <b>{ref}</b>
              </>
            )}
            {amount && (
              <>
                <small>Montant</small>
                <b>{money(Number(amount))}</b>
              </>
            )}
          </div>
        )}
        <div>
          <Link to={status === "SUCCESS" ? "/orders/" + id : "/checkout"}>
            {status === "SUCCESS"
              ? "Suivre ma commande"
              : "Réessayer le paiement"}
          </Link>
          <Link to="/">Retour à l’accueil</Link>
        </div>
      </main>
    </Shop>
  );
}
function CheckoutV2() {
  const { cart, setCart } = useUser();
  const navigate = useNavigate();
  const [addresses, setAddresses] = React.useState([]);
  const [addressId, setAddressId] = React.useState("");
  const [method, setMethod] = React.useState("WAAFI");
  const [phone, setPhone] = React.useState("");
  const [coupon, setCoupon] = React.useState("");
  const [discount, setDiscount] = React.useState(0);
  const [delivery, setDelivery] = React.useState("STANDARD");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const subtotal = cart.reduce(
    (n, x) => n + Number(x.product.price) * x.quantity,
    0,
  );
  const fee = delivery === "EXPRESS" ? 3000 : subtotal >= 50000 ? 0 : 1500;
  React.useEffect(() => {
    api("/addresses")
      .then((x) => {
        setAddresses(x);
        const d = x.find((a) => a.default) || x[0];
        if (d) setAddressId(String(d.id));
      })
      .catch((e) => setError(e.message));
  }, []);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const order = await api("/orders/create", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          paymentMethod: method,
          addressId: Number(addressId),
          couponCode: coupon || null,
          deliveryMethod: delivery,
          items: cart.map((x) => ({
            productId: x.product.id,
            variantId: x.variant?.id || null,
            quantity: x.quantity,
          })),
        }),
      });
      let ref = "CASH-" + order.orderId;
      if (method !== "CASH") {
        const paid = await api("/payments/process", {
          method: "POST",
          body: JSON.stringify({
            orderId: order.orderId,
            paymentMethod: method,
            phoneNumber: method === "DJIBPAY" ? null : phone,
            amount: order.totalAmount,
          }),
        });
        if (!paid.success) {
          navigate(
            `/confirmation?order=${order.orderId}&status=FAILED&amount=${order.totalAmount}`,
          );
          return;
        }
        ref = paid.transactionId;
      }
      setCart([]);
      navigate(
        `/confirmation?order=${order.orderId}&status=SUCCESS&ref=${encodeURIComponent(ref)}&amount=${order.totalAmount}`,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!cart.length)
    return (
      <Shop>
        <main className="empty-state">
          <ShoppingCart />
          <h2>Votre panier est vide</h2>
          <Link to="/search">Retour au catalogue</Link>
        </main>
      </Shop>
    );
  return (
    <Shop>
      <main className="shell checkout">
        <div>
          <Crumb current="Paiement" />
          <h1>Finaliser votre commande</h1>
          {error && <div className="api-error">{error}</div>}
          <FormCard title="1. Adresse de livraison">
            {addresses.length ? (
              <div className="address-select">
                {addresses.map((a) => (
                  <label key={a.id}>
                    <input
                      type="radio"
                      name="address"
                      value={a.id}
                      checked={addressId === String(a.id)}
                      onChange={(e) => setAddressId(e.target.value)}
                    />
                    <span>
                      <b>
                        {a.label}
                        {a.default && " · Par défaut"}
                      </b>
                      <small>
                        {a.fullAddress}, {a.city}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="api-error">
                Ajoutez d'abord une adresse.{" "}
                <Link to="/account/addresses">Ajouter</Link>
              </div>
            )}
          </FormCard>
          <FormCard title="2. Livraison">
            <div className="pay-choices">
              {[
                [
                  "STANDARD",
                  "Standard",
                  subtotal >= 50000 ? "Gratuite" : "1 500 FDJ",
                ],
                ["EXPRESS", "Express", "3 000 FDJ"],
              ].map((x) => (
                <label key={x[0]}>
                  <input
                    type="radio"
                    name="delivery"
                    checked={delivery === x[0]}
                    onChange={() => setDelivery(x[0])}
                  />
                  <b>{x[1]}</b>
                  <small>{x[2]}</small>
                </label>
              ))}
            </div>
          </FormCard>
          <FormCard title="3. Paiement">
            <div className="pay-choices">
              {[
                ["WAAFI", "Waafi"],
                ["DMONEY", "D-Money"],
                ["DJIBPAY", "DjibPay"],
                ["CASH", "Espèces"],
              ].map((x) => (
                <label key={x[0]}>
                  <input
                    type="radio"
                    name="pay"
                    checked={method === x[0]}
                    onChange={() => setMethod(x[0])}
                  />
                  <b>{x[1]}</b>
                </label>
              ))}
            </div>
            {["WAAFI", "DMONEY"].includes(method) && (
              <Field
                label="Numéro de téléphone"
                value={phone}
                onChange={setPhone}
              />
            )}
          </FormCard>
        </div>
        <aside className="summary-new">
          <h2>Votre commande</h2>
          {cart.map((x) => (
            <p key={x.product.id}>
              <span>
                {x.quantity}× {x.product.name}
              </span>
              <b>{money(Number(x.product.price) * x.quantity)}</b>
            </p>
          ))}
          <CouponValidator
            code={coupon}
            setCode={setCoupon}
            subtotal={subtotal}
            onValidated={(c, d) => setDiscount(d)}
          />
          <hr />
          <p>
            <span>Sous-total</span>
            <b>{money(subtotal)}</b>
          </p>
          {discount > 0 && (
            <p className="positive">
              <span>Réduction</span>
              <b>− {money(discount)}</b>
            </p>
          )}
          <p>
            <span>Livraison</span>
            <b>{fee ? money(fee) : "Gratuite"}</b>
          </p>
          <p className="total">
            <span>Total estimé</span>
            <b>{money(Math.max(0, subtotal - discount) + fee)}</b>
          </p>
          <button disabled={busy || !addressId} onClick={submit}>
            {busy
              ? "Traitement…"
              : method === "CASH"
                ? "Confirmer"
                : "Confirmer et payer"}
          </button>
        </aside>
      </main>
    </Shop>
  );
}
function Shop({ children }) {
  return (
    <>
      <ShopHeader />
      {children}
      <ShopFooter />
    </>
  );
}
function NotFound() {
  return (
    <Shop>
      <main className="notfound">
        <b>404</b>
        <h1>Cette page est introuvable</h1>
        <p>La page recherchée n'existe pas ou a été déplacée.</p>
        <Link to="/">Retour à l'accueil</Link>
      </main>
    </Shop>
  );
}
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<Catalog />} />
      <Route path="/category/:slug" element={<Catalog />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth kind="register" />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<Auth kind="forgot" />} />
      <Route path="/reset-password" element={<Auth kind="forgot" />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
      <Route path="/payments" element={<PaymentHistory />} />
      <Route path="/account/*" element={<Account />} />
      <Route path="/seller/*" element={<Dashboard type="seller" />} />
      <Route path="/vendeur/*" element={<Auth kind="register" />} />
      <Route path="/admin/*" element={<Dashboard type="admin" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
function DynamicHome() {
  const [products, setProducts] = React.useState([]);
  const [best, setBest] = React.useState([]);
  const [meta, setMeta] = React.useState({ categories: [] });
  const [campaigns, setCampaigns] = React.useState([]);
  const [sections, setSections] = React.useState([]);
  React.useEffect(() => {
    Promise.all([
      api("/products?page=0&size=10&sort=newest"),
      api("/catalog/best-sellers?limit=5"),
      api("/catalog/metadata"),
      api("/catalog/campaigns"),
      api("/catalog/home-sections"),
    ])
      .then(([p, b, m, c, s]) => {
        setProducts(p.content || []);
        setBest(b || []);
        setMeta(m || { categories: [] });
        setCampaigns(c || []);
        setSections(s || []);
      })
      .catch(() => {});
  }, []);
  const hero = campaigns[0];
  return (
    <Shop>
      <main>
        <section className="hero">
          <div className="shell hero-grid">
            <div className="hero-main">
              <span className="tag">
                {hero?.badge || "✨ Marketplace locale"}
              </span>
              <h1>{hero?.title || "Tout Djibouti, livré chez vous."}</h1>
              <p>
                {hero?.subtitle ||
                  "Découvrez les produits réellement disponibles auprès des boutiques d'ici."}
              </p>
              <div>
                <Link className="btn yellow" to={hero?.linkUrl || "/search"}>
                  Découvrir les offres
                </Link>
              </div>
            </div>
            <div className="hero-side">
              <div className="hero-card orange">
                <h3>{products.length} nouveautés disponibles</h3>
                <p>Catalogue synchronisé avec nos vendeurs.</p>
                <Link to="/search">Voir les nouveautés →</Link>
              </div>
              <div className="hero-card soft">
                <h3>Vous vendez ?</h3>
                <p>Rejoignez la marketplace de Djibouti.</p>
                <Link to="/vendeur/register">Devenir vendeur →</Link>
              </div>
            </div>
          </div>
        </section>
        <section className="trust">
          <div className="shell trust-grid">
            {[
              [Truck, "Livraison locale", "Selon chaque boutique"],
              [CreditCard, "Waafi · D-Money · DjibPay", "Paiement sécurisé"],
              [ShieldCheck, "Achat protégé", "Retours après livraison"],
              [Headphones, "Support local", "Compte et commandes suivis"],
            ].map(([I, a, b]) => (
              <div className="trust-item" key={a}>
                <i>
                  <I />
                </i>
                <div>
                  <b>{a}</b>
                  <small>{b}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="shell">
            <Head
              title="Explorer par catégorie"
              text="Catégories calculées depuis le catalogue Supabase."
            />
            <div className="categories">
              {(meta.categories || []).slice(0, 8).map((c, i) => (
                <Link
                  to={"/category/" + encodeURIComponent(c.name || c.value)}
                  key={c.name || c.value}
                >
                  <span>
                    {["📱", "💻", "👗", "🏠", "💄", "⚽", "🧸", "🛒"][i] ||
                      "📦"}
                  </span>
                  <b>{c.name || c.value}</b>
                  <small>{c.count} articles</small>
                </Link>
              ))}
            </div>
          </div>
        </section>
        {(sections.length
          ? sections
          : [
              {
                key: "new",
                title: "Nouveautés",
                subtitle: "Les derniers produits ajoutés.",
              },
              {
                key: "best",
                title: "Les meilleures ventes",
                subtitle: "Les favoris de nos clients.",
              },
            ]
        ).map((s, i) => (
          <section className={i % 2 ? "" : "grey"} key={s.key}>
            <div className="shell">
              <Head title={s.title} text={s.subtitle} />
              <ProductGrid
                items={i === 1 ? best : products.slice(0, s.maxItems || 5)}
              />
            </div>
          </section>
        ))}
      </main>
    </Shop>
  );
}
function RoutedSite() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if (pathname === "/") return <DynamicHome />;
  if (pathname === "/vendeur")
    return (
      <div
        onClickCapture={(e) => {
          if (e.target.closest("a")?.getAttribute("href") === "/login") {
            e.preventDefault();
            navigate("/vendeur/login");
          }
        }}
      >
        <SellerLanding />
      </div>
    );
  if (pathname === "/vendeur/register") return <SellerAuth />;
  if (pathname === "/vendeur/login") return <SellerAuth mode="login" />;
  if (pathname === "/seller/onboarding") return <SellerProtected onboarding />;
  if (pathname.startsWith("/seller"))
    return (
      <SellerProtected>
        <AppRoutes />
      </SellerProtected>
    );
  if (pathname.startsWith("/product/"))
    return (
      <Routes>
        <Route path="/product/:id" element={<ProductDetailPage />} />
      </Routes>
    );
  if (pathname === "/forgot-password") return <ForgotPassword />;
  if (pathname === "/reset-password") return <ResetPassword />;
  if (pathname === "/confirmation") return <Confirmation />;
  if (pathname === "/checkout")
    return (
      <Protected>
        <CheckoutV2 />
      </Protected>
    );
  if (pathname === "/account/delete")
    return (
      <Protected>
        <AccountDeletionPage />
      </Protected>
    );
  if (pathname === "/account/lists")
    return (
      <Protected>
        <ListsPage />
      </Protected>
    );
  if (
    pathname === "/orders" ||
    pathname.startsWith("/orders/") ||
    pathname === "/payments"
  )
    return (
      <Protected>
        <AppRoutes />
      </Protected>
    );
  return <AppRoutes />;
}
export default function SiteRouter() {
  return (
    <BrowserRouter>
      <RoutedSite />
    </BrowserRouter>
  );
}
