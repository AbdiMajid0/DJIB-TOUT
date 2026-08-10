import Link from "next/link";
import { Smartphone } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20 pt-16">
      <div className="max-w-[1200px] mx-auto px-4">
        
        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-16">
          
          {/* Column 1 */}
          <div>
            <h3 className="font-extrabold text-gray-900 mb-6 text-lg">À propos de DjibTout</h3>
            <ul className="space-y-4 text-[13px] text-gray-600 font-medium">
              <li><Link href="/" className="hover:text-[#0052cc]">Qui sommes-nous ?</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Carrières</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Presse</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Contactez-nous</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Politique environnementale</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="font-extrabold text-gray-900 mb-6 text-lg">Service Client</h3>
            <ul className="space-y-4 text-[13px] text-gray-600 font-medium">
              <li><Link href="/" className="hover:text-[#0052cc]">Aide & Centre de support</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Annulation et Remboursement</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Options de livraison</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Signaler un problème</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Mes Commandes</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="font-extrabold text-gray-900 mb-6 text-lg">Gagner de l’argent</h3>
            <ul className="space-y-4 text-[13px] text-gray-600 font-medium">
              <li><Link href="/" className="hover:text-[#0052cc]">Vendez sur DjibTout</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Devenez affilié</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Programme partenaires</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Publicité sur DjibTout</Link></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h3 className="font-extrabold text-gray-900 mb-6 text-lg">Catégories Populaires</h3>
            <ul className="space-y-4 text-[13px] text-gray-600 font-medium">
              <li><Link href="/" className="hover:text-[#0052cc]">Téléphones Portables</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Ordinateurs Portables</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Électroménager</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Mode & Beauté</Link></li>
              <li><Link href="/" className="hover:text-[#0052cc]">Bricolage & Jardin</Link></li>
            </ul>
          </div>

          {/* Column 5: App & Socials */}
          <div>
            <h3 className="font-extrabold text-gray-900 mb-6 text-lg">Téléchargez notre App</h3>
            <div className="space-y-3 mb-8">
              <Link href="/" className="block border border-gray-300 rounded-lg p-2 flex items-center hover:bg-gray-50 transition-colors">
                <Smartphone className="h-8 w-8 text-gray-800 mr-3" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Disponible sur</div>
                  <div className="text-sm font-extrabold text-gray-900">App Store</div>
                </div>
              </Link>
              <Link href="/" className="block border border-gray-300 rounded-lg p-2 flex items-center hover:bg-gray-50 transition-colors">
                <Smartphone className="h-8 w-8 text-gray-800 mr-3" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Disponible sur</div>
                  <div className="text-sm font-extrabold text-gray-900">Google Play</div>
                </div>
              </Link>
            </div>
            
            <h3 className="font-extrabold text-gray-900 mb-4 text-sm">Suivez-nous</h3>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#0052cc] hover:text-white transition-colors text-xs font-bold">
                FB
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#0052cc] hover:text-white transition-colors text-xs font-bold">
                X
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#0052cc] hover:text-white transition-colors text-xs font-bold">
                IG
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#0052cc] hover:text-white transition-colors text-xs font-bold">
                YT
              </a>
            </div>
          </div>
        </div>
        
        {/* Payment Methods & Bottom Bar */}
        <div className="border-t border-gray-200 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-6">
            <span className="text-xs font-bold text-gray-500 uppercase">Paiement Sécurisé :</span>
            <div className="flex space-x-3">
              {/* Waafi / D-Money badges */}
              <div className="h-8 px-4 bg-[#0052cc] text-white flex items-center justify-center rounded font-extrabold text-sm shadow-sm">
                WAAFI
              </div>
              <div className="h-8 px-4 bg-gray-800 text-white flex items-center justify-center rounded font-extrabold text-sm shadow-sm">
                D-MONEY
              </div>
              <div className="h-8 px-4 bg-gray-200 text-gray-700 flex items-center justify-center rounded font-extrabold text-sm shadow-sm border border-gray-300">
                CASH
              </div>
            </div>
          </div>
          
          <div className="flex space-x-6 text-[11px] text-gray-500 font-medium">
            <Link href="/" className="hover:text-[#0052cc]">Conditions d’utilisation</Link>
            <Link href="/" className="hover:text-[#0052cc]">Confidentialité</Link>
            <Link href="/" className="hover:text-[#0052cc]">Mentions légales</Link>
          </div>
        </div>

        <div className="text-center text-[11px] text-gray-400 pb-12 border-t border-gray-100 pt-8">
          <div className="mb-5 flex justify-center"><LanguageSwitcher /></div>
          <p className="mb-2">DjibTout est la plateforme de commerce en ligne leader à Djibouti, offrant des milliers de produits allant de l’électronique à la mode.</p>
          &copy; {new Date().getFullYear()} DjibTout. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
