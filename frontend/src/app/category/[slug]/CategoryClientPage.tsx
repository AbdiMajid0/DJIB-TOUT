"use client";
import {Suspense} from "react";
import CatalogClient from "@/components/CatalogClient";
export default function CategoryClientPage({slug,decodedSlug}:{slug:string;decodedSlug:string}){return <Suspense><CatalogClient fixedCategory={slug} title={decodedSlug}/></Suspense>}
