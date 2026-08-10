"use client";
import {useCallback,useEffect,useState} from "react";
import {apiRequest,ProductQuestion,Review} from "@/lib/api";
type ModeratedReview=Review&{hidden:boolean};type ModeratedQuestion=ProductQuestion&{hidden:boolean};
export default function Page(){
 const[reviews,setReviews]=useState<ModeratedReview[]>([]),[questions,setQuestions]=useState<ModeratedQuestion[]>([]),[error,setError]=useState("");
 const load=useCallback(async()=>{try{setError("");const[r,q]=await Promise.all([apiRequest<ModeratedReview[]>("/admin/reviews"),apiRequest<ModeratedQuestion[]>("/admin/questions")]);if(!Array.isArray(r)||!Array.isArray(q))throw new Error("Réponse invalide du serveur.");setReviews(r);setQuestions(q);}catch(e){setReviews([]);setQuestions([]);setError(e instanceof Error?e.message:"Chargement impossible.");}},[]);
 useEffect(()=>{queueMicrotask(()=>void load())},[load]);
 const toggle=async(type:"reviews"|"questions",id:number,hidden:boolean)=>{try{await apiRequest(`/admin/${type}/${id}/moderate`,{method:"PATCH",body:JSON.stringify({hidden:!hidden})});await load();}catch(e){setError(e instanceof Error?e.message:"Mise à jour impossible.");}};
 const sections:[string,(ModeratedReview|ModeratedQuestion)[],"reviews"|"questions"][]=[["Avis",reviews,"reviews"],["Questions",questions,"questions"]];
 return <div className="space-y-8"><h1 className="text-2xl font-black">Modération</h1>{error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}{sections.map(([title,items,type])=><section key={title} className="rounded-xl border bg-white p-4"><h2 className="font-black">{title}</h2>{items.length===0?<p className="py-5 text-sm text-slate-500">Aucun élément à modérer.</p>:items.map(x=><div key={x.id} className="flex justify-between gap-4 border-b py-3"><p>{"comment" in x?x.comment:x.question}</p><button onClick={()=>void toggle(type,x.id,x.hidden)} className="rounded-lg border px-3 text-sm font-bold">{x.hidden?"Restaurer":"Masquer"}</button></div>)}</section>)}</div>;
}
