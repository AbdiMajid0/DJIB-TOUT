"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  Smartphone,
  ShieldCheck,
  MapPin,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Truck,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { API_BASE_URL, Address, fetchAddresses } from "@/lib/api";

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("WAAFI");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [ussdPending, setUssdPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [confirmedOrderId, setConfirmedOrderId] = useState<
    number | string | null
  >(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("STANDARD");
  const [paidAmount, setPaidAmount] = useState(0);
  const idempotencyKey = useRef(crypto.randomUUID());

  const { items, getTotalPrice, clearCart } = useCartStore();

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setCouponCode(localStorage.getItem("djibtout_coupon") || "");
      fetchAddresses()
        .then((data) => {
          setAddresses(data);
          const preferred = data.find((a) => a.default) || data[0];
          if (preferred) setAddressId(preferred.id);
        })
        .catch(() => undefined);
    });
  }, []);

  const handlePayment = async () => {
    if (!addressId) {
      setError("Veuillez sélectionner ou créer une adresse de livraison.");
      return;
    }
    if (
      paymentMethod !== "DJIBPAY" &&
      (!phoneNumber || phoneNumber.trim().length < 6)
    ) {
      setError("Veuillez entrer un numéro de téléphone valide.");
      return;
    }

    setLoading(true);
    setError("");
    setUssdPending(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Vous devez être connecté pour passer une commande.");
      }

      // Étape 1 : Création de la commande en statut PENDING côté backend
      const orderRes = await fetch(`${API_BASE_URL}/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          paymentMethod,
          addressId,
          couponCode: couponCode.trim() || null,
          deliveryMethod,
          items: items.map((item) => ({
            productId: item.product.id,
            variantId: item.variant?.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!orderRes.ok) {
        if (orderRes.status === 401 || orderRes.status === 403) {
          throw new Error("Session expirée. Veuillez vous re-connecter.");
        }
        const text = await orderRes.text();
        throw new Error(text || "Erreur lors de la création de la commande.");
      }

      const orderData = await orderRes.json();

      if (!orderData.success || !orderData.orderId) {
        throw new Error(
          orderData.message || "Erreur lors de la création de la commande.",
        );
      }

      const createdOrderId = orderData.orderId;
      setConfirmedOrderId(createdOrderId);

      // Étape 2 : Passer en mode attente USSD (simulation d'invitation mobile)
      setUssdPending(true);

      // Simulation de temps d'attente USSD (2 secondes)
      if (paymentMethod !== "DJIBPAY")
        await new Promise((resolve) => setTimeout(resolve, 2000));

      // Étape 3 : Traitement du paiement sur la commande créée
      const paymentRes = await fetch(`${API_BASE_URL}/payments/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: createdOrderId,
          paymentMethod,
          phoneNumber: paymentMethod === "DJIBPAY" ? null : phoneNumber,
          amount: orderData.totalAmount,
        }),
      });

      if (!paymentRes.ok) {
        const text = await paymentRes.text();
        throw new Error(text || "Erreur lors du traitement du paiement.");
      }

      const paymentData = await paymentRes.json();

      if (!paymentData.success) {
        throw new Error(paymentData.message || "Le paiement a échoué.");
      }

      // Étape 4 : Succès du paiement
      setSuccess(true);
      setTransactionId(paymentData.transactionId);
      setPaidAmount(orderData.totalAmount);
      clearCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Paiement impossible.");
    } finally {
      setLoading(false);
      setUssdPending(false);
    }
  };

  if (!mounted) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 animate-in fade-in zoom-in duration-300">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Paiement Réussi !
          </h1>
          <p className="text-gray-500 mb-6">
            Votre commande a été confirmée et est en cours de traitement.
          </p>

          <div className="bg-gray-50 rounded-xl p-5 mb-8 text-left space-y-3 border border-gray-100">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Numéro de Commande
              </p>
              <p className="font-extrabold text-gray-900 text-lg">
                #{confirmedOrderId}
              </p>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Transaction ID ({paymentMethod})
              </p>
              <p className="font-mono text-sm font-bold text-[#0052cc]">
                {transactionId}
              </p>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Montant réglé
              </p>
              <p className="font-bold text-gray-900">
                {paidAmount.toLocaleString("fr-DJ")} FDJ
              </p>
            </div>
          </div>

          <Link
            href="/account/orders"
            className="block w-full py-4 bg-[#0052cc] text-white rounded-xl font-bold hover:bg-[#003d99] transition-colors mb-3"
          >
            Voir mes commandes
          </Link>
          <Link
            href="/"
            className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 h-[80px] flex items-center">
          <Link
            href="/"
            className="text-[32px] font-black text-[#0052cc] tracking-tighter flex items-center"
          >
            djibtout<span className="text-gray-900 ml-1 text-4xl">.</span>
          </Link>
          <div className="ml-auto flex items-center text-gray-500 text-sm font-medium">
            <ShieldCheck className="w-5 h-5 mr-2 text-green-600" />
            Paiement 100% Sécurisé
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1200px] mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        {/* Left Column - Delivery & Payment Form */}
        <div className="flex-1 space-y-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-bold text-gray-800 flex items-center">
              <MapPin className="w-5 h-5 mr-3 text-[#0052cc]" />
              Adresse de Livraison
            </div>
            <div className="p-6">
              <div className="grid gap-3 mb-4">
                {addresses.map((address) => (
                  <button
                    type="button"
                    key={address.id}
                    onClick={() => setAddressId(address.id)}
                    className={`text-left border-2 rounded-xl p-4 ${addressId === address.id ? "border-[#0052cc] bg-blue-50" : "border-gray-200"}`}
                  >
                    <strong>{address.label}</strong>
                    <p className="text-sm text-gray-600">
                      {address.fullAddress}, {address.city}
                    </p>
                  </button>
                ))}
                {addresses.length === 0 && (
                  <Link
                    href="/account/addresses"
                    className="text-[#0052cc] font-bold"
                  >
                    Ajouter une adresse de livraison
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center border-b bg-gray-50 px-6 py-4 font-bold text-gray-800">
              <Truck className="mr-3 h-5 w-5 text-[#0052cc]" />
              Mode de livraison
            </div>
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod("STANDARD")}
                className={`rounded-xl border-2 p-4 text-left ${deliveryMethod === "STANDARD" ? "border-[#0052cc] bg-blue-50" : "border-gray-200"}`}
              >
                <strong className="block">Livraison standard</strong>
                <small className="text-gray-500">
                  1 500 FDJ, gratuite dès 50 000 FDJ
                </small>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("EXPRESS")}
                className={`rounded-xl border-2 p-4 text-left ${deliveryMethod === "EXPRESS" ? "border-[#0052cc] bg-blue-50" : "border-gray-200"}`}
              >
                <strong className="block">Livraison express</strong>
                <small className="text-gray-500">Prioritaire — 3 000 FDJ</small>
              </button>
            </div>
          </div>

          {/* Payment Options & Mobile Input */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-bold text-gray-800 flex items-center">
              <CreditCard className="w-5 h-5 mr-3 text-[#0052cc]" />
              Moyen de Paiement
            </div>
            <div className="p-6">
              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div
                  className={`border-2 rounded-xl p-4 cursor-pointer flex flex-col items-center justify-center transition-all ${paymentMethod === "WAAFI" ? "border-[#0052cc] bg-blue-50/60 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
                  onClick={() => setPaymentMethod("WAAFI")}
                >
                  <Smartphone
                    className={`w-8 h-8 mb-2 ${paymentMethod === "WAAFI" ? "text-[#0052cc]" : "text-gray-400"}`}
                  />
                  <span className="font-bold text-gray-800">Waafi</span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    Telesom / Hormuud
                  </span>
                </div>

                <div
                  className={`border-2 rounded-xl p-4 cursor-pointer flex flex-col items-center justify-center transition-all ${paymentMethod === "DMONEY" ? "border-[#0052cc] bg-blue-50/60 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
                  onClick={() => setPaymentMethod("DMONEY")}
                >
                  <Smartphone
                    className={`w-8 h-8 mb-2 ${paymentMethod === "DMONEY" ? "text-[#0052cc]" : "text-gray-400"}`}
                  />
                  <span className="font-bold text-gray-800">D-Money</span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    Djibouti Telecom
                  </span>
                </div>
                <div
                  className={`border-2 rounded-xl p-4 cursor-pointer flex flex-col items-center justify-center ${paymentMethod === "DJIBPAY" ? "border-[#0052cc] bg-blue-50/60" : "border-gray-200"}`}
                  onClick={() => setPaymentMethod("DJIBPAY")}
                >
                  <CreditCard className="w-8 h-8 mb-2" />
                  <span className="font-bold">Djibpay</span>
                  <span className="text-xs text-gray-500">Portefeuille</span>
                </div>
              </div>

              {/* Form Input */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">
                  Détails du paiement mobile ({paymentMethod})
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro de téléphone mobile
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading || ussdPending}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:border-transparent font-medium"
                      placeholder="Ex: 77 83 XX XX"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Mode
                      de test dynamique :
                    </p>
                    <p>
                      • Pour tester un <strong>succès</strong> : Entrez
                      n’importe quel numéro valide (ex. : 77 88 99 00).
                    </p>
                    <p>
                      • Pour tester un <strong>solde insuffisant</strong> :
                      Terminez par{" "}
                      <code className="bg-amber-100 font-mono px-1 rounded">
                        000
                      </code>
                      .
                    </p>
                    <p>
                      • Pour tester un <strong>refus/timeout USSD</strong> :
                      Terminez par{" "}
                      <code className="bg-amber-100 font-mono px-1 rounded">
                        999
                      </code>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* USSD Confirmation Overlay / Card */}
              {ussdPending && (
                <div className="mt-6 p-6 bg-blue-50 border-2 border-[#0052cc] rounded-2xl text-center space-y-3 animate-in fade-in duration-300">
                  <Loader2 className="w-10 h-10 text-[#0052cc] animate-spin mx-auto" />
                  <h4 className="font-extrabold text-gray-900 text-lg">
                    Demande USSD envoyée
                  </h4>
                  <p className="text-sm text-gray-700 max-w-md mx-auto">
                    Une invitation de paiement{" "}
                    <strong className="text-[#0052cc]">{paymentMethod}</strong>{" "}
                    a été transmise au <strong>{phoneNumber}</strong>.
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    Veuillez entrer votre code secret sur votre téléphone pour
                    valider la transaction...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Summary & Action Button */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-4">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">
              Résumé de la commande
            </h2>

            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-600 truncate mr-4">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="font-medium text-gray-900 whitespace-nowrap">
                    {(item.product.price * item.quantity).toLocaleString(
                      "fr-DJ",
                    )}{" "}
                    FDJ
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6 space-y-3 text-sm">
              <input
                value={couponCode}
                onChange={(event) =>
                  setCouponCode(event.target.value.toUpperCase())
                }
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Code promo"
              />
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{getTotalPrice().toLocaleString("fr-DJ")} FDJ</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frais de livraison</span>
                <span className="text-green-600 font-bold">Gratuit</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-[#0052cc]">
                  {getTotalPrice().toLocaleString("fr-DJ")} FDJ
                </span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading || ussdPending || items.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all flex items-center justify-center gap-2 ${
                loading || ussdPending || items.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#0052cc] hover:bg-[#003d99] shadow-md hover:shadow-lg cursor-pointer"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Traitement en cours...</span>
                </>
              ) : (
                <>
                  <span>Confirmer et Payer</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              En confirmant, vous acceptez les conditions générales de vente de
              DjibTout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
