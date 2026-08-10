"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
export default function PageTransition({children}:{children:React.ReactNode}){const pathname=usePathname();const reduced=useReducedMotion();return <AnimatePresence mode="wait" initial={false}><motion.div key={pathname} className="flex flex-1 flex-col" initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={reduced?undefined:{opacity:0,y:-6}} transition={{duration:.2}}>{children}</motion.div></AnimatePresence>}
