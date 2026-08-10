"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Store,
  Users,
  CreditCard,
  GraduationCap,
  TrendingUp,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Eye,
  Layers,
  Building,
  UserCheck,
  Truck,
} from "lucide-react";

/* ─── Scroll-reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

/* ─── Animated counter ─── */
function AnimatedCounter({
  end,
  suffix = "",
  duration = 2000,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString("fr-FR")}
      {suffix}
    </span>
  );
}

/* ─── DATA ─── */
const HERO_SLIDES = [
  {
    title:
      "Devenez vendeur sur DjibTout, faites découvrir vos produits à des millions de clients !",
    subtitle: "Profitez immédiatement du Pack de Bienvenue Légendaire.",
    bg: "from-[#6b21a8] to-[#4c1d95]",
  },
  {
    title:
      "DjibJET — Des solutions de livraison rapides et innovantes pour vos clients !",
    subtitle:
      "Nous augmentons la satisfaction de vos clients avec notre infrastructure technologique.",
    bg: "from-[#0052cc] to-[#003d99]",
  },
  {
    title:
      "Programme Femme Entrepreneure — 50% de réduction sur les commissions !",
    subtitle: "Soutien spécial pour les femmes entrepreneures à Djibouti.",
    bg: "from-[#be185d] to-[#9d174d]",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Inscrivez-vous au Panneau Vendeur DjibTout Partenaires",
    desc: 'Rendez-vous sur la page DjibTout Partenaires, cliquez sur "Nouvelle inscription", choisissez le type de vendeur qui vous convient, entrez le nom de votre boutique et créez votre mot de passe.',
    mockup: ["Connexion", "Nouvelle inscription"],
  },
  {
    num: "02",
    title: "Complétez vos informations et documents",
    desc: "Remplissez vos informations personnelles et professionnelles. Ajoutez votre numéro de téléphone, votre adresse et vos coordonnées bancaires.",
    mockup: ["Informations", "Documents"],
  },
  {
    num: "03",
    title: "Ajoutez vos produits et commencez à vendre !",
    desc: "Une fois votre compte vérifié, ajoutez vos premiers produits avec des photos de qualité, fixez vos prix et lancez-vous !",
    mockup: ["Mes Produits", "Ajouter"],
  },
];

const BENEFITS = [
  {
    icon: CreditCard,
    title: "Paiements sécurisés",
    desc: "Proposez le paiement par carte, DjibPay ou mobile money en toute sécurité.",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Store,
    title: "Boutique gratuite",
    desc: "Créez votre magasin en ligne gratuitement, sans frais d'ouverture.",
    color: "from-purple-500 to-pink-400",
  },
  {
    icon: GraduationCap,
    title: "Formations E-commerce",
    desc: "Accédez à l'Académie DjibTout pour booster vos ventes.",
    color: "from-green-500 to-emerald-400",
  },
  {
    icon: TrendingUp,
    title: "Outils Marketing",
    desc: "Découvrez les outils et stratégies pour augmenter votre visibilité.",
    color: "from-orange-500 to-yellow-400",
  },
  {
    icon: Truck,
    title: "Logistique DjibJET",
    desc: "Livraison rapide dans 6 régions grâce à DjibJET.",
    color: "from-red-500 to-rose-400",
  },
];

const TESTIMONIALS = [
  {
    name: "Amina Hassan",
    shop: "Parfums d'Orient",
    quote:
      "En tant qu'artisane de parfums, vendre en ligne était un rêve. Grâce à DjibTout, mon chiffre d'affaires a doublé en 3 mois !",
    avatar: "👩‍🦱",
  },
  {
    name: "Fatouma Ali",
    shop: "1000 Merveilles",
    quote:
      "Le programme Femme Entrepreneure m'a permis de lancer ma boutique sans frais. Le support est incroyable !",
    avatar: "👩",
  },
  {
    name: "Hodan Mohamed",
    shop: "HODAN DESIGN",
    quote:
      "DjibTout m'a ouvert les portes d'un marché que je n'aurais jamais pu atteindre seule. Aujourd'hui je vis de ma passion !",
    avatar: "👩‍🎨",
  },
  {
    name: "Sahra Youssouf",
    shop: "Délices de Sahra",
    quote:
      "Les réductions de commission m'ont permis de proposer des prix compétitifs et d'agrandir mon business.",
    avatar: "👩‍🍳",
  },
];

const FAQS = [
  {
    q: "Comment puis-je soumettre et visualiser mes informations ?",
    a: "Rendez-vous sur votre Panneau Vendeur, section 'Mon Compte'. Vous y trouverez toutes vos informations et pourrez les modifier à tout moment.",
  },
  {
    q: "Comment puis-je télécharger mes documents ?",
    a: "Dans votre Panneau Vendeur, accédez à 'Documents'. Ajoutez votre carte d'identité, registre de commerce et coordonnées bancaires.",
  },
  {
    q: "Comment puis-je signer le contrat ?",
    a: "Après avoir complété votre dossier, le contrat vous sera envoyé par email pour signature électronique.",
  },
  {
    q: "Que faire si mes documents sont refusés ?",
    a: "Un email vous expliquera la raison. Corrigez les problèmes et soumettez-les à nouveau.",
  },
  {
    q: "Comment savoir si mon compte est actif ?",
    a: "Un email de confirmation vous sera envoyé. Vérifiez aussi dans votre Panneau Vendeur, section 'Statut'.",
  },
  {
    q: "Quel type de vendeur dois-je choisir ?",
    a: "Entreprise = 'Standard'. Femme entrepreneure = programme dédié avec 50% de réduction sur les commissions.",
  },
  {
    q: "Quelles sont les conditions pour les nouveaux vendeurs ?",
    a: "Être majeur, disposer d'une adresse à Djibouti et posséder un compte bancaire ou mobile money.",
  },
  {
    q: "Comment voir mes taux de commission ?",
    a: "Consultez la grille tarifaire dans votre Panneau Vendeur ou dans la section 'Commissions' de la FAQ.",
  },
];

export default function VendeurLandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [heroSlide, setHeroSlide] = useState(0);
  const benefitRef = useRef<HTMLDivElement>(null);

  // Auto-slide hero
  useEffect(() => {
    const timer = setInterval(
      () => setHeroSlide((s) => (s + 1) % HERO_SLIDES.length),
      5000,
    );
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate steps
  useEffect(() => {
    const timer = setInterval(
      () => setActiveStep((s) => (s + 1) % STEPS.length),
      4000,
    );
    return () => clearInterval(timer);
  }, []);

  // Scroll benefits
  const scrollBenefits = useCallback((dir: number) => {
    if (!benefitRef.current) return;
    benefitRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
  }, []);

  // Section reveal hooks
  const [heroRef, heroVisible] = useReveal();
  const [typesRef, typesVisible] = useReveal();
  const [stepsRef, stepsVisible] = useReveal();
  const [benefitsRef, benefitsVisible] = useReveal();
  const [videoRef, videoVisible] = useReveal();
  const [statsRef, statsVisible] = useReveal();
  const [storiesRef, storiesVisible] = useReveal();
  const [ctaRef, ctaVisible] = useReveal();
  const [faqRef, faqVisible] = useReveal();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ══════════ HERO SLIDER ══════════ */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="relative h-[520px] md:h-[480px]">
          {HERO_SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 bg-gradient-to-br ${slide.bg} transition-all duration-1000 ease-in-out flex items-center ${
                heroSlide === i
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-full"
              }`}
            >
              <div className="max-w-[1100px] mx-auto px-6 flex flex-col md:flex-row items-center gap-10 w-full">
                <div
                  className={`md:w-3/5 transition-all duration-700 delay-300 ${heroVisible && heroSlide === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                  <div className="flex items-center space-x-2 mb-6">
                    <span className="text-2xl font-black text-white tracking-tight">
                      djibtout
                    </span>
                    <Store className="h-5 w-5 text-white" />
                    <span className="font-bold text-sm text-white/60">
                      Partenaires
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-[40px] font-black text-white leading-tight mb-5">
                    {slide.title}
                  </h1>
                  <p className="text-white/70 text-lg mb-8 font-medium">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/vendeur/login"
                      className="bg-white text-[#6b21a8] font-bold py-3.5 px-8 rounded-lg hover:scale-105 active:scale-95 transition-transform shadow-lg"
                    >
                      Devenir Vendeur
                    </Link>
                    <button className="border-2 border-white/50 text-white font-bold py-3.5 px-8 rounded-lg hover:bg-white/10 transition-colors">
                      En savoir plus
                    </button>
                  </div>
                </div>

                {/* Right badges (only on first slide) */}
                {i === 0 && (
                  <div
                    className={`md:w-2/5 flex flex-col gap-4 transition-all duration-700 delay-500 ${heroVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}
                  >
                    {[
                      {
                        icon: "%50",
                        bg: "bg-yellow-400",
                        t1: "Réduction Commission",
                        t2: "Sur toutes les catégories",
                      },
                      {
                        icon: "🎁",
                        bg: "bg-[#ff6000]",
                        t1: "5 000 FDJ",
                        t2: "Bonus Publicitaire Cadeau",
                      },
                      {
                        icon: "📈",
                        bg: "bg-[#6b21a8]",
                        t1: "7 500 FDJ",
                        t2: "Support Cargaison DjibTout",
                      },
                    ].map((b, bi) => (
                      <div
                        key={bi}
                        className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl flex items-center gap-4 hover:scale-[1.03] transition-transform cursor-default"
                        style={{ animationDelay: `${bi * 200}ms` }}
                      >
                        <div
                          className={`w-14 h-14 ${b.bg} rounded-full flex items-center justify-center text-white font-black text-xl shrink-0 shadow-md`}
                        >
                          {b.icon}
                        </div>
                        <div>
                          <div className="text-gray-800 font-extrabold">
                            {b.t1}
                          </div>
                          <div className="text-gray-500 text-sm">{b.t2}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Truck on second slide */}
                {i === 1 && (
                  <div
                    className={`md:w-2/5 flex justify-center transition-all duration-700 delay-500 ${heroVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
                  >
                    <div className="bg-white rounded-2xl shadow-2xl p-8 rotate-[-3deg] hover:rotate-0 transition-transform">
                      <Truck className="h-24 w-24 text-[#0052cc] mx-auto mb-4" />
                      <div className="text-center font-black text-2xl text-[#0052cc]">
                        djibJET
                      </div>
                      <div className="text-center text-gray-500 text-sm mt-1">
                        Livraison express
                      </div>
                    </div>
                  </div>
                )}

                {/* Badge on third slide */}
                {i === 2 && (
                  <div
                    className={`md:w-2/5 flex justify-center transition-all duration-700 delay-500 ${heroVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
                  >
                    <div className="bg-white rounded-full w-48 h-48 shadow-2xl flex flex-col items-center justify-center hover:scale-110 transition-transform">
                      <span className="text-5xl mb-2">👩‍💼</span>
                      <span className="font-black text-[#be185d] text-lg">
                        -50%
                      </span>
                      <span className="text-gray-500 text-xs font-medium">
                        Commission
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Slider dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                className={`h-2 rounded-full transition-all duration-500 ${heroSlide === i ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`}
              />
            ))}
          </div>

          {/* Slider arrows */}
          <button
            onClick={() =>
              setHeroSlide(
                (heroSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
              )
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full flex items-center justify-center transition-colors z-10"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={() => setHeroSlide((heroSlide + 1) % HERO_SLIDES.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full flex items-center justify-center transition-colors z-10"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </div>
      </section>

      {/* ══════════ SELLER TYPES ══════════ */}
      <section ref={typesRef} className="py-20 px-4">
        <div
          className={`max-w-[900px] mx-auto text-center transition-all duration-700 ${typesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">
            DjibTout Partenaires
          </h2>
          <p className="text-gray-500 mb-14 max-w-xl mx-auto">
            Choisissez le type de vendeur ci-dessous, postulez immédiatement et
            commencez à vendre !
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-12">
            <Link
              href="/vendeur/login"
              className={`flex-1 max-w-[350px] mx-auto flex flex-col items-center group transition-all duration-500 delay-200 ${typesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mb-5 group-hover:bg-green-100 group-hover:scale-110 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                <Users className="h-14 w-14 text-green-600" />
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-3 group-hover:text-green-600 transition-colors">
                Standard
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Idéal pour les entreprises et commerçants souhaitant vendre en
                ligne.
              </p>
            </Link>

            <Link
              href="/vendeur/login"
              className={`flex-1 max-w-[350px] mx-auto flex flex-col items-center group transition-all duration-500 delay-400 ${typesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <div className="w-28 h-28 bg-purple-50 rounded-full flex items-center justify-center mb-5 group-hover:bg-purple-100 group-hover:scale-110 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                <span className="text-5xl group-hover:scale-110 transition-transform">
                  👩‍💼
                </span>
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-3 group-hover:text-purple-600 transition-colors">
                Femme Entrepreneure
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                50% de réduction sur les commissions et des formations
                exclusives.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ HOW TO OPEN A STORE (Animated Steps) ══════════ */}
      <section
        ref={stepsRef}
        className="py-16 px-4 bg-gray-50 border-y border-gray-100"
      >
        <div
          className={`max-w-[1000px] mx-auto transition-all duration-700 ${stepsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-12 text-center">
            Comment ouvrir un magasin sur DjibTout ?
          </h2>

          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="md:w-1/2">
              <div className="flex gap-3 mb-10">
                {STEPS.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`w-12 h-12 rounded-full font-bold text-sm transition-all duration-300 ${
                      activeStep === i
                        ? "bg-[#0052cc] text-white shadow-lg scale-110"
                        : "bg-white border-2 border-gray-200 text-gray-400 hover:border-[#0052cc] hover:text-[#0052cc]"
                    }`}
                  >
                    {step.num}
                  </button>
                ))}
              </div>

              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`transition-all duration-500 ${activeStep === i ? "opacity-100 translate-x-0 h-auto" : "opacity-0 translate-x-[-20px] h-0 overflow-hidden absolute"}`}
                >
                  <h3 className="font-bold text-lg text-gray-800 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}

              {/* Progress bar */}
              <div className="mt-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0052cc] rounded-full transition-all duration-500"
                  style={{
                    width: `${((activeStep + 1) / STEPS.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Animated Mockup */}
            <div className="md:w-1/2">
              <div
                className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-8 transition-all duration-500 ${stepsVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
              >
                <div className="flex gap-2 mb-6">
                  {STEPS[activeStep].mockup.map((tab, ti) => (
                    <div
                      key={ti}
                      className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-300 ${ti === 1 ? "bg-[#0052cc] text-white shadow-md" : "bg-gray-100 text-gray-500"}`}
                    >
                      {tab}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((_, fi) => (
                    <div
                      key={fi}
                      className="h-11 bg-gray-100 rounded-lg animate-pulse"
                      style={{
                        animationDelay: `${fi * 200}ms`,
                        width: `${100 - fi * 12}%`,
                      }}
                    ></div>
                  ))}
                  <div className="h-11 bg-[#0052cc] rounded-lg w-2/5 mt-6 shadow-md flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      Continuer →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ BENEFITS CAROUSEL ══════════ */}
      <section ref={benefitsRef} className="py-20 px-4">
        <div
          className={`max-w-[1100px] mx-auto transition-all duration-700 ${benefitsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-12 text-center">
            Que vous réserve la plateforme Partenaires DjibTout ?
          </h2>

          <div className="relative">
            <button
              onClick={() => scrollBenefits(-1)}
              className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 hover:bg-gray-50 hover:scale-110 transition-all"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>

            <div
              ref={benefitRef}
              className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {BENEFITS.map((b, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 w-[260px] snap-start bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group cursor-default`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div
                    className={`w-[100px] h-[100px] bg-gradient-to-br ${b.color} rounded-2xl mb-6 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}
                  >
                    <b.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 text-center">
                    {b.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed text-center">
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollBenefits(1)}
              className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 hover:bg-gray-50 hover:scale-110 transition-all"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ VIDEO PROMO ══════════ */}
      <section
        ref={videoRef}
        className="py-16 px-4 bg-gray-50 border-y border-gray-100"
      >
        <div
          className={`max-w-[700px] mx-auto transition-all duration-700 ${videoVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl relative group cursor-pointer hover:shadow-3xl transition-shadow">
            <div className="w-full h-[380px] bg-gradient-to-br from-[#6b21a8] to-[#0052cc] flex items-center justify-center relative overflow-hidden">
              {/* Animated background circles */}
              <div className="absolute w-[600px] h-[600px] border border-white/10 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute w-[400px] h-[400px] border border-white/10 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_15s_linear_infinite_reverse]"></div>

              <div className="text-center relative z-10">
                <div className="flex justify-center items-center mb-6">
                  <span className="text-2xl font-black text-white tracking-tight">
                    djibtout
                  </span>
                  <Store className="h-5 w-5 text-white ml-2" />
                  <span className="font-bold text-sm text-white/60 ml-1">
                    Partenaires
                  </span>
                </div>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-125 transition-transform duration-500 shadow-xl">
                  <Play className="h-8 w-8 text-[#6b21a8] ml-1" />
                </div>
                <p className="text-white text-xl font-bold">Dépêchez-vous !</p>
                <p className="text-white/60 text-sm mt-1">
                  Découvrez comment devenir vendeur en 2 minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ ANIMATED STATS ══════════ */}
      <section ref={statsRef} className="py-16 px-4">
        <div
          className={`max-w-[1100px] mx-auto transition-all duration-700 ${statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              {
                icon: ShoppingBag,
                num: 2000000,
                suffix: "+",
                label: "produits",
                sub: "référencés",
              },
              {
                icon: Layers,
                num: 32,
                suffix: "",
                label: "catégories",
                sub: "différentes",
              },
              {
                icon: Eye,
                num: 210,
                suffix: "M",
                label: "visites",
                sub: "mensuelles",
              },
              {
                icon: Building,
                num: 101000,
                suffix: "+",
                label: "boutiques",
                sub: "actives",
              },
              {
                icon: UserCheck,
                num: 12000000,
                suffix: "+",
                label: "clients",
                sub: "actifs",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={`bg-white border border-gray-100 rounded-xl p-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <stat.icon className="h-7 w-7 text-gray-400 mx-auto mb-3" />
                <div className="text-2xl font-black text-gray-800">
                  {statsVisible ? (
                    <AnimatedCounter end={stat.num} suffix={stat.suffix} />
                  ) : (
                    "0"
                  )}
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-400">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ SUCCESS STORIES CAROUSEL ══════════ */}
      <section
        ref={storiesRef}
        className="py-20 px-4 bg-gray-50 border-y border-gray-100"
      >
        <div
          className={`max-w-[1100px] mx-auto transition-all duration-700 ${storiesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <h2 className="text-2xl md:text-3xl font-black text-[#6b21a8] mb-12 text-center">
            Histoires de réussite des femmes entrepreneures
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="flex flex-col items-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-4xl mb-3 shadow-sm group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                    {t.avatar}
                  </div>
                  <h4 className="font-bold text-gray-800">{t.name}</h4>
                  <p className="text-xs text-gray-400 font-medium">{t.shop}</p>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed italic flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER (Animated) ══════════ */}
      <section
        ref={ctaRef}
        className="bg-[#6b21a8] py-14 px-4 relative overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full -top-48 -left-48 animate-pulse"></div>
          <div
            className="absolute w-64 h-64 bg-purple-400/10 rounded-full -bottom-32 -right-32 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div
          className={`max-w-[800px] mx-auto text-center text-white relative z-10 transition-all duration-700 ${ctaVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          <h2 className="text-2xl md:text-3xl font-black mb-4">
            Commencez à vendre sur DjibTout dès maintenant !
          </h2>
          <p className="text-purple-200 mb-8 font-medium">
            Ouvrez votre boutique en un clic et vendez partout à Djibouti et à
            l’international.
          </p>
          <Link
            href="/vendeur/login"
            className="bg-white text-[#6b21a8] font-bold py-4 px-10 rounded-lg hover:scale-105 active:scale-95 transition-transform shadow-xl inline-block"
          >
            Devenir Vendeur
          </Link>
        </div>
      </section>

      {/* ══════════ FAQ ACCORDION ══════════ */}
      <section ref={faqRef} className="py-20 px-4">
        <div
          className={`max-w-[800px] mx-auto transition-all duration-700 ${faqVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <h2 className="text-2xl font-black text-gray-900 mb-10">
            Questions fréquentes
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-800 flex items-center">
                    <span className="text-gray-400 font-bold mr-4 text-sm">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`transition-all duration-300 overflow-hidden ${openFaq === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-sm text-gray-500 leading-relaxed ml-8">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ APP DOWNLOAD ══════════ */}
      <section className="py-10 px-4 border-t border-gray-100 bg-gray-50">
        <div className="max-w-[900px] mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-white rounded-xl border border-gray-200 flex-shrink-0 flex items-center justify-center shadow-sm">
            <div className="grid grid-cols-4 grid-rows-4 gap-[2px] p-3 w-full h-full">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-[1px] ${[0, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 15].includes(i) ? "bg-gray-800" : "bg-white"}`}
                ></div>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-[#0052cc] text-sm mb-1">
              Découvrez l’application DjibTout Partenaires !
            </h4>
            <p className="text-gray-500 text-xs">
              Gérez votre boutique depuis votre mobile avec toutes les
              fonctionnalités du Panneau Vendeur.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-black rounded-lg text-white text-[10px] flex items-center justify-center font-bold cursor-pointer hover:bg-gray-800 hover:scale-105 transition-all">
              Google Play
            </div>
            <div className="h-10 w-28 bg-black rounded-lg text-white text-[10px] flex items-center justify-center font-bold cursor-pointer hover:bg-gray-800 hover:scale-105 transition-all">
              App Store
            </div>
          </div>
          <div className="ml-auto">
            <span className="text-xl font-black text-[#0052cc] tracking-tight">
              djibtout
            </span>
            <span className="ml-1 font-bold text-sm text-gray-500">
              Partenaires
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
