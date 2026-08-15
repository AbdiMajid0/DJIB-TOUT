import React from 'react'
import { AlertCircle, CheckCircle2, Pencil, X } from 'lucide-react'
import { api } from './lib/api'
import './admin-config.css'

// L'API des sections d'accueil n'expose que GET et PUT : pas de creation ni de
// suppression. L'ecran se limite donc a l'edition des sections existantes.
const vide = { key: '', title: '', subtitle: '', category: '', maxItems: 10, displayOrder: 0, active: true }

export default function AdminHomeSectionsPage() {
  const [sections, setSections] = React.useState(null)
  const [edition, setEdition] = React.useState(null)
  const [erreur, setErreur] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(() => {
    api('/admin/home-sections')
      .then((d) => setSections(Array.isArray(d) ? d : []))
      .catch((e) => { setErreur(e.message); setSections([]) })
  }, [])

  React.useEffect(() => { load() }, [load])

  function ouvrir(s) {
    setErreur(''); setMessage('')
    setEdition({
      ...vide,
      ...s,
      subtitle: s.subtitle || '',
      category: s.category || '',
    })
  }

  async function enregistrer(e) {
    e.preventDefault()
    setBusy(true); setErreur(''); setMessage('')
    try {
      // maxItems est borne a [1, 30] cote serveur : on envoie une valeur deja
      // valide pour que l'ecran refletee ce qui sera reellement enregistre.
      const corps = {
        ...edition,
        maxItems: Math.max(1, Math.min(Number(edition.maxItems) || 1, 30)),
        displayOrder: Number(edition.displayOrder) || 0,
        subtitle: edition.subtitle.trim() || null,
        category: edition.category.trim() || null,
      }
      await api(`/admin/home-sections/${edition.id}`, { method: 'PUT', body: JSON.stringify(corps) })
      setMessage(`Section « ${corps.title} » enregistrée.`)
      setEdition(null)
      load()
    } catch (err) {
      setErreur(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (sections === null && !erreur) return <div className="cfg"><p className="cfg-chargement">Chargement des sections…</p></div>

  return (
    <div className="cfg">
      {erreur && <div className="cfg-erreur" role="alert"><AlertCircle size={16} />{erreur}</div>}
      {message && <div className="cfg-succes" role="status"><CheckCircle2 size={16} />{message}</div>}

      {edition && (
        <form className="cfg-form" onSubmit={enregistrer}>
          <h2>Modifier « {edition.title || edition.key} »</h2>
          <div className="cfg-champs">
            <label>
              Titre
              <input
                type="text" required maxLength={100} value={edition.title}
                onChange={(e) => setEdition((v) => ({ ...v, title: e.target.value }))}
              />
            </label>
            <label>
              Sous-titre
              <input
                type="text" maxLength={180} value={edition.subtitle}
                onChange={(e) => setEdition((v) => ({ ...v, subtitle: e.target.value }))}
              />
            </label>
            <label>
              Catégorie
              <input
                type="text" maxLength={100} value={edition.category}
                onChange={(e) => setEdition((v) => ({ ...v, category: e.target.value }))}
              />
              <small>Laisser vide pour ne pas filtrer.</small>
            </label>
            <label>
              Nombre d'articles
              <input
                type="number" min={1} max={30} value={edition.maxItems}
                onChange={(e) => setEdition((v) => ({ ...v, maxItems: e.target.value }))}
              />
              <small>Entre 1 et 30.</small>
            </label>
            <label>
              Ordre d'affichage
              <input
                type="number" value={edition.displayOrder}
                onChange={(e) => setEdition((v) => ({ ...v, displayOrder: e.target.value }))}
              />
            </label>
            <label className="cfg-case">
              <input
                type="checkbox" checked={edition.active}
                onChange={(e) => setEdition((v) => ({ ...v, active: e.target.checked }))}
              />
              Section visible sur l'accueil
            </label>
          </div>
          <footer>
            <button type="submit" className="cfg-valider" disabled={busy}>
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setEdition(null)} disabled={busy}>
              <X size={14} /> Annuler
            </button>
          </footer>
        </form>
      )}

      {!sections?.length ? (
        <p className="cfg-vide">Aucune section d'accueil configurée.</p>
      ) : (
        <div className="cfg-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Section</th>
                <th scope="col">Catégorie</th>
                <th scope="col">Articles</th>
                <th scope="col">Ordre</th>
                <th scope="col">État</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => (
                <tr key={s.id} className={s.active ? '' : 'cfg-inactif'}>
                  <th scope="row">
                    <b>{s.title}</b>
                    <small>{s.subtitle || s.key}</small>
                  </th>
                  <td>{s.category || <span className="cfg-gris">Toutes</span>}</td>
                  <td>{s.maxItems}</td>
                  <td>{s.displayOrder}</td>
                  <td>
                    <span className={`cfg-etat ${s.active ? 'actif' : 'inactif'}`}>
                      {s.active ? 'Visible' : 'Masquée'}
                    </span>
                  </td>
                  <td className="cfg-actions">
                    <button onClick={() => ouvrir(s)}><Pencil size={14} /> Modifier</button>
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
