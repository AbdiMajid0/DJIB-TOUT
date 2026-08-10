"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function HomeSectionSkeleton({type}:{type:string}){
  if(type==="hero") return <div className="grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]"><Skeleton height={300} borderRadius={10}/><div className="hidden lg:block"><Skeleton height={300} borderRadius={10}/></div></div>;
  if(type==="shortcuts") return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{Array.from({length:6},(_,i)=><Skeleton key={i} height={66} borderRadius={8}/>)}</div>;
  if(type==="campaigns") return <div className="grid gap-4 md:grid-cols-3">{Array.from({length:3},(_,i)=><Skeleton key={i} height={190} borderRadius={8}/>)}</div>;
  if(type==="seo"||type==="faq"||type==="brands") return <Skeleton height={220} borderRadius={8}/>;
  return <div className="rounded-lg border p-4"><Skeleton width={230} height={24}/><div className="mt-4 flex gap-3 overflow-hidden">{Array.from({length:6},(_,i)=><div className="min-w-[190px]" key={i}><Skeleton height={180}/><Skeleton className="mt-2" count={2}/></div>)}</div></div>;
}
