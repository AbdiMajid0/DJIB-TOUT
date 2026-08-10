"use client";

import {useEffect,useRef,useState} from "react";
import Image from "next/image";
import {productPath} from "@/lib/seo";
import Link from "next/link";
import {Check,Heart,PackageX,ShoppingCart,Star,TicketPercent,Truck} from "lucide-react";
import {motion,useReducedMotion} from "framer-motion";
import {Product,trackProductInteraction} from "@/lib/api";
import {useCartStore} from "@/store/useCartStore";
import {useFavoriteStore} from "@/store/useFavoriteStore";
import CountdownTimer from "./CountdownTimer";

export default function DjibtoutProductCard({product,placement="product-card"}:{product:Product;placement?:string}){
  const root=useRef<HTMLElement>(null);const impressionSent=useRef(false);
  const addItem=useCartStore(state=>state.addItem);const isFavorite=useFavoriteStore(state=>state.isFavorite(product.id));const toggleFavorite=useFavoriteStore(state=>state.toggleFavorite);
  const reduced=useReducedMotion();const [added,setAdded]=useState(false);const [imageError,setImageError]=useState(false);
  const rawImage=product.images?.[0]||product.imageUrl;const validImage=rawImage&&/^(https?:|\/|data:)/.test(rawImage)?rawImage:null;
  const image=imageError||!validImage?"/images/product-placeholder-premium-v2.png":validImage;
  const format=(value:number)=>new Intl.NumberFormat("fr-DJ").format(value);
  const rating=Math.max(0,Math.min(5,Math.round(product.averageRating||0)));const soldOut=product.stockQuantity<=0;
  const discount=product.originalPrice&&product.originalPrice>product.price?Math.round((1-product.price/product.originalPrice)*100):(product.discountPercentage||0);

  useEffect(()=>{const node=root.current;if(!node||impressionSent.current)return;const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.5)){impressionSent.current=true;trackProductInteraction(product.id,"IMPRESSION",placement);observer.disconnect()}},{threshold:.5});observer.observe(node);return()=>observer.disconnect()},[placement,product.id]);
  function add(event:React.MouseEvent){event.preventDefault();event.stopPropagation();if(soldOut)return;addItem(product);setAdded(true);window.setTimeout(()=>setAdded(false),1400)}
  function favorite(event:React.MouseEvent){event.preventDefault();event.stopPropagation();void toggleFavorite(product)}

  return <motion.article ref={root} className="group relative isolate flex h-full min-h-[405px] flex-col overflow-hidden rounded-[20px] bg-white p-3 outline-none transition-[box-shadow,border-color] duration-300 hover:z-10 hover:shadow-[0_22px_48px_rgba(15,41,78,.16)] focus-within:z-10 focus-within:ring-2 focus-within:ring-[var(--primary)] sm:p-4" whileHover={reduced?undefined:{y:-6}} transition={{duration:.22}}>
    <Link href={productPath(product)} onClick={()=>trackProductInteraction(product.id,"CLICK",placement)} aria-label={`Voir ${product.name}`} className="absolute inset-0 z-0"/>
    <div className="relative z-10 aspect-square overflow-hidden rounded-[18px] bg-gradient-to-br from-[#f7f9fc] to-[#edf4ff] pointer-events-none">
      <Image src={image} alt={product.name} fill sizes="(max-width: 640px) 46vw, 226px" unoptimized={image.startsWith("http")||image.startsWith("data:")} onError={()=>setImageError(true)} className={`object-contain p-3 transition duration-500 group-hover:scale-[1.07] ${soldOut?"opacity-55 grayscale-[.25]":""}`}/>
      <div className="absolute left-2 top-2 flex max-w-[72%] flex-col items-start gap-1">
        {discount>0&&<span className="rounded bg-[#e52521] px-2 py-1 text-[10px] font-black text-white">-{discount}%</span>}
        {product.couponLabel&&<span className="flex items-center gap-1 rounded bg-[#fff0e9] px-2 py-1 text-[9px] font-extrabold text-[#d95016]"><TicketPercent size={11}/>{product.couponLabel}</span>}
      </div>
      {soldOut&&<span className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 items-center justify-center gap-1.5 rounded bg-white/95 px-2 py-2 text-[10px] font-black text-slate-700 shadow"><PackageX size={14}/>Rupture de stock</span>}
      {product.deliveryDays!=null&&!soldOut&&<span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[9px] font-extrabold text-emerald-700"><Truck size={11}/>{product.deliveryDays===0?"Aujourd’hui":`${product.deliveryDays} j`}</span>}
      <motion.button type="button" whileTap={reduced?undefined:{scale:.76}} animate={isFavorite&&!reduced?{scale:[1,1.25,1]}:undefined} onClick={favorite} aria-label={isFavorite?"Retirer des favoris":"Ajouter aux favoris"} aria-pressed={isFavorite} className="pointer-events-auto absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-400 shadow-sm transition hover:border-red-200 hover:text-red-500"><Heart size={16} className={isFavorite?"fill-red-500 text-red-500":""}/></motion.button>
    </div>
    <div className="relative z-10 flex flex-1 flex-col pt-2.5 pointer-events-none">
      <p className="truncate text-[9px] font-extrabold uppercase tracking-wide text-[var(--primary)]">{product.brand||product.category}</p>
      <h3 className="mt-1 line-clamp-2 min-h-[38px] text-[12px] font-semibold leading-[18px] text-slate-700 sm:text-[13px] sm:leading-[19px]">{product.name}</h3>
      <div className="mt-1.5 flex min-h-4 items-center gap-1"><span className="flex text-[#f59e0b]">{[0,1,2,3,4].map(index=><Star key={index} size={11} className={index<rating?"fill-current":"fill-slate-200 text-slate-200"}/>)}</span><small className="text-[10px] text-slate-400">{product.averageRating?product.averageRating.toFixed(1):"0.0"} ({product.reviewCount||0})</small></div>
      {product.promotionLabel&&<p className="mt-1.5 truncate rounded bg-blue-50 px-2 py-1 text-[9px] font-bold text-[var(--primary)]">{product.promotionLabel}</p>}
      {product.flashSaleEndsAt&&discount>0&&<div className="mt-1.5 pointer-events-auto"><CountdownTimer endsAt={product.flashSaleEndsAt} compact/></div>}
      {product.seller?.name&&<p className="mt-1.5 truncate text-[9px] text-slate-400">Vendu par <span className="font-bold text-slate-600">{product.seller.name}</span></p>}
      <div className="mt-auto pt-2">{product.originalPrice&&product.originalPrice>product.price&&<span className="block text-[10px] text-slate-400 line-through">{format(product.originalPrice)} FDJ</span>}<strong className="block text-[16px] font-black leading-tight text-slate-900 sm:text-[18px]">{format(product.price)} <small className="text-[10px]">FDJ</small></strong>{product.installmentMonths&&product.installmentMonths>1&&<small className="mt-1 block text-[9px] font-bold text-violet-700">{product.installmentMonths} × {format(Math.ceil(product.price/product.installmentMonths))} FDJ</small>}</div>
      <motion.button type="button" disabled={soldOut} animate={added&&!reduced?{scale:[1,1.06,.97,1]}:undefined} onClick={add} className={`pointer-events-auto mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-[11px] font-extrabold transition ${soldOut?"cursor-not-allowed bg-slate-100 text-slate-400":added?"bg-emerald-600 text-white":"bg-[var(--primary)] text-white shadow-[0_7px_18px_rgba(7,91,216,.18)] hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-[0_10px_22px_rgba(7,91,216,.26)]"}`}>{soldOut?<><PackageX size={14}/>Indisponible</>:added?<><Check size={15}/>Ajouté</>:<><ShoppingCart size={15}/><span className="sm:hidden">Ajouter</span><span className="hidden sm:inline">Ajouter au panier</span></>}</motion.button>
    </div>
  </motion.article>;
}
