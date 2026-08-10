"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ChevronDown,
  Heart,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useLocale } from "@/lib/locale-client";
import NavigationMenu from "./NavigationMenu";
type StoredUser = { name?: string; role?: string };

export default function Header() {
  const router = useRouter();
  const { messages: m } = useLocale();
  const storedTotalItems = useCartStore((state) => state.getTotalItems());
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<StoredUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const totalItems = mounted ? storedTotalItems : 0;
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setUser(null);
      }
    });
  }, []);
  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    router.push(
      query.trim()
        ? `/search?q=${encodeURIComponent(query.trim())}`
        : "/search",
    );
  }
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
    router.refresh();
  }
  return (
    <header className="sticky top-0 z-50 bg-white/95 shadow-[0_6px_24px_rgba(20,44,80,.06)] backdrop-blur-xl">
      <div className="hidden border-b border-[#eeeeee] lg:block">
        <div className="dt-container flex h-9 items-center justify-end gap-7 text-[11px] font-semibold text-[#666]">
          <Link href="/orders">{m.orders}</Link>
          <Link href="/account/questions">{m.help}</Link>
          <Link href="/account/coupons">{m.campaigns}</Link>
          <Link href="/vendeur">{m.sell}</Link>
        </div>
      </div>
      <div className="dt-container flex h-[68px] items-center gap-3 sm:h-[78px] lg:h-[92px] lg:gap-7">
        <button
          onClick={() => setMobileOpen(true)}
          className="dt-icon-button lg:hidden"
          aria-label={m.openMenu}
        >
          <Menu size={22} />
        </button>
        <Link
          href="/"
          className="shrink-0 leading-none"
          aria-label="Accueil DjibTout"
        >
          <span className="block text-[25px] font-black tracking-[-1.8px] text-[#252525] sm:text-[31px] lg:text-[35px]">
            djib<span className="text-[var(--primary)]">tout</span>
          </span>
          <small className="mt-1 hidden text-[9px] font-bold tracking-[.12em] text-[#888] lg:block">
            TOUT DJIBOUTI, ICI
          </small>
        </Link>
        <form
          onSubmit={submitSearch}
          className="hidden min-w-0 flex-1 lg:block"
        >
          <div className="flex h-[52px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 transition focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-[0_10px_30px_rgba(7,91,216,.14)]">
            <Search className="ml-4 self-center text-[#777]" size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 px-3 text-sm font-medium outline-none placeholder:text-[#888]"
              placeholder={m.searchPlaceholder}
            />
            <button className="m-1 rounded-xl bg-[var(--primary)] px-5 text-sm font-extrabold text-white transition hover:bg-[var(--primary-hover)]">
              {m.search}
            </button>
          </div>
        </form>
        <div className="ml-auto flex items-stretch divide-x divide-[#e5e5e5]">
          <button className="hidden items-center gap-2 px-4 xl:flex">
            <MapPin size={21} className="text-[var(--primary)]" />
            <span className="text-left">
              <small className="block text-[10px] text-[#777]">
                {m.deliveryTo}
              </small>
              <strong className="flex items-center text-xs">
                Djibouti <ChevronDown size={12} />
              </strong>
            </span>
          </button>
          <Link
            href="/account/favorites"
            className="hidden items-center px-4 text-[#555] sm:flex"
            aria-label={m.favorites}
          >
            <Heart size={22} />
          </Link>
          <div className="group relative hidden lg:block">
            <Link
              href={user ? "/account" : "/login"}
              className="flex h-full min-w-[145px] items-center gap-2 px-4"
            >
              <UserRound size={22} className="text-[#555]" />
              <span className="min-w-0">
                <small className="block text-[10px] text-[#777]">
                  {user ? m.welcome : m.account}
                </small>
                <strong className="block max-w-[92px] truncate text-xs">
                  {user?.name || m.login}
                </strong>
              </span>
              <ChevronDown size={13} />
            </Link>
            <div className="invisible absolute right-0 top-full w-[270px] translate-y-2 rounded-b-lg border bg-white p-3 opacity-0 shadow-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {!user && (
                <div className="mb-2 grid gap-2 border-b pb-3">
                  <Link href="/login" className="dt-button-primary">
                    {m.login}
                  </Link>
                  <Link href="/login" className="dt-button-secondary">
                    {m.register}
                  </Link>
                </div>
              )}
              <nav className="grid text-sm font-semibold">
                <Link className="dt-menu-link" href="/account/orders">
                  {m.orders}
                </Link>
                <Link className="dt-menu-link" href="/account/addresses">
                  {m.addresses}
                </Link>
                <Link className="dt-menu-link" href="/account/favorites">
                  {m.favorites}
                </Link>
                <Link className="dt-menu-link" href="/account/coupons">
                  {m.coupons}
                </Link>
                {user?.role === "SELLER" && (
                  <Link className="dt-menu-link" href="/seller">
                    {m.sellerSpace}
                  </Link>
                )}
                {user?.role === "ADMIN" && (
                  <Link className="dt-menu-link" href="/admin">
                    {m.administration}
                  </Link>
                )}
                {user && (
                  <button
                    onClick={logout}
                    className="dt-menu-link text-left text-red-600"
                  >
                    {m.logout}
                  </button>
                )}
              </nav>
            </div>
          </div>
          <Link
            href="/cart"
            className="relative flex items-center gap-2 px-3 sm:px-4"
          >
            <ShoppingCart size={23} className="text-[#555]" />
            <span className="hidden sm:block">
              <small className="block text-[10px] text-[#777]">
                {m.cart}
              </small>
              <strong className="block text-xs">
                {totalItems} {totalItems > 1 ? m.items : m.item}
              </strong>
            </span>
            {totalItems > 0 && (
              <b className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--primary)] px-1 text-[10px] text-white">
                {totalItems}
              </b>
            )}
          </Link>
        </div>
      </div>
      <form onSubmit={submitSearch} className="dt-container pb-3 lg:hidden">
        <div className="flex h-11 overflow-hidden rounded-lg border border-[#d5d5d5] border-b-[3px] border-b-[var(--primary)]">
          <Search className="ml-3 self-center text-[#777]" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 px-3 text-sm outline-none"
            placeholder={m.mobileSearchPlaceholder}
          />
          <button className="px-3 text-xs font-black text-[var(--primary)]">
            {m.search}
          </button>
        </div>
      </form>
      <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
      <NavigationMenu />
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            aria-label={m.close}
            className="absolute inset-0 bg-slate-950/55"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[86%] max-w-sm overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <span className="text-2xl font-black">
                djib<span className="text-[var(--primary)]">tout</span>
              </span>
              <button
                className="dt-icon-button"
                onClick={() => setMobileOpen(false)}
              >
                <X />
              </button>
            </div>
            <div className="border-b bg-[#fafafa] p-4">
              <Link
                href={user ? "/account" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3"
              >
                <span className="dt-icon-button">
                  <UserRound />
                </span>
                <div>
                  <small className="text-[#777]">
                    {user ? m.welcome : m.account}
                  </small>
                  <strong className="block">
                    {user?.name || `${m.login} / ${m.register}`}
                  </strong>
                </div>
              </Link>
            </div>
            <NavigationMenu mobile onNavigate={() => setMobileOpen(false)} />
            <nav className="grid p-4 text-sm font-bold">
              <Link className="dt-menu-link" href="/orders">
                {m.orders}
              </Link>
              <Link className="dt-menu-link" href="/account/favorites">
                {m.favorites}
              </Link>
              <Link className="dt-menu-link" href="/account/djibpay">
                Djibpay
              </Link>
              <Link className="dt-menu-link" href="/vendeur">
                {m.sell}
              </Link>
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}
