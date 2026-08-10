"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
function Verify() {
  const params = useSearchParams(),
    [message, setMessage] = useState("Vérification en cours…");
  useEffect(() => {
    queueMicrotask(() => {
      const token = params.get("token");
      if (!token) {
        setMessage("Lien invalide.");
        return;
      }
      fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).then(async (response) => setMessage((await response.json()).message));
    });
  }, [params]);
  return (
    <main className="grid min-h-[70vh] place-items-center bg-[#f6f7f9] p-4">
      <section className="w-full max-w-md rounded-2xl border bg-white p-8 text-center">
        <h1 className="text-2xl font-black">Vérification de l’email</h1>
        <p className="mt-4 text-sm">{message}</p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white"
        >
          Se connecter
        </Link>
      </section>
    </main>
  );
}
export default function VerifyEmailPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}
