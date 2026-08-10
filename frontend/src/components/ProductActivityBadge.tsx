"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fetchProductActivity } from "@/lib/api";
export default function ProductActivityBadge({productId}:{productId:number}){const [count,setCount]=useState(0);useEffect(()=>{let active=true;const load=()=>fetchProductActivity(productId).then(value=>{if(active)setCount(value.recentPurchases)}).catch(()=>{});void load();const timer=setInterval(load,30000);return()=>{active=false;clearInterval(timer)}},[productId]);return <AnimatePresence>{count>0&&<motion.p initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700">🔥 {count} achat{count>1?"s":""} sur les dernières 24 h</motion.p>}</AnimatePresence>}
