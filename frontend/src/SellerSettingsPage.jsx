import React from "react";
import { Save, Trash2, UserPlus } from "lucide-react";
import { api } from "./lib/api";
import "./seller-settings.css";
import MediaUploader from "./MediaUploader";
const roles = {
  STORE_MANAGER: "Responsable boutique",
  CATALOG_MANAGER: "Catalogue",
  ORDER_MANAGER: "Commandes",
  SUPPORT: "Service client",
};
export default function SellerSettingsPage({ teamMode = false }) {
  const [store, setStore] = React.useState(null),
    [team, setTeam] = React.useState([]),
    [invite, setInvite] = React.useState({ email: "", role: "SUPPORT" }),
    [password, setPassword] = React.useState({
      currentPassword: "",
      newPassword: "",
      confirm: "",
    }),
    [error, setError] = React.useState(""),
    [message, setMessage] = React.useState(""),
    [busy, setBusy] = React.useState(false);
  const load = () =>
    Promise.all([api("/seller/store"), api("/seller/team")])
      .then(([s, t]) => {
        setStore(s);
        setTeam(t);
      })
      .catch((e) => setError(e.message));
  React.useEffect(() => {
    load();
  }, []);
  const change = (e) => setStore({ ...store, [e.target.name]: e.target.value });
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      setStore(
        await api("/seller/store", {
          method: "PUT",
          body: JSON.stringify({ ...store, submitOnboarding: false }),
        }),
      );
      setMessage("Paramètres enregistrés.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/seller/team", {
        method: "POST",
        body: JSON.stringify(invite),
      });
      setInvite({ email: "", role: "SUPPORT" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function role(id, value) {
    await api(`/seller/team/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ email: "staff@djibtout.com", role: value }),
    });
    load();
  }
  async function remove(id) {
    if (confirm("Retirer ce collaborateur ?")) {
      await api(`/seller/team/${id}`, { method: "DELETE" });
      load();
    }
  }
  async function passwordSave(e) {
    e.preventDefault();
    if (password.newPassword !== password.confirm)
      return setError("Les mots de passe ne correspondent pas.");
    setBusy(true);
    try {
      const x = await api("/account/password", {
        method: "PUT",
        body: JSON.stringify(password),
      });
      setMessage(x.message);
      setPassword({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!store) return <div className="portal-content">Chargement…</div>;
  return (
    <div className="portal-content seller-settings">
      <header>
        <small>PARAMÈTRES</small>
        <h1>{teamMode ? "Membres et permissions" : "Ma boutique"}</h1>
        <p>
          {teamMode
            ? "Gérez les accès de votre équipe."
            : "Profil public, horaires, contacts, politiques et sécurité."}
        </p>
      </header>
      {error && <div className="api-error">{error}</div>}
      {message && <div className="api-success">{message}</div>}
      {teamMode ? (
        <>
          <form className="team-invite" onSubmit={add}>
            <UserPlus />
            <input
              type="email"
              value={invite.email}
              onChange={(e) => setInvite({ ...invite, email: e.target.value })}
              placeholder="E-mail du collaborateur"
              required
            />
            <select
              value={invite.role}
              onChange={(e) => setInvite({ ...invite, role: e.target.value })}
            >
              {Object.entries(roles).map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
            <button>Ajouter</button>
          </form>
          <section className="team-list">
            <h2>Équipe</h2>
            {team.map((x) => (
              <article key={x.id}>
                <i>{x.user.name.slice(0, 2).toUpperCase()}</i>
                <span>
                  <b>{x.user.name}</b>
                  <small>{x.user.email}</small>
                </span>
                <select
                  value={x.staffRole}
                  onChange={(e) => role(x.id, e.target.value)}
                >
                  {Object.entries(roles).map(([v, l]) => (
                    <option value={v} key={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <button onClick={() => remove(x.id)}>
                  <Trash2 />
                </button>
              </article>
            ))}
            {!team.length && <p>Aucun collaborateur.</p>}
          </section>
          <section className="permissions">
            <h2>Permissions</h2>
            {Object.entries(roles).map(([v, l]) => (
              <div key={v}>
                <b>{l}</b>
                <span>
                  {v === "STORE_MANAGER"
                    ? "Boutique et gestion générale"
                    : v === "CATALOG_MANAGER"
                      ? "Produits et stocks"
                      : v === "ORDER_MANAGER"
                        ? "Commandes et retours"
                        : "Questions et avis clients"}
                </span>
              </div>
            ))}
          </section>
        </>
      ) : (
        <>
          <form className="store-settings-form" onSubmit={save}>
            <section>
              <h2>Profil public</h2>
              <div className="settings-grid">
                <label>
                  Nom
                  <input
                    name="name"
                    value={store.name || ""}
                    onChange={change}
                  />
                </label>
                <label>
                  Type d’activité
                  <input
                    name="businessType"
                    value={store.businessType || ""}
                    onChange={change}
                  />
                </label>
                <label className="wide">
                  Description
                  <textarea
                    name="description"
                    value={store.description || ""}
                    onChange={change}
                  />
                </label>
                <MediaUploader
                  label="Logo de la boutique"
                  value={store.logoUrl || ""}
                  onChange={(logoUrl) => setStore({ ...store, logoUrl })}
                />
                <MediaUploader
                  label="Bannière de la boutique"
                  value={store.bannerUrl || ""}
                  onChange={(bannerUrl) => setStore({ ...store, bannerUrl })}
                />
              </div>
            </section>
            <section>
              <h2>Contacts et horaires</h2>
              <div className="settings-grid">
                <label>
                  E-mail public
                  <input
                    type="email"
                    name="contactEmail"
                    value={store.contactEmail || ""}
                    onChange={change}
                  />
                </label>
                <label>
                  Téléphone
                  <input
                    name="phone"
                    value={store.phone || ""}
                    onChange={change}
                  />
                </label>
                <label>
                  WhatsApp
                  <input
                    name="whatsappNumber"
                    value={store.whatsappNumber || ""}
                    onChange={change}
                  />
                </label>
                <label className="wide">
                  Adresse
                  <textarea
                    name="businessAddress"
                    value={store.businessAddress || ""}
                    onChange={change}
                  />
                </label>
                <label className="wide">
                  Horaires
                  <textarea
                    name="openingHours"
                    value={store.openingHours || ""}
                    onChange={change}
                    placeholder="Samedi – Jeudi : 8h00 – 19h00"
                  />
                </label>
              </div>
            </section>
            <section>
              <h2>Livraison et retours</h2>
              <label>
                Politique de livraison
                <textarea
                  name="deliveryPolicy"
                  value={store.deliveryPolicy || ""}
                  onChange={change}
                />
              </label>
              <label>
                Politique de retour
                <textarea
                  name="returnPolicy"
                  value={store.returnPolicy || ""}
                  onChange={change}
                />
              </label>
            </section>
            <footer>
              <button disabled={busy}>
                <Save /> Enregistrer
              </button>
            </footer>
          </form>
          <form className="security-settings" onSubmit={passwordSave}>
            <h2>Sécurité et mot de passe</h2>
            <div>
              <label>
                Mot de passe actuel
                <input
                  type="password"
                  value={password.currentPassword}
                  onChange={(e) =>
                    setPassword({
                      ...password,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label>
                Nouveau mot de passe
                <input
                  type="password"
                  minLength="8"
                  value={password.newPassword}
                  onChange={(e) =>
                    setPassword({ ...password, newPassword: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Confirmation
                <input
                  type="password"
                  minLength="8"
                  value={password.confirm}
                  onChange={(e) =>
                    setPassword({ ...password, confirm: e.target.value })
                  }
                  required
                />
              </label>
              <button disabled={busy}>Modifier</button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
