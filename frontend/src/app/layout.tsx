import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import SkipLink from "@/components/SkipLink";
import WebVitals from "@/components/WebVitals";
import { SITE_URL } from "@/lib/seo";
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DjibTout — La marketplace de Djibouti",
    template: "%s | DjibTout",
  },
  description:
    "Achetez auprès de vendeurs locaux et comparez les produits disponibles à Djibouti.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_DJ",
    siteName: "DjibTout",
    title: "DjibTout — La marketplace de Djibouti",
    description: "Produits, vendeurs locaux et livraison à Djibouti.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "DjibTout — La marketplace de Djibouti",
    description: "Produits, vendeurs locaux et livraison à Djibouti.",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} h-full font-sans antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gray-50 text-gray-900">
        <WebVitals />
        <SkipLink />
        <Header />
        <main id="contenu" tabIndex={-1} className="flex flex-grow flex-col">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}
