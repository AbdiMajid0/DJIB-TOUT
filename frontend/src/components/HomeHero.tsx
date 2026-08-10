"use client";
import Link from "next/link";
import Image from "next/image";
import {useCallback,useEffect,useState} from "react";
import {ChevronLeft,ChevronRight,Headphones,ShieldCheck,Smartphone,Truck} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {Campaign} from "@/lib/api";

const fallback:Campaign={id:0,badge:"DJIBTOUT SÉLECTION",title:"Tout ce qu’il vous faut, au même endroit",subtitle:"Découvrez une sélection pensée pour votre quotidien, livrée partout à Djibouti.",linkUrl:"/search",gradient:"from-[#041b50] to-[#075bd8]",displayOrder:0,active:true};

export default function HomeHero({campaigns}:{campaigns:Campaign[]}){
  const slides=campaigns.length?campaigns:[fallback];const [selected,setSelected]=useState(0);
  const [emblaRef,embla]=useEmblaCarousel({loop:true,duration:32},[Autoplay({delay:6000,stopOnInteraction:false,stopOnMouseEnter:true})]);
  const select=useCallback(()=>setSelected(embla?.selectedScrollSnap()||0),[embla]);
  useEffect(()=>{if(!embla)return;queueMicrotask(select);embla.on("select",select);return()=>{embla.off("select",select)}},[embla,select]);
  return <section className="relative overflow-hidden rounded-2xl bg-white shadow-[0_10px_32px_rgba(8,35,73,.12)] ring-1 ring-slate-200/60">
    <div ref={emblaRef} className="overflow-hidden"><div className="flex">{slides.map((slide,index)=><div key={slide.id} className="min-w-0 flex-[0_0_100%]"><div className={`relative min-h-[270px] overflow-hidden bg-gradient-to-r ${slide.gradient} p-7 text-white sm:min-h-[310px] sm:p-9 lg:min-h-[330px] lg:p-10`}>
      {index===0||slide.imageUrl?<Image src={slide.imageUrl||"/images/djibtout-premium-hero-v2.png"} alt="" fill priority={index===0} sizes="(max-width: 1024px) 100vw, 760px" unoptimized={Boolean(slide.imageUrl?.startsWith("http"))} className="object-cover object-center"/>:<div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(255,255,255,.22),transparent_25%),linear-gradient(120deg,transparent_30%,rgba(255,255,255,.08))]"/>}
      <div className="absolute inset-0 bg-gradient-to-r from-[#03163f]/95 via-[#075bd8]/65 to-transparent"/>
      <div className="relative z-10 flex min-h-[215px] max-w-[470px] flex-col justify-center sm:min-h-[235px] lg:min-h-[250px]"><span className="w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black tracking-[.14em] backdrop-blur-md">{slide.badge}</span><h2 className="mt-4 max-w-[450px] text-[30px] font-black leading-[1.02] tracking-[-1.2px] sm:text-[40px] lg:text-[44px]">{slide.title}</h2><p className="mt-3 max-w-[420px] text-xs font-medium leading-5 text-white/80 sm:text-sm">{slide.subtitle}</p><Link href={slide.linkUrl} className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-black text-[#123a79] shadow-lg transition hover:-translate-y-0.5">Découvrir l’offre <span aria-hidden>→</span></Link></div>
    </div></div>)}</div></div>
    <button aria-label="Précédent" onClick={()=>embla?.scrollPrev()} className="absolute left-4 top-[43%] z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur-md sm:grid"><ChevronLeft size={20}/></button><button aria-label="Suivant" onClick={()=>embla?.scrollNext()} className="absolute right-4 top-[43%] z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur-md sm:grid"><ChevronRight size={20}/></button>
    <div className="absolute bottom-[86px] left-1/2 z-20 flex -translate-x-1/2 gap-2 lg:bottom-[74px]">{slides.map((slide,index)=><button aria-label={`Diapositive ${index+1}`} key={slide.id} onClick={()=>embla?.scrollTo(index)} className={`h-1.5 rounded-full transition-all ${selected===index?"w-8 bg-white":"w-3 bg-white/45"}`}/>)}</div>
    <div className="grid grid-cols-2 divide-x divide-y border-t bg-white lg:grid-cols-4 lg:divide-y-0"><Benefit icon={Truck} title="Livraison suivie" text="Partout à Djibouti"/><Benefit icon={ShieldCheck} title="Paiement sécurisé" text="Waafi, D-Money, Djibpay"/><Benefit icon={Headphones} title="Service client local" text="Une équipe à votre écoute"/><Benefit icon={Smartphone} title="Shopping simplifié" text="Mobile et ordinateur"/></div>
  </section>
}
function Benefit({icon:Icon,title,text}:{icon:typeof Truck;title:string;text:string}){return <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edf4ff] text-[var(--primary)]"><Icon size={18}/></span><span className="min-w-0"><strong className="block text-[11px] text-[#333] sm:text-xs">{title}</strong><small className="block truncate text-[9px] text-[#888] sm:text-[10px]">{text}</small></span></div>}
