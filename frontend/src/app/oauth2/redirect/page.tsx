"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function OAuthRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // We got a token from Google/Facebook/Apple login.
      // Let's fetch the user details using this token.
      fetch("http://localhost:8082/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then(data => {
        // data should have { token, name, email, role }
        localStorage.setItem("token", data.token || token);
        localStorage.setItem("user", JSON.stringify({ name: data.name, email: data.email, role: data.role }));
        router.push("/");
      })
      .catch(err => {
        console.error("Error fetching user data after OAuth", err);
        router.push("/login?error=oauth_failed");
      });
    } else {
      router.push("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#0052cc] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-800">Connexion sécurisée en cours...</h2>
        <p className="text-gray-500 mt-2">Veuillez patienter pendant que nous vous connectons.</p>
      </div>
    </div>
  );
}

export default function OAuthRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <OAuthRedirectHandler />
    </Suspense>
  );
}
