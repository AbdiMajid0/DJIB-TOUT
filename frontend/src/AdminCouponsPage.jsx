import React from 'react'
import { AlertCircle, CheckCircle2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { api } from './lib/api'
import './admin-config.css'

const vide = { code: '', discountType: 'PERCENTAGE', discountValue: '', expiresAt: '', usageLimit: '', active: true }

const montant = (n) => new Intl.NumberFormat('fr-FR').format(Number(n || 0)) + ' FDJ'
const remise = (c) =>
  c.discountType === 'PERCENTAGE' ? `${Number(c.discountValue || 0)} %` : montant(c.discountValue)

const dateCourte = (v) => {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('fr-FR')
}

// Reprend isUsable() du backend : actif, non expire, quota non atteint.
const utilisable = (c) =>
  c.active
  && (!c.expiresAt || new Date(c.expiresAt) > new Date())
  && (c.usageLimit == null || Number(c.usedCount || 0) < Number(c.usageLimit))

// <input type="datetime-local"> attend AAAA-MM-JJTHH:MM sans fuseau.
const versChamp = (v) => (v ? String(v).slice(0, 16) : '')

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = React.useState(null)
  const [form, setForm] = React.useState(null)
  const [erreur, setErreur] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(() => {
    api('/admin/coupons')
      .then((d) => setCoupons(Array.isArray(d) ? d : []))
      .catch((e) => { setErreur(e.message); setCoupons([]) })
  }, [])

  React.useEffect(() => { load() }, [load])

  function ouvrir(c) {
    setErreur(''); setMessage('')
    setForm(c
      ? { ...c, expiresAt: versChamp(c.expiresAt), usageLimit: c.usageLimit ?? '' }
      : { ...vide })
  }

  async function enregistrer(e) {
    e.preventDefault()
    setBusy(true); setErreur(''); setMessage('')
    try {
      // Un seul endpoint POST sert la creation et la modification : l'id
      // present dans le corps declenche la mise a jour cote serveur.
      const corps = {
        id: form.id ?? null,
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        expiresAt: form.expiresAt ? `${form.expiresAt}:00` : null,
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
        active: form.active,
      }
      await api('/admin/coupons', { method: 'POST', body: JSON.stringify(corps) })
      setMessage(form.id ? `Coupon ${corps.code} modifié.` : `Coupon ${corps.code} créé.`)
      setForm(null)
      load()
    } catch (err) {
      setErreur(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function supprimer(c) {
    if (!confirm(`Supprimer le coupon ${c.code} ?`)) return
    setBusy(true); setErreur(''); setMessage('')
    try {
      await api(`/admin/coupons/${c.id}`, { method: 'DELETE' })
      setMessage(`Coupon ${c.code} supprimé.`)
      load()
    } catch (err) {
      setErreur(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (coupons === null && !erreur) return <div className="cfg"><p className="cfg-chargement">Chargement des coupons…</p></div>

  return (
    <div className="cfg">
      <div className="cfg-barre">
        <span className="cfg-gris">{(coupons || []).length} coupon(s)</span>
        {!form && <button className="cfg-nouveau" onClick={() => ouvrir(null)}><Plus size={15} /> Nouveau coupon</button>}
      </div>

      {erreur && <div className="cfg-erreur" role="alert"><AlertCircle size={16} />{erreur}</div>}
      {message && <div className="cfg-succes" role="status"><CheckCircle2 size={16} />{message}</div>}

      {form && (
        <form className="cfg-form" onSubmit={enregistrer}>
          <h2>{form.id ? `Modifier ${form.code}` : 'Nouveau coupon'}</h2>
          <div className="cfg-champs">
            <label>
              Code
              <input
                type="text" required maxLength={40} value={form.code}
                onChange={(e) => setForm((v) => ({ ...v, code: e.target.value.toUpperCase() }))}
              />
              <small>Converti en majuscules.</small>
            </label>
            <label>
              Type de remise
              <select
                value={form.discountType}
                onChange={(e) => setForm((v) => ({ ...v, discountType: e.target.value }))}
              >
                <option value="PERCENTAGE">Pourcentage</option>
                <option value="FIXED">Montant fixe</option>
              </select>
            </label>
            <label>
              Valeur
              <input
                type="number" required min={0} step="0.01" value={form.discountValue}
                onChange={(e) => setForm((v) => ({ ...v, discountValue: e.target.value }))}
              />
              <small>{form.discountType === 'PERCENTAGE' ? 'En pourcentage.' : 'En francs Djibouti.'}</small>
            </label>
            <label>
              Expire le
              <input
                type="datetime-local" value={form.expiresAt}
                onChange={(e) => setForm((v) => ({ ...v, expiresAt: e.target.value }))}
              />
              <small>Vide = sans expiration.</small>
            </label>
            <label>
              Limite d'utilisation
              <input
                type="number" min={1} value={form.usageLimit}
                onChange={(e) => setForm((v) => ({ ...v, usageLimit: e.target.value }))}
              />
              <small>Vide = illimité.</small>
            </label>
            <label className="cfg-case">
              <input
                type="checkbox" checked={form.active}
                onChange={(e) => setForm((v) => ({ ...v, active: e.target.checked }))}
              />
              Coupon actif
            </label>
          </div>
          <footer>
            <button type="submit" className="cfg-valider" disabled={busy}>
              {busy ? 'Enregistrement…' : form.id ? 'Enregistrer' : 'Créer'}
            </button>
            <button type="button" onClick={() => setForm(null)} disabled={busy}><X size={14} /> Annuler</button>
          </footer>
        </form>
      )}

      {!coupons?.length ? (
        <p className="cfg-vide">Aucun coupon. Créez-en un pour lancer une promotion.</p>
      ) : (
        <div className="cfg-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Remise</th>
                <th scope="col">Utilisations</th>
                <th scope="col">Expiration</th>
                <th scope="col">État</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const ok = utilisable(c)
                return (
                  <tr key={c.id} className={ok ? '' : 'cfg-inactif'}>
                    <th scope="row"><span className="cfg-mono">{c.code}</span></th>
                    <td>{remise(c)}</td>
                    <td>
                      {Number(c.usedCount || 0)}
                      {c.usageLimit != null ? ` / ${c.usageLimit}` : <span className="cfg-gris"> / illimité</span>}
                    </td>
                    <td>{dateCourte(c.expiresAt) || <span className="cfg-gris">—</span>}</td>
                    <td>
                      <span className={`cfg-etat ${ok ? 'actif' : 'inactif'}`}>
                        {!c.active ? 'Désactivé'
                          : c.expiresAt && new Date(c.expiresAt) <= new Date() ? 'Expiré'
                          : ok ? 'Utilisable' : 'Quota atteint'}
                      </span>
                    </td>
                    <td className="cfg-actions">
                      <button onClick={() => ouvrir(c)} disabled={busy}><Pencil size={14} /> Modifier</button>
                      <button className="cfg-suppr" onClick={() => supprimer(c)} disabled={busy}>
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
