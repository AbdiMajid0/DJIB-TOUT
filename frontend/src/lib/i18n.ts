export const locales = ["fr", "ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const localeConfig = {
  fr: { label: "Français", dir: "ltr", intl: "fr-DJ" },
  ar: { label: "العربية", dir: "rtl", intl: "ar-DJ" },
  en: { label: "English", dir: "ltr", intl: "en-DJ" },
} as const;

export const messages = {
  fr: {
    language: "Langue",
    chooseLanguage: "Choisir la langue",
    search: "Rechercher",
    searchPlaceholder: "Rechercher un produit, une catégorie ou une marque",
    mobileSearchPlaceholder: "Produit, catégorie ou marque",
    cart: "Mon panier",
    item: "article",
    items: "articles",
    account: "Mon compte",
    welcome: "Bienvenue",
    login: "Se connecter",
    register: "Créer un compte",
    orders: "Mes commandes",
    help: "Aide",
    campaigns: "Campagnes",
    sell: "Vendre sur DjibTout",
    favorites: "Mes favoris",
    addresses: "Mes adresses",
    coupons: "Mes coupons",
    sellerSpace: "Espace vendeur",
    administration: "Administration",
    logout: "Se déconnecter",
    deliveryTo: "Livraison à",
    openMenu: "Ouvrir le menu",
    close: "Fermer",
    skip: "Aller au contenu principal",
  },
  ar: {
    language: "اللغة",
    chooseLanguage: "اختر اللغة",
    search: "بحث",
    searchPlaceholder: "ابحث عن منتج أو فئة أو علامة تجارية",
    mobileSearchPlaceholder: "منتج أو فئة أو علامة تجارية",
    cart: "سلتي",
    item: "عنصر",
    items: "عناصر",
    account: "حسابي",
    welcome: "مرحباً",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    orders: "طلباتي",
    help: "المساعدة",
    campaigns: "العروض",
    sell: "بع على DjibTout",
    favorites: "المفضلة",
    addresses: "عناويني",
    coupons: "قسائمي",
    sellerSpace: "مساحة البائع",
    administration: "الإدارة",
    logout: "تسجيل الخروج",
    deliveryTo: "التوصيل إلى",
    openMenu: "فتح القائمة",
    close: "إغلاق",
    skip: "انتقل إلى المحتوى الرئيسي",
  },
  en: {
    language: "Language",
    chooseLanguage: "Choose language",
    search: "Search",
    searchPlaceholder: "Search for a product, category or brand",
    mobileSearchPlaceholder: "Product, category or brand",
    cart: "My cart",
    item: "item",
    items: "items",
    account: "My account",
    welcome: "Welcome",
    login: "Sign in",
    register: "Create account",
    orders: "My orders",
    help: "Help",
    campaigns: "Campaigns",
    sell: "Sell on DjibTout",
    favorites: "My favorites",
    addresses: "My addresses",
    coupons: "My coupons",
    sellerSpace: "Seller space",
    administration: "Administration",
    logout: "Sign out",
    deliveryTo: "Deliver to",
    openMenu: "Open menu",
    close: "Close",
    skip: "Skip to main content",
  },
} as const;

export type Messages = (typeof messages)[Locale];

export function formatMoney(value: number, locale: Locale = "fr") {
  return new Intl.NumberFormat(localeConfig[locale].intl, {
    style: "currency",
    currency: "DJF",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: Date | string, locale: Locale = "fr") {
  return new Intl.DateTimeFormat(localeConfig[locale].intl, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatNumber(value: number, locale: Locale = "fr") {
  return new Intl.NumberFormat(localeConfig[locale].intl).format(value);
}
