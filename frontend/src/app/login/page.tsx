"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const endpoint = `${API_BASE_URL}/auth/${isLogin ? "login" : "register"}`;
      const payload = isLogin
        ? { email, password }
        : { name, email, password, role: "BUYER" };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Une erreur est survenue.");
      }

      if (isLogin) {
        // Store JWT token
        localStorage.setItem("token", data.token);
        if (data.refreshToken)
          localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: data.name,
            email: data.email,
            role: data.role,
          }),
        );
        router.replace("/");
      } else {
        setSuccess(
          "Inscription réussie ! Vous pouvez maintenant vous connecter.",
        );
        setIsLogin(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-16 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="flex">
            <button
              className={`flex-1 py-4 text-center font-bold text-sm transition-colors cursor-pointer ${isLogin ? "bg-white text-[#0052cc] border-t-4 border-[#0052cc]" : "bg-gray-50 text-gray-500 hover:text-gray-700"}`}
              onClick={() => {
                setIsLogin(true);
                setError("");
                setSuccess("");
              }}
            >
              SE CONNECTER
            </button>
            <button
              className={`flex-1 py-4 text-center font-bold text-sm transition-colors cursor-pointer ${!isLogin ? "bg-white text-[#0052cc] border-t-4 border-[#0052cc]" : "bg-gray-50 text-gray-500 hover:text-gray-700"}`}
              onClick={() => {
                setIsLogin(false);
                setError("");
                setSuccess("");
              }}
            >
              S’INSCRIRE
            </button>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-gray-900">
                {isLogin ? "Bienvenue sur DjibTout" : "Rejoignez DjibTout"}
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                {isLogin
                  ? "Connectez-vous pour accéder à vos commandes et votre wishlist."
                  : "Créez un compte pour profiter de toutes nos offres."}
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleAuth}>
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-[#0052cc] focus:border-[#0052cc] sm:text-sm"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-[#0052cc] focus:border-[#0052cc] sm:text-sm"
                    placeholder="vous@exemple.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-[#0052cc] focus:border-[#0052cc] sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
                {isLogin && (
                  <div className="flex justify-end mt-2">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-[#0052cc] hover:underline font-medium"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#0052cc] hover:bg-[#003d99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052cc] transition-colors cursor-pointer mt-6"
              >
                {isLogin ? "Se connecter" : "Créer mon compte"}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Ou</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col space-y-3">
                <a
                  href="http://localhost:8082/oauth2/authorization/google"
                  className="w-full flex justify-center items-center py-3 px-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Image
                    unoptimized
                    width={20}
                    height={20}
                    className="mr-3"
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Logo Google"
                  />
                  Continuer avec Google
                </a>

                <a
                  href="http://localhost:8082/oauth2/authorization/facebook"
                  className="w-full flex justify-center items-center py-3 px-4 border-2 border-[#1877F2] rounded-xl shadow-sm bg-[#1877F2] text-sm font-bold text-white hover:bg-[#166FE5] transition-colors cursor-pointer"
                >
                  <Image
                    unoptimized
                    width={20}
                    height={20}
                    className="mr-3 brightness-0 invert"
                    src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                    alt="Logo Facebook"
                  />
                  Continuer avec Facebook
                </a>

                <a
                  href="http://localhost:8082/oauth2/authorization/apple"
                  className="w-full flex justify-center items-center py-3 px-4 border-2 border-black rounded-xl shadow-sm bg-black text-sm font-bold text-white hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  <Image
                    unoptimized
                    width={20}
                    height={20}
                    className="mr-3 brightness-0 invert"
                    src="https://www.svgrepo.com/show/511330/apple-173.svg"
                    alt="Logo Apple"
                  />
                  Continuer avec Apple
                </a>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          En continuant, vous acceptez les{" "}
          <Link href="/terms" className="underline hover:text-[#0052cc]">
            Conditions d’utilisation
          </Link>{" "}
          et la{" "}
          <Link href="/privacy" className="underline hover:text-[#0052cc]">
            Politique de confidentialité
          </Link>{" "}
          de DjibTout.
        </p>
      </div>
    </div>
  );
}
