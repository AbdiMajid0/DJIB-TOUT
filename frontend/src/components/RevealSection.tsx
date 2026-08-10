"use client";
import { motion, useReducedMotion } from "framer-motion";
export default function RevealSection({children,className=""}:{children:React.ReactNode;className?:string}){const reduced=useReducedMotion();return <motion.section className={className} initial={reduced?false:{opacity:0,y:28}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:0.12}} transition={{duration:.45,ease:[.22,1,.36,1]}}>{children}</motion.section>}
