import React from 'react'
import { AlertCircle, CheckCircle2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { api } from './lib/api'
import './admin-config.css'

const vide = { name: '', slug: '', parentId: '', displayOrder: 0, active: true }

// Le backend impose le motif [a-z0-9-] sur le slug et refuse un doublon (409).
// On propose donc un slug derive du nom, que l'on peut corriger a la main.
const versSlug = (v) =>
  v.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function AdminCategoriesPage() {
  const [categories, setCategories] = React.useState(null)
  const [form, setForm] = React.useState(null)
  const [erreur, setErreur] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [slugTouche, setSlugTouche] = React.useState(false)

  const load = React.useCallback(() => {
    api('/admin/categories')
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch((e) => { setErreur(e.message); setCategories([]) })
  }, [])

  React.useEffect(() => { load() }, [load])

  function ouvrir(c) {
    setErreur(''); setMessage(''); setSlugTouche(Boolean(c))
    setForm(c ? { ...vide, ...c, parentId: c.parent?.id ?? '' } : { ...vide })
  }

  async function enregistrer(e) {
    e.preventDefault()
    setBusy(true); setErreur(''); setMessage('')
    try {
      const corps = {
        name: form.name.trim(),
        slug: (form.slug || versSlug(form.name)).trim(),
        parentId: form.parentId === '' ? null : Number(form.parentId),
        displayOrder: Number(form.displayOrder) || 0,
        active: form.active,
      }
      const modif = Boolean(form.id)
      await api(modif ? `/admin/categories/${form.id}` : '/admin/categories', {
        method: modif ? 'PUT' : 'POST',
        body: JSON.stringify(corps),
      })
      setMessage(modif ? `Catégorie « ${corps.name} » modifiée.` : `Catégorie « ${corps.name} » créée.`)
      setForm(null)
      load()
    } catch (err) {
      setErreur(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function supprimer(c) {
    if (!confirm(`Supprimer la catégorie « ${c.name} » ?`)) return
    setBusy(true); setErreur(''); setMessage('')
    try {
      await api(`/admin/categories/${c.id}`, { method: 'DELETE' })
      setMessage(`Catégorie « ${c.name} » supprimée.`)
      load()
    } catch (err) {
      setErreur(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (categories === null && !erreur) return <div className="cfg"><p className="cfg-chargement">Chargement des catégories…</p></div>

  const nomParent = (c) => {
    const id = c.parent?.id
    if (!id) return null
    return (categories || []).find((x) => x.id === id)?.name || `#${id}`
  }

  return (
    <div className="cfg">
      <div className="cfg-barre">
        <span className="cfg-gris">{(categories || []).length} catégorie(s)</span>
        {!form && <button className="cfg-nouveau" onClick={() => ouvrir(null)}><Plus size={15} /> Nouvelle catégorie</button>}
      </div>

      {erreur && <div className="cfg-erreur" role="alert"><AlertCircle size={16} />{erreur}</div>}
      {message && <div className="cfg-succes" role="status"><CheckCircle2 size={16} />{message}</div>}

      {form && (
        <form className="cfg-form" onSubmit={enregistrer}>
          <h2>{form.id ? `Modifier « ${form.name} »` : 'Nouvelle catégorie'}</h2>
          <div className="cfg-champs">
            <label>
              Nom
              <input
                type="text" required maxLength={120} value={form.name}
                onChange={(e) => {
                  const name = e.target.value
                  setForm((v) => ({ ...v, name, slug: slugTouche ? v.slug : versSlug(name) }))
                }}
              />
            </label>
            <label>
              Identifiant d'URL
              {/* Le tiret est échappé : les navigateurs compilent `pattern`
                  avec le drapeau `v`, où un `-` nu en fin de classe est une
                  erreur de syntaxe qui désactive la validation. */}
              <input
                type="text" required pattern="[a-z0-9\-]+" value={form.slug}
                onChange={(e) => { setSlugTouche(true); setForm((v) => ({ ...v, slug: e.target.value })) }}
              />
              <small>Minuscules, chiffres et tirets uniquement.</small>
            </label>
            <label>
              Catégorie parente
              <select
                value={form.parentId}
                onChange={(e) => setForm((v) => ({ ...v, parentId: e.target.value }))}
              >
                <option value="">Aucune (catégorie principale)</option>
                {(categories || [])
                  .filter((c) => c.id !== form.id)
                  .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
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
              Catégorie active
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

      {!categories?.length ? (
        <p className="cfg-vide">Aucune catégorie. Créez la première pour organiser le catalogue.</p>
      ) : (
        <div className="cfg-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Catégorie</th>
                <th scope="col">Parente</th>
                <th scope="col">Ordre</th>
                <th scope="col">État</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className={c.active ? '' : 'cfg-inactif'}>
                  <th scope="row">
                    <b>{c.name}</b>
                    <small className="cfg-mono">{c.slug}</small>
                  </th>
                  <td>{nomParent(c) || <span className="cfg-gris">—</span>}</td>
                  <td>{c.displayOrder}</td>
                  <td>
                    <span className={`cfg-etat ${c.active ? 'actif' : 'inactif'}`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="cfg-actions">
                    <button onClick={() => ouvrir(c)} disabled={busy}><Pencil size={14} /> Modifier</button>
                    <button className="cfg-suppr" onClick={() => supprimer(c)} disabled={busy}>
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
