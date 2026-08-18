import React from 'react'
import { AlertCircle, CheckCircle2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { api, dateCourte } from './lib/api'
import './admin-config.css'

// L'entite Campaign est stricte : title, subtitle, badge et linkUrl sont
// @NotBlank, et gradient est NOT NULL avec cette valeur par defaut. Envoyer
// null sur gradient fait echouer l'insertion cote base.
const DEGRADE_DEFAUT = 'from-[#063b8f] via-[#0052cc] to-[#2c7ef8]'

const vide = {
  title: '', subtitle: '', badge: '', linkUrl: '', imageUrl: '',
  gradient: DEGRADE_DEFAUT, active: true, displayOrder: 0, startsAt: '', endsAt: '',
}

// <input type="datetime-local"> attend AAAA-MM-JJTHH:MM sans fuseau.
const versChamp = (v) => (v ? String(v).slice(0, 16) : '')
const versApi = (v) => (v ? `${v}:00` : null)

// Une campagne peut etre active mais hors de sa fenetre de diffusion : on le
// distingue, sinon l'ecran affirmerait qu'elle est en ligne alors qu'elle ne
// l'est pas encore ou ne l'est plus.
function statut(c) {
  if (!c.active) return ['inactif', 'Désactivée']
  const now = new Date()
  if (c.startsAt && new Date(c.startsAt) > now) return ['inactif', 'Programmée']
  if (c.endsAt && new Date(c.endsAt) < now) return ['inactif', 'Terminée']
  return ['actif', 'En ligne']
}

export default function AdminCampaignsPage() {
  const [campagnes, setCampagnes] = React.useState(null)
  const [form, setForm] = React.useState(null)
  const [erreur, setErreur] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(() => {
    api('/admin/campaigns')
      .then((d) => setCampagnes(Array.isArray(d) ? d : []))
      .catch((e) => { setErreur(e.message); setCampagnes([]) })
  }, [])

  React.useEffect(() => { load() }, [load])

  function ouvrir(c) {
    setErreur(''); setMessage('')
    setForm(c
      ? {
          ...vide, ...c,
          subtitle: c.subtitle || '', badge: c.badge || '', linkUrl: c.linkUrl || '',
          imageUrl: c.imageUrl || '', gradient: c.gradient || '',
          startsAt: versChamp(c.startsAt), endsAt: versChamp(c.endsAt),
        }
      : { ...vide })
  }

  async function enregistrer(e) {
    e.preventDefault()
    setBusy(true); setErreur(''); setMessage('')
    try {
      const corps = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        badge: form.badge.trim(),
        linkUrl: form.linkUrl.trim(),
        imageUrl: form.imageUrl.trim() || null,
        gradient: form.gradient.trim() || DEGRADE_DEFAUT,
        active: form.active,
        displayOrder: Number(form.displayOrder) || 0,
        startsAt: versApi(form.startsAt),
        endsAt: versApi(form.endsAt),
      }
      const modif = Boolean(form.id)
      await api(modif ? `/admin/campaigns/${form.id}` : '/admin/campaigns', {
        method: modif ? 'PUT' : 'POST',
        body: JSON.stringify(modif ? { ...corps, id: form.id } : corps),
      })
      setMessage(modif ? `Campagne « ${corps.title} » modifiée.` : `Campagne « ${corps.title} » créée.`)
      setForm(null)
      load()
    } catch (err) {
      setErreur(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function supprimer(c) {
    if (!confirm(`Supprimer la campagne « ${c.title} » ?`)) return
    setBusy(true); setErreur(''); setMessage('')
    try {
      await api(`/admin/campaigns/${c.id}`, { method: 'DELETE' })
      setMessage(`Campagne « ${c.title} » supprimée.`)
      load()
    } catch (err) {
      setErreur(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (campagnes === null && !erreur) return <div className="cfg"><p className="cfg-chargement">Chargement des campagnes…</p></div>

  return (
    <div className="cfg">
      <div className="cfg-barre">
        <span className="cfg-gris">{(campagnes || []).length} campagne(s)</span>
        {!form && <button className="cfg-nouveau" onClick={() => ouvrir(null)}><Plus size={15} /> Nouvelle campagne</button>}
      </div>

      {erreur && <div className="cfg-erreur" role="alert"><AlertCircle size={16} />{erreur}</div>}
      {message && <div className="cfg-succes" role="status"><CheckCircle2 size={16} />{message}</div>}

      {form && (
        <form className="cfg-form" onSubmit={enregistrer}>
          <h2>{form.id ? `Modifier « ${form.title} »` : 'Nouvelle campagne'}</h2>
          <div className="cfg-champs">
            <label>
              Titre
              <input
                type="text" required value={form.title}
                onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
              />
            </label>
            <label>
              Sous-titre
              <input
                type="text" required maxLength={240} value={form.subtitle}
                onChange={(e) => setForm((v) => ({ ...v, subtitle: e.target.value }))}
              />
            </label>
            <label>
              Pastille
              <input
                type="text" required maxLength={50} value={form.badge}
                onChange={(e) => setForm((v) => ({ ...v, badge: e.target.value }))}
              />
              <small>Ex. « Offre de la semaine ».</small>
            </label>
            <label>
              Lien
              <input
                type="text" required maxLength={255} value={form.linkUrl}
                onChange={(e) => setForm((v) => ({ ...v, linkUrl: e.target.value }))}
              />
              <small>Ex. /category/electronique</small>
            </label>
            <label>
              Image
              <input
                type="text" value={form.imageUrl}
                onChange={(e) => setForm((v) => ({ ...v, imageUrl: e.target.value }))}
              />
            </label>
            <label>
              Dégradé
              <input
                type="text" value={form.gradient}
                onChange={(e) => setForm((v) => ({ ...v, gradient: e.target.value }))}
              />
              <small>Classes utilitaires, utilisé si aucune image.</small>
            </label>
            <label>
              Début
              <input
                type="datetime-local" value={form.startsAt}
                onChange={(e) => setForm((v) => ({ ...v, startsAt: e.target.value }))}
              />
              <small>Vide = immédiat.</small>
            </label>
            <label>
              Fin
              <input
                type="datetime-local" value={form.endsAt}
                onChange={(e) => setForm((v) => ({ ...v, endsAt: e.target.value }))}
              />
              <small>Vide = sans fin.</small>
            </label>
            <label>
              Ordre d'affichage
              <input
                type="number" value={form.displayOrder}
                onChange={(e) => setForm((v) => ({ ...v, displayOrder: e.target.value }))}
              />
            </label>
            <label className="cfg-case">
              <input
                type="checkbox" checked={form.active}
                onChange={(e) => setForm((v) => ({ ...v, active: e.target.checked }))}
              />
              Campagne active
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

      {!campagnes?.length ? (
        <p className="cfg-vide">Aucune campagne. Créez-en une pour animer la page d'accueil.</p>
      ) : (
        <div className="cfg-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Campagne</th>
                <th scope="col">Lien</th>
                <th scope="col">Diffusion</th>
                <th scope="col">Ordre</th>
                <th scope="col">État</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {campagnes.map((c) => {
                const [classe, libelle] = statut(c)
                return (
                  <tr key={c.id} className={classe === 'actif' ? '' : 'cfg-inactif'}>
                    <th scope="row">
                      <b>{c.title}</b>
                      <small>{c.badge || c.subtitle || '—'}</small>
                    </th>
                    <td className="cfg-mono">{c.linkUrl || <span className="cfg-gris">—</span>}</td>
                    <td>
                      {dateCourte(c.startsAt, null) || 'Immédiat'} → {dateCourte(c.endsAt, null) || 'sans fin'}
                    </td>
                    <td>{c.displayOrder}</td>
                    <td><span className={`cfg-etat ${classe}`}>{libelle}</span></td>
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
