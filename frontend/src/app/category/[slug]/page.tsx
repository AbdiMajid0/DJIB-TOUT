import type {Metadata} from "next";
import CategoryClientPage from "./CategoryClientPage";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;const name=decodeURIComponent(slug).replaceAll("-"," ");
  return {title:`${name} | DjibTout`,description:`Découvrez les produits ${name} disponibles sur DjibTout à Djibouti.`,alternates:{canonical:`/category/${slug}`},openGraph:{title:`${name} | DjibTout`,description:`Produits ${name} disponibles à Djibouti.`}};
}
export default async function CategoryPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const decodedSlug=decodeURIComponent(slug).replaceAll("-"," ");return <><CategoryClientPage slug={slug} decodedSlug={decodedSlug}/><section className="dt-container pb-12"><div className="rounded-xl border bg-white p-6 text-sm leading-6 text-slate-600"><h2 className="mb-2 text-lg font-black capitalize text-slate-900">Acheter {decodedSlug} à Djibouti</h2><p>Comparez les produits, les prix, les vendeurs, les évaluations et la disponibilité. Les filtres DjibTout permettent de trouver rapidement un produit livré à votre adresse.</p></div></section></>}
