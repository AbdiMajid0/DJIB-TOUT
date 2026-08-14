import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Clock3, Store } from "lucide-react";
import { api } from "./lib/api";
import "./seller-onboarding.css";
import SecureDocumentUpload from "./SecureDocumentUpload";

const initial = {
  name: "",
  description: "",
  businessType: "COMMERCE",
  phone: "",
  businessAddress: "",
  registrationNumber: "",
  logoUrl: "",
  bannerUrl: "",
  identityDocumentUrl: "",
  businessDocumentUrl: "",
  policies: "",
  termsAccepted: false,
};

export default function SellerOnboarding({ store: provided, onRefresh }) {
  const navigate = useNavigate(),
    [store, setStore] = React.useState(provided || null),
    [form, setForm] = React.useState(initial),
    [step, setStep] = React.useState(1),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState("");
  React.useEffect(() => {
    (provided ? Promise.resolve(provided) : api("/seller/store"))
      .then((data) => {
        setStore(data);
        setForm({ ...initial, ...data });
      })
      .catch((e) => setError(e.message));
  }, [provided]);
  const change = (e) =>
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  async function save(submit = false) {
    setBusy(true);
    setError("");
    try {
      const saved = await api("/seller/store", {
        method: "PUT",
        body: JSON.stringify({ ...form, submitOnboarding: submit }),
      });
      setStore(saved);
      setForm({ ...initial, ...saved });
      if (onRefresh) onRefresh(saved);
      if (!submit) setStep((x) => Math.min(4, x + 1));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!store)
    return (
      <div className="seller-onboard-loading">
        Préparation de votre espace vendeur…
      </div>
    );
  if (store.validated)
    return (
      <div className="seller-status">
        <i>
          <Check />
        </i>
        <h1>Votre boutique est validée</h1>
        <p>
          Vous pouvez maintenant gérer votre catalogue et recevoir des
          commandes.
        </p>
        <button onClick={() => navigate("/seller")}>
          Ouvrir le tableau de bord
        </button>
      </div>
    );
  if (store.onboardingSubmitted)
    return (
      <div className="seller-status pending">
        <i>
          <Clock3 />
        </i>
        <small>DOSSIER EN COURS D’EXAMEN</small>
        <h1>Merci, votre demande a bien été envoyée.</h1>
        <p>
          L’équipe DJIB TOUT vérifie vos informations. Vous recevrez une
          notification dès que votre boutique sera approuvée.
        </p>
        <div>
          <span>
            <Check /> Compte créé
          </span>
          <span>
            <Check /> Dossier envoyé
          </span>
          <span>
            <Clock3 /> Validation administrateur
          </span>
        </div>
        <Link to="/vendeur">Retour à l’espace vendeur</Link>
      </div>
    );
  return (
    <div className="seller-onboarding">
      <header>
        <Link to="/vendeur" className="seller-logo">
          <span>DT</span>
          <b>
            DJIB<em>TOUT</em>
            <small>VENDEURS</small>
          </b>
        </Link>
        <span>Création de votre boutique</span>
      </header>
      <main>
        <aside>
          <small>VOTRE PROGRESSION</small>
          {[
            ["Boutique", "Identité commerciale"],
            ["Coordonnées", "Contact et adresse"],
            ["Documents", "Vérification"],
            ["Confirmation", "Récapitulatif"],
          ].map((x, i) => (
            <div
              className={step === i + 1 ? "active" : step > i + 1 ? "done" : ""}
              key={x[0]}
            >
              <i>{step > i + 1 ? <Check /> : i + 1}</i>
              <span>
                <b>{x[0]}</b>
                <small>{x[1]}</small>
              </span>
            </div>
          ))}
        </aside>
        <section>
          <div className="seller-step-title">
            <i>
              <Store />
            </i>
            <span>
              <small>ÉTAPE {step} SUR 4</small>
              <h1>
                {
                  [
                    "Présentez votre boutique",
                    "Comment vous contacter ?",
                    "Documents de vérification",
                    "Vérifiez votre dossier",
                  ][step - 1]
                }
              </h1>
            </span>
          </div>
          {error && <div className="api-error">{error}</div>}
          {step === 1 && (
            <div className="seller-fields">
              <label>
                Nom commercial
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  required
                />
              </label>
              <label>
                Type d’activité
                <select
                  name="businessType"
                  value={form.businessType}
                  onChange={change}
                >
                  <option value="COMMERCE">Commerce</option>
                  <option value="RESTAURATION">Restauration</option>
                  <option value="SERVICES">Services</option>
                  <option value="ARTISANAT">Artisanat</option>
                </select>
              </label>
              <label className="wide">
                Description
                <textarea
                  name="description"
                  value={form.description || ""}
                  onChange={change}
                  placeholder="Présentez vos produits et votre activité…"
                />
              </label>
              <label>
                Logo (URL)
                <input
                  name="logoUrl"
                  value={form.logoUrl || ""}
                  onChange={change}
                />
              </label>
              <label>
                Bannière (URL)
                <input
                  name="bannerUrl"
                  value={form.bannerUrl || ""}
                  onChange={change}
                />
              </label>
            </div>
          )}
          {step === 2 && (
            <div className="seller-fields">
              <label>
                Téléphone professionnel
                <input
                  name="phone"
                  value={form.phone || ""}
                  onChange={change}
                  placeholder="77 00 00 00"
                  required
                />
              </label>
              <label>
                Numéro d’immatriculation
                <input
                  name="registrationNumber"
                  value={form.registrationNumber || ""}
                  onChange={change}
                />
              </label>
              <label className="wide">
                Adresse professionnelle
                <textarea
                  name="businessAddress"
                  value={form.businessAddress || ""}
                  onChange={change}
                  required
                />
              </label>
              <label className="wide">
                Politique de livraison et de retour
                <textarea
                  name="policies"
                  value={form.policies || ""}
                  onChange={change}
                />
              </label>
            </div>
          )}
          {step === 3 && (
            <div className="seller-fields">
              <div className="wide"><SecureDocumentUpload type="IDENTITY" label="Pièce d’identité *" onUploaded={d=>setForm({...form,identityDocumentUrl:`private-document:${d.id}`})}/></div>
              <div className="wide"><SecureDocumentUpload type="BUSINESS" label="Document commercial (facultatif)" onUploaded={d=>setForm({...form,businessDocumentUrl:`private-document:${d.id}`})}/></div>
              <p className="seller-document-note">
                Les documents sont uniquement utilisés pour vérifier l’identité
                du responsable de la boutique.
              </p>
            </div>
          )}
          {step === 4 && (
            <div className="seller-review">
              <div>
                <small>BOUTIQUE</small>
                <b>{form.name}</b>
                <p>
                  {form.businessType} ·{" "}
                  {form.description || "Aucune description"}
                </p>
              </div>
              <div>
                <small>COORDONNÉES</small>
                <b>{form.phone}</b>
                <p>{form.businessAddress}</p>
              </div>
              <div>
                <small>VÉRIFICATION</small>
                <b>Pièce d’identité renseignée</b>
                <p>
                  {form.registrationNumber || "Aucun numéro d’immatriculation"}
                </p>
              </div>
              <label>
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={form.termsAccepted}
                  onChange={change}
                />{" "}
                J’accepte les conditions applicables aux vendeurs DJIB TOUT.
              </label>
            </div>
          )}
          <footer>
            <button
              className="secondary"
              disabled={step === 1 || busy}
              onClick={() => setStep((x) => x - 1)}
            >
              <ChevronLeft /> Retour
            </button>
            {step < 4 ? (
              <button disabled={busy} onClick={() => save(false)}>
                {busy ? "Enregistrement…" : "Enregistrer et continuer"}
                <ChevronRight />
              </button>
            ) : (
              <button
                disabled={
                  busy ||
                  !form.termsAccepted ||
                  !form.phone ||
                  !form.businessAddress ||
                  !form.identityDocumentUrl
                }
                onClick={() => save(true)}
              >
                {busy ? "Envoi…" : "Envoyer mon dossier"}
                <ChevronRight />
              </button>
            )}
          </footer>
        </section>
      </main>
    </div>
  );
}
