import {Suspense} from "react";
import CatalogClient from "@/components/CatalogClient";
import HomeSectionSkeleton from "@/components/HomeSectionSkeleton";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Recherche et catalogue | DjibTout",description:"Recherchez et comparez les produits disponibles à Djibouti.",alternates:{canonical:"/search"}};
export default function SearchPage(){return <Suspense fallback={<div className="dt-container py-8"><HomeSectionSkeleton type="products"/></div>}><CatalogClient/></Suspense>}
