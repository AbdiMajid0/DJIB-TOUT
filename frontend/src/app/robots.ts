import type {MetadataRoute} from "next";import {SITE_URL} from "@/lib/seo";
export default function robots():MetadataRoute.Robots{return {rules:[{userAgent:"*",allow:"/",disallow:["/account/","/admin/","/seller/","/checkout","/oauth2/"]}],sitemap:`${SITE_URL}/sitemap.xml`,host:SITE_URL};}
