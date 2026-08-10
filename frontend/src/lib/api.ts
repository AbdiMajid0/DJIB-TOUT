export const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082'}/api`;

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401 && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const refresh = await fetch(`${API_BASE_URL}/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }) });
      if (refresh.ok) { const data = await refresh.json(); localStorage.setItem("token", data.token); localStorage.setItem("refreshToken", data.refreshToken); headers.set("Authorization", `Bearer ${data.token}`); response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers }); }
      else { localStorage.removeItem("token"); localStorage.removeItem("refreshToken"); localStorage.removeItem("user"); const returnUrl=`${window.location.pathname}${window.location.search}`; if(!window.location.pathname.startsWith("/login"))window.location.assign(`/login?returnUrl=${encodeURIComponent(returnUrl)}`); throw new Error("Votre session a expiré. Reconnexion requise."); }
    }
    if(response.status===401){localStorage.removeItem("token");localStorage.removeItem("refreshToken");localStorage.removeItem("user");const returnUrl=`${window.location.pathname}${window.location.search}`;if(!window.location.pathname.startsWith("/login"))window.location.assign(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);throw new Error("Votre session a expiré. Reconnexion requise.");}
  }
  if (!response.ok) {const raw=await response.text();let message=raw;try{message=JSON.parse(raw).message||raw}catch{}throw new Error(message || `Erreur HTTP ${response.status}`);}
  if (response.status === 204) return undefined as T;
  return response.headers.get("content-type")?.includes("application/json") ? response.json() : response.text() as Promise<T>;
}

export interface Address { id:number; label:string; fullAddress:string; city:string; default:boolean; }
export interface Coupon { id:number; code:string; discountType:"PERCENTAGE"|"FIXED"; discountValue:number; expiresAt?:string; }
export interface Wallet { id:number; balance:number; }
export interface WalletTransaction { id:number; type:"CREDIT"|"DEBIT"; amount:number; reason:string; createdAt:string; }
export const fetchAddresses=()=>apiRequest<Address[]>("/addresses");
export const createAddress=(data:Omit<Address,"id">)=>apiRequest<Address>("/addresses",{method:"POST",body:JSON.stringify(data)});
export const updateAddress=(id:number,data:Omit<Address,"id">)=>apiRequest<Address>(`/addresses/${id}`,{method:"PUT",body:JSON.stringify(data)});
export const deleteAddress=(id:number)=>apiRequest<void>(`/addresses/${id}`,{method:"DELETE"});
export const fetchCoupons=()=>apiRequest<Coupon[]>("/coupons/active");
export const fetchWallet=()=>apiRequest<Wallet>("/wallet");
export const fetchWalletTransactions=()=>apiRequest<WalletTransaction[]>("/wallet/transactions");
export const topupWallet=(amount:number)=>apiRequest<Wallet>("/wallet/topup",{method:"POST",body:JSON.stringify({amount})});
export interface AccountProfile{id:number;name:string;email:string;phone?:string;role:string;emailVerified:boolean;orderNotifications:boolean;promotionNotifications:boolean}
export const fetchAccountProfile=()=>apiRequest<AccountProfile>("/account/profile");
export const updateAccountProfile=(name:string,phone:string)=>apiRequest<AccountProfile>("/account/profile",{method:"PUT",body:JSON.stringify({name,phone})});
export const updateAccountPreferences=(orderNotifications:boolean,promotionNotifications:boolean)=>apiRequest<AccountProfile>("/account/preferences",{method:"PUT",body:JSON.stringify({orderNotifications,promotionNotifications})});
export const deleteAccount=(password:string)=>apiRequest<void>("/account",{method:"DELETE",body:JSON.stringify({password})});

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  images?: string[];
  imageUrl?: string;
  videoUrl?: string;
  category: string;
  originalPrice?: number;
  discountPercentage?: number;
  brand?: string;
  warrantyMonths?: number;
  deliveryDays?: number;
  flashSaleEndsAt?: string;
  couponLabel?: string;
  promotionLabel?: string;
  installmentMonths?: number;
  averageRating?: number;
  reviewCount?: number;
  seller?: { id:number; name:string; email?:string };
}
export interface ProductActivity { recentPurchases:number; windowHours:number; measuredAt:string }
export const fetchProductActivity=(id:number)=>apiRequest<ProductActivity>(`/products/${id}/activity`);
export function trackProductInteraction(id:number,type:"IMPRESSION"|"CLICK",placement="product-card"){
  if(typeof window==="undefined")return;
  const body=JSON.stringify({type,placement});
  if(navigator.sendBeacon){navigator.sendBeacon(`${API_BASE_URL}/products/${id}/interactions`,new Blob([body],{type:"application/json"}));return;}
  fetch(`${API_BASE_URL}/products/${id}/interactions`,{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true}).catch(()=>undefined);
}
export interface CatalogFacet { value:string; count:number }
export interface CatalogMetadata { categories:CatalogFacet[]; brands:CatalogFacet[]; sellers:{id:number;name:string;count:number}[] }
export interface Campaign { id:number; title:string; subtitle:string; badge:string; linkUrl:string; imageUrl?:string; gradient:string; displayOrder:number; active:boolean; startsAt?:string; endsAt?:string }
export interface HomeSection { id:number; key:string; title:string; subtitle?:string; active:boolean; displayOrder:number; category?:string; maxItems:number }
export async function fetchHomeSections():Promise<HomeSection[]>{try{const res=await fetch(`${API_BASE_URL}/catalog/home-sections`,{next:{revalidate:60}});return res.ok&&res.headers.get("content-type")?.includes("application/json")?res.json():[]}catch{return []}}
export async function fetchBestSellers(limit=10):Promise<Product[]>{try{const res=await fetch(`${API_BASE_URL}/catalog/best-sellers?limit=${limit}`,{next:{revalidate:60}});return res.ok&&res.headers.get("content-type")?.includes("application/json")?res.json():[]}catch{return []}}
export async function fetchCatalogMetadata():Promise<CatalogMetadata>{
  try {
    const res=await fetch(`${API_BASE_URL}/catalog/metadata`,{next:{revalidate:60}});
    if(!res.ok||!res.headers.get("content-type")?.includes("application/json"))return {categories:[],brands:[],sellers:[]};
    return await res.json();
  }catch{return {categories:[],brands:[],sellers:[]}}
}
export async function fetchCampaigns():Promise<Campaign[]>{
  try {
    const res=await fetch(`${API_BASE_URL}/catalog/campaigns`,{next:{revalidate:60}});
    if(!res.ok||!res.headers.get("content-type")?.includes("application/json"))return [];
    return await res.json();
  }catch{return []}
}

export interface SearchParams {
  q?: string;
  category?: string;
  brand?: string;
  sellerId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  maxDeliveryDays?: number;
  sort?: string;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products`, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.warn("Backend API responded with error, returning an empty catalog");
      return [];
    }
    const data = await res.json();
    if (data.content && Array.isArray(data.content)) {
      return data.content;
    }
    return data;
  } catch (error) {
    console.warn("Backend API not reachable, returning an empty catalog", error);
    return [];
  }
}

export async function fetchProductById(id: number): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.warn("Backend API responded with error while fetching product");
      return null;
    }
    return res.json();
  } catch (error) {
    console.warn("Backend API not reachable while fetching product", error);
    return null;
  }
}

export async function searchProducts(params: SearchParams = {}): Promise<PageResponse<Product>> {
  try {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category);
    if (params.brand) queryParams.append('brand', params.brand);
    if (params.sellerId) queryParams.append('sellerId', params.sellerId.toString());
    if (params.minPrice !== undefined && params.minPrice > 0) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined && params.maxPrice > 0) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.inStock) queryParams.append('inStock', 'true');
    if (params.minRating) queryParams.append('minRating', params.minRating.toString());
    if (params.maxDeliveryDays !== undefined) queryParams.append('maxDeliveryDays', params.maxDeliveryDays.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());

    const res = await fetch(`${API_BASE_URL}/products?${queryParams.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }
    const data = await res.json();
    
    if (data.content && Array.isArray(data.content)) {
      return data;
    }
    if (Array.isArray(data)) {
      return {
        content: data,
        totalPages: 1,
        totalElements: data.length,
        size: data.length,
        number: 0,
        first: true,
        last: true,
        empty: data.length === 0
      };
    }

    return { content: [], totalPages: 0, totalElements: 0, size: 12, number: 0, first: true, last: true, empty: true };
  } catch (error) {
    console.warn("Backend error in searchProducts, returning an empty catalog:", error);
    return { content: [], totalPages: 0, totalElements: 0, size: 12, number: 0, first: true, last: true, empty: true };
  }
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  return apiRequest<Product>("/products", { method: "POST", body: JSON.stringify(product) });
}

export interface SellerDashboard { revenue:number; orders:number; products:number; lowStock:number; outOfStock:number; pendingQuestions:number; pendingReviews:number }
export interface SellerStore { id:number; name:string; description?:string; logoUrl?:string; bannerUrl?:string; policies?:string; businessType?:string; phone?:string; businessAddress?:string; registrationNumber?:string; identityDocumentUrl?:string; businessDocumentUrl?:string; termsAccepted:boolean; onboardingSubmitted:boolean; validated:boolean }
export interface SellerFulfillmentItem { id:number; quantity:number; price:number; product:Product }
export interface SellerFulfillment { fulfillmentId:number; orderId:number; createdAt:string; status:string; trackingNumber?:string; subtotal:number; items:SellerFulfillmentItem[] }
export const fetchSellerDashboard=()=>apiRequest<SellerDashboard>("/seller/dashboard");
export const fetchSellerStore=()=>apiRequest<SellerStore>("/seller/store");
export const updateSellerStore=(data:Partial<SellerStore>&Pick<SellerStore,"name">&{submitOnboarding?:boolean})=>apiRequest<SellerStore>("/seller/store",{method:"PUT",body:JSON.stringify(data)});
export async function downloadSellerExport(path:string,filename:string){const token=localStorage.getItem("token");const response=await fetch(`${API_BASE_URL}${path}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});if(!response.ok)throw new Error(await response.text()||"Export impossible.");const url=URL.createObjectURL(await response.blob());const link=document.createElement("a");link.href=url;link.download=filename;link.click();URL.revokeObjectURL(url);}
export const fetchSellerFulfillments=()=>apiRequest<SellerFulfillment[]>("/seller/orders");
export const updateSellerFulfillment=(id:number,status:string,trackingNumber?:string)=>apiRequest<SellerFulfillment>(`/seller/orders/${id}`,{method:"PATCH",body:JSON.stringify({status,trackingNumber})});
export interface SellerAnalytics {days:number;revenue:number;orders:number;averageOrder:number;returns:number;returnRate:number;topProducts:{name:string;revenue:number;units:number}[]}
export const fetchSellerAnalytics=(days=30)=>apiRequest<SellerAnalytics>(`/seller/analytics?days=${days}`);
export interface AdminSellerStore {id:number;name:string;description?:string;validated:boolean;seller:{id:number;name:string;email:string}}
export const fetchAdminSellerStores=()=>apiRequest<AdminSellerStore[]>("/admin/seller-stores");
export const validateAdminSellerStore=(id:number,validated:boolean)=>apiRequest<AdminSellerStore>(`/admin/seller-stores/${id}/validation`,{method:"PATCH",body:JSON.stringify({validated})});
export interface SellerStaff {id:number;staffRole:"STORE_MANAGER"|"CATALOG_MANAGER"|"ORDER_MANAGER"|"SUPPORT";user:{id:number;name:string;email:string};createdAt:string}
export const fetchSellerStaff=()=>apiRequest<SellerStaff[]>("/seller/team");
export const inviteSellerStaff=(email:string,role:SellerStaff["staffRole"])=>apiRequest<SellerStaff>("/seller/team",{method:"POST",body:JSON.stringify({email,role})});
export const removeSellerStaff=(id:number)=>apiRequest<void>(`/seller/team/${id}`,{method:"DELETE"});
export interface SellerSettlement {id:number;grossAmount:number;commissionAmount:number;netAmount:number;status:"AVAILABLE"|"PAID";createdAt:string;paidAt?:string;fulfillment:{id:number;order:{id:number}}}
export interface SellerSettlementSummary {commissionRate:number;available:number;paid:number;settlements:SellerSettlement[]}
export const fetchSellerSettlements=()=>apiRequest<SellerSettlementSummary>("/seller/settlements");
export interface ProductImportResult { imported:number; rejected:number; errors:string[] }
export const importSellerProducts=async(file:File)=>{const form=new FormData();form.append("file",file);return apiRequest<ProductImportResult>("/seller/products/import-csv",{method:"POST",body:form})};
export const importSellerProductsXlsx=async(file:File)=>{const form=new FormData();form.append("file",file);return apiRequest<ProductImportResult>("/seller/products/import-xlsx",{method:"POST",body:form})};
export const uploadMedia=async(file:File)=>{const form=new FormData();form.append("file",file);return apiRequest<string>("/upload",{method:"POST",body:form})};
export interface ProductVariant { id:number; sku:string; price:number; stockQuantity:number; active:boolean; attributes:Record<string,string>; images:string[] }
export type ProductVariantInput=Omit<ProductVariant,"id">;
export const fetchProductVariants=(productId:number)=>apiRequest<ProductVariant[]>(`/products/${productId}/variants`);
export const createProductVariant=(productId:number,data:ProductVariantInput)=>apiRequest<ProductVariant>(`/products/${productId}/variants`,{method:"POST",body:JSON.stringify(data)});
export const updateProductVariant=(productId:number,id:number,data:ProductVariantInput)=>apiRequest<ProductVariant>(`/products/${productId}/variants/${id}`,{method:"PUT",body:JSON.stringify(data)});
export const deleteProductVariant=(productId:number,id:number)=>apiRequest<void>(`/products/${productId}/variants/${id}`,{method:"DELETE"});

export interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email?: string;
  };
  product?: Product;
  sellerResponse?: string;
  sellerRespondedAt?: string;
  sellerRespondedBy?: { id:number; name:string };
}

export interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
}
export const fetchSellerReviews=()=>apiRequest<Review[]>("/seller/reviews");
export const respondSellerReview=(id:number,response:string)=>apiRequest<Review>(`/seller/reviews/${id}/response`,{method:"PUT",body:JSON.stringify({response})});
export interface ProductQuestion {id:number;question:string;answer?:string;createdAt:string;answeredAt?:string;answeredBy?:{id:number;name:string};user?:{id:number;name:string};product?:Product}
export async function fetchProductQuestions(productId:number):Promise<ProductQuestion[]>{try{return await apiRequest<ProductQuestion[]>(`/products/${productId}/questions`)}catch{return []}}
export const createProductQuestion=(productId:number,question:string)=>apiRequest<ProductQuestion>(`/products/${productId}/questions`,{method:"POST",body:JSON.stringify({question})});
export const fetchSellerQuestions=()=>apiRequest<ProductQuestion[]>("/seller/questions");
export const answerSellerQuestion=(id:number,answer:string)=>apiRequest<ProductQuestion>(`/seller/questions/${id}/answer`,{method:"PUT",body:JSON.stringify({answer})});

export async function fetchProductReviews(productId: number): Promise<Review[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/reviews`);
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error("Failed to fetch product reviews", err);
    return [];
  }
}

export async function fetchProductReviewSummary(productId: number): Promise<ReviewSummary> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/reviews/summary`);
    if (!res.ok) return { averageRating: 0, reviewCount: 0 };
    return res.json();
  } catch (err) {
    console.error("Failed to fetch review summary", err);
    return { averageRating: 0, reviewCount: 0 };
  }
}

export async function createProductReview(productId: number, rating: number, comment: string): Promise<Review> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error("Vous devez être connecté pour publier un avis.");
  }

  const res = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ rating, comment })
  });

  if (!res.ok) {
    const errorMsg = await res.text();
    throw new Error(errorMsg || "Échec de l'envoi de l'avis.");
  }

  return res.json();
}

export async function fetchMyReviews(): Promise<Review[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/reviews/my-reviews`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error("Failed to fetch my reviews", err);
    return [];
  }
}

export async function fetchMyProducts(): Promise<Product[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/products/my-products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error("Failed to fetch my products", err);
    return [];
  }
}

export async function updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error("Vous devez être connecté.");
  }

  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Échec de la mise à jour du produit.");
  }

  return res.json();
}

export async function deleteProduct(id: number): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error("Vous devez être connecté.");
  }

  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Échec de la suppression du produit.");
  }
}

export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  items: OrderItem[];
  createdAt: string;
  buyer?: { id: number; name: string; email: string };
}

export async function fetchSellerOrders(): Promise<Order[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return [];
  const res = await fetch(`${API_BASE_URL}/orders/seller-orders`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchOrderById(id: number): Promise<Order | null> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return null;
  const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateOrderStatus(id: number, status: string): Promise<Order> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Vous devez être connecté.");
  const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Échec de la modification du statut.");
  }
  return res.json();
}

export async function cancelOrder(id: number): Promise<Order> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Vous devez être connecté.");
  const res = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Échec de l'annulation de la commande.");
  }
  return res.json();
}
export const fetchMyOrders=()=>apiRequest<Order[]>("/orders/my-orders");
export interface ReturnRequest {id:number;status:"REQUESTED"|"APPROVED"|"REJECTED"|"RECEIVED"|"REFUNDED";quantity:number;reason:string;customerComment?:string;sellerResponse?:string;refundAmount:number;evidenceUrls:string[];createdAt:string;orderItem:OrderItem;buyer?:{id:number;name:string};seller?:{id:number;name:string}}
export const fetchMyReturns=()=>apiRequest<ReturnRequest[]>("/returns/my");
export const createReturnRequest=(data:{orderId:number;orderItemId:number;quantity:number;reason:string;comment?:string;evidenceUrls?:string[]})=>apiRequest<ReturnRequest>("/returns",{method:"POST",body:JSON.stringify(data)});
export const fetchSellerReturns=()=>apiRequest<ReturnRequest[]>("/seller/returns");
export const updateSellerReturn=(id:number,status:string,response?:string)=>apiRequest<ReturnRequest>(`/seller/returns/${id}`,{method:"PATCH",body:JSON.stringify({status,response})});
export type SellerNotification={id:number;title:string;message:string;read:boolean;createdAt:string};
export const fetchSellerNotifications=()=>apiRequest<SellerNotification[]>("/seller/notifications");
export const readSellerNotification=(id:number)=>apiRequest<SellerNotification>(`/seller/notifications/${id}/read`,{method:"PATCH"});
