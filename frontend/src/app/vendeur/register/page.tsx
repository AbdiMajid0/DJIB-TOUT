"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, CheckCircle2 } from "lucide-react";

export default function VendeurRegister() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8082/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "SELLER" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Une erreur est survenue lors de l'inscription.",
        );
      }

      setSuccess(true);

      const loginRes = await fetch("http://localhost:8082/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        localStorage.setItem("token", loginData.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: loginData.name,
            email: loginData.email,
            role: loginData.role,
          }),
        );

        setTimeout(() => {
          router.replace("/seller");
        }, 2000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center">
          <div className="flex justify-center mb-8">
            <div className="text-[24px] font-black text-[#0052cc] tracking-tighter flex items-center">
              djibtout
            </div>
            <div className="flex items-center ml-2 text-lg font-bold text-[#484848]">
              <Store className="h-5 w-5 text-[#6b21a8] mx-1" />
              Partenaires
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.1)] border border-gray-100 p-10 flex flex-col items-center">
            <CheckCircle2 className="h-20 w-20 text-green-500 mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Félicitations !
            </h2>
            <p className="text-gray-500 mb-6">
              Votre compte vendeur a été créé.
            </p>
            <p className="text-sm font-bold text-[#0052cc]">
              Redirection en cours...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col items-center pt-20 px-4">
      <div className="flex items-center mb-10">
        <div className="text-[28px] font-black text-[#0052cc] tracking-tighter flex items-center">
          djibtout
        </div>
        <div className="flex items-center ml-2 text-xl font-bold text-[#484848]">
          <Store className="h-6 w-6 text-[#6b21a8] mx-2" />
          Partenaires
        </div>
      </div>

      <div className="w-full max-w-[400px] border border-gray-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-[17px] font-bold text-[#484848] mb-6 leading-snug">
          Inscrivez-vous pour devenir vendeur ou connectez-vous à votre compte
          Partenaire
        </h2>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
              S’INSCRIRE
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la boutique"
              className="w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-colors"
            />
          </div>

          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail du vendeur"
              className="w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-colors"
            />
          </div>

          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0052cc] hover:bg-[#003d99] text-white font-bold py-3.5 rounded-lg transition-colors mt-2"
          >
            {isLoading ? "Inscription..." : "S’inscrire"}
          </button>
        </form>

        <div className="flex items-center justify-center my-6">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="px-4 text-[11px] text-gray-400 font-bold uppercase">
            ou
          </span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <Link
          href="/vendeur/login"
          className="w-full flex items-center justify-center bg-[#e6efff] hover:bg-[#ccdfff] text-[#0052cc] font-bold py-3.5 rounded-lg transition-colors"
        >
          Se connecter au compte Partenaire
        </Link>

        <p className="text-[10px] text-gray-500 mt-6 leading-tight">
          Vos données personnelles sont traitées conformément au texte
          d’information. En cliquant sur le bouton « S’inscrire » ou « Se
          connecter », vous approuvez le Contrat d’adhésion et déclarez avoir lu
          et accepté la Politique de confidentialité.
        </p>
      </div>
    </div>
  );
}
