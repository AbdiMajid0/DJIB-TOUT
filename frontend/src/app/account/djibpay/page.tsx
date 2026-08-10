"use client";
import { useEffect, useState } from "react";
import { CreditCard, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  fetchWallet,
  fetchWalletTransactions,
  topupWallet,
  Wallet,
  WalletTransaction,
} from "@/lib/api";
export default function DjibpayPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [tx, setTx] = useState<WalletTransaction[]>([]);
  const [amount, setAmount] = useState("");
  const load = () =>
    Promise.all([fetchWallet(), fetchWalletTransactions()]).then(([w, t]) => {
      setWallet(w);
      setTx(t);
    });
  useEffect(() => {
    void load();
  }, []);
  async function topup(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (value > 0) {
      await topupWallet(value);
      setAmount("");
      load();
    }
  }
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#0052cc] to-[#003b91] text-white p-7">
        <CreditCard />
        <p className="mt-8 text-sm opacity-80">Solde disponible</p>
        <p className="text-4xl font-black">
          {(wallet?.balance || 0).toLocaleString("fr-DJ")} FDJ
        </p>
        <form onSubmit={topup} className="flex gap-2 mt-6">
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-white text-gray-900 rounded px-3 py-2"
            placeholder="Montant"
          />
          <button className="bg-white text-[#0052cc] font-bold rounded px-4">
            Recharger
          </button>
        </form>
        <p className="text-xs opacity-70 mt-2">
          Rechargement simulé pour le développement.
        </p>
      </section>
      <section className="bg-white border rounded-xl p-6">
        <h1 className="font-bold text-xl mb-4">Historique</h1>
        {tx.length === 0 ? (
          <p className="text-gray-500">Aucune transaction.</p>
        ) : (
          tx.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between border-b py-3"
            >
              <div className="flex gap-3">
                {t.type === "CREDIT" ? (
                  <ArrowDownLeft className="text-green-600" />
                ) : (
                  <ArrowUpRight className="text-red-600" />
                )}
                <div>
                  <p className="font-medium">{t.reason}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(t.createdAt).toLocaleString("fr-DJ")}
                  </p>
                </div>
              </div>
              <strong
                className={
                  t.type === "CREDIT" ? "text-green-600" : "text-red-600"
                }
              >
                {t.type === "CREDIT" ? "+" : "-"}
                {t.amount.toLocaleString("fr-DJ")} FDJ
              </strong>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
