"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, ChevronRight, ChevronLeft } from "lucide-react";

export default function VendeurPortal() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8082/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Identifiants incorrects");
      }

      // Check if user is seller
      if (data.role !== "SELLER") {
        throw new Error(
          "Ce portail est réservé aux vendeurs. Veuillez utiliser la connexion client.",
        );
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({ name: data.name, email: data.email, role: data.role }),
      );

      router.replace("/seller");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex">
      {/* Left Side - Auth Panel */}
      <div className="w-full lg:w-[450px] bg-white flex flex-col pt-16 px-12 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.1)] z-10">
        <div className="flex items-center mb-16">
          <div className="text-[28px] font-black text-[#0052cc] tracking-tighter flex items-center">
            djibtout
          </div>
          <div className="flex items-center ml-2 text-xl font-bold text-[#484848]">
            <Store className="h-6 w-6 text-[#6b21a8] mx-2" />
            Partenaires
          </div>
        </div>

        <h2 className="text-[22px] font-bold text-[#484848] mb-8">
          Panneau Vendeur
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail du vendeur"
              className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-colors"
            />
          </div>

          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0052cc] hover:bg-[#003d99] text-white font-bold py-3.5 rounded-lg transition-colors mt-2"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>

          <div className="flex items-center justify-center my-6">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="px-4 text-sm text-gray-400 font-medium">ou</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <Link
            href="/vendeur/register"
            className="w-full flex items-center justify-center bg-[#e6efff] hover:bg-[#ccdfff] text-[#0052cc] font-bold py-3.5 rounded-lg transition-colors"
          >
            Devenir vendeur maintenant
          </Link>
        </form>

        <div className="mt-12">
          <button className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3.5 rounded-lg transition-colors">
            J’ai besoin d’aide
          </button>
        </div>

        {/* QR Code App Ad */}
        <div className="mt-8 bg-gray-50 rounded-xl p-4 flex items-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 mr-4 flex items-center justify-center">
            {/* Fake QR */}
            <div className="grid grid-cols-3 grid-rows-3 gap-1 p-2 w-full h-full">
              <div className="bg-gray-800 rounded-sm"></div>
              <div className="bg-transparent"></div>
              <div className="bg-gray-800 rounded-sm"></div>
              <div className="bg-transparent"></div>
              <div className="bg-gray-800 rounded-sm"></div>
              <div className="bg-transparent"></div>
              <div className="bg-gray-800 rounded-sm"></div>
              <div className="bg-gray-800 rounded-sm"></div>
              <div className="bg-gray-800 rounded-sm"></div>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-600 mb-2 leading-tight">
              Obtenez l’application DjibTout Partenaires, gérez votre boutique
              depuis votre mobile
            </p>
            <div className="flex space-x-2">
              <div className="h-6 w-16 bg-black rounded text-white text-[8px] flex items-center justify-center font-bold">
                App Store
              </div>
              <div className="h-6 w-16 bg-black rounded text-white text-[8px] flex items-center justify-center font-bold">
                Google Play
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Banner Ad */}
      <div className="hidden lg:flex flex-1 flex-col p-8">
        <div className="flex justify-end mb-4">
          <button className="bg-white border border-gray-200 px-4 py-1.5 rounded-md text-sm font-bold flex items-center shadow-sm hover:bg-gray-50">
            Académie <Store className="h-4 w-4 ml-2" />
          </button>
        </div>

        <div className="flex-1 rounded-3xl overflow-hidden relative shadow-lg flex flex-col">
          {/* Top Orange Part */}
          <div className="flex-1 bg-[#0052cc] p-12 flex flex-col justify-center relative overflow-hidden">
            {/* Purple Circle Decoration */}
            <div className="absolute right-[-100px] bottom-[-100px] w-[500px] h-[500px] border-[20px] border-[#6b21a8] rounded-full opacity-80"></div>

            <div className="relative z-10 max-w-lg">
              <h1 className="text-4xl font-black text-white leading-tight mb-6 uppercase">
                IL EST TEMPS DE PROFITER DES SOLUTIONS DE LIVRAISON INNOVANTES
                ET RAPIDES DE DJIBJET !
              </h1>
              <p className="text-xl text-white font-medium mb-8">
                Nous augmentons la satisfaction de vos clients avec notre
                infrastructure technologique solide.
              </p>
              <div className="text-3xl font-black text-white">djibJET</div>
            </div>

            {/* Truck Image Placeholder */}
            <div className="absolute right-10 bottom-10 w-[300px] h-[200px] bg-white rounded-lg shadow-2xl flex items-center justify-center text-[#0052cc] font-black text-4xl border-b-8 border-gray-300 rotate-[-5deg]">
              djibJET 🚚
            </div>

            {/* Slider arrows */}
            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-600 hover:text-[#0052cc]">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-600 hover:text-[#0052cc]">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Bottom Stats Part */}
          <div className="h-32 bg-gray-100 flex p-6 gap-6">
            <div className="flex-1 bg-white rounded-xl shadow-sm p-4 flex flex-col justify-center">
              <div className="text-xl font-black text-gray-800">
                1.2 Milliards FDJ
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Revenus générés par les vendeurs en 2025
              </div>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow-sm p-4 flex flex-col justify-center">
              <div className="text-xl font-black text-gray-800">200 mille+</div>
              <div className="text-xs text-gray-500 font-medium">
                Clients acheteurs actifs
              </div>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow-sm p-4 flex flex-col justify-center">
              <div className="text-xl font-black text-gray-800">6 régions</div>
              <div className="text-xs text-gray-500 font-medium">
                Service logistique DjibJet
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-[10px] text-gray-500 font-medium">
          🛡️ Achat sécurisé
          <br />
          Copyright 2026 - DjibTout E-commerce
        </div>
      </div>
    </div>
  );
}
