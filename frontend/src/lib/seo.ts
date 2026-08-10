import type {Product} from "@/lib/api";
export const SITE_URL=(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000").replace(/\/$/,"");
export function slugify(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,90)||"produit";}
export function productPath(product:Pick<Product,"id"|"name">){return `/product/${product.id}-${slugify(product.name)}`;}
export function productIdFromSegment(segment:string){const id=Number(segment.match(/^\d+/)?.[0]);return Number.isSafeInteger(id)&&id>0?id:null;}
