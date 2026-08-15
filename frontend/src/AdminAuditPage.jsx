import React from 'react'
import { AlertCircle, RefreshCw, Search } from 'lucide-react'
import { api } from './lib/api'
import './admin-config.css'

// L'API renvoie l'acteur sous forme d'entite User complete. On n'affiche que le
// nom et l'e-mail : le reste (telephone, date de naissance, preferences) n'a
// rien a faire dans un journal.
const acteur = (l) => l.actor?.name || l.actor?.email || 'Compte supprimé'

const dateHeure = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('fr-FR')
}

export default function AdminAuditPage() {
  const [logs, setLogs] = React.useState(null)
  const [recherche, setRecherche] = React.useState('')
  const [erreur, setErreur] = React.useState('')

  const load = React.useCallback(() => {
    setErreur('')
    api('/admin/audit-logs')
      .then((d) => setLogs(Array.isArray(d) ? d : []))
      .catch((e) => { setErreur(e.message); setLogs([]) })
  }, [])

  React.useEffect(() => { load() }, [load])

  if (logs === null && !erreur) return <div className="cfg"><p className="cfg-chargement">Chargement du journal…</p></div>

  const terme = recherche.trim().toLowerCase()
  // Le plus recent d'abord : l'API renvoie les lignes dans l'ordre d'insertion.
  const liste = (logs || [])
    .filter((l) => !terme || `${l.action || ''} ${l.target || ''} ${acteur(l)} ${l.actor?.email || ''}`.toLowerCase().includes(terme))
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))

  return (
    <div className="cfg">
      <div className="cfg-barre">
        <div className="cfg-recherche">
          <Search size={16} />
          <label className="sr-only" htmlFor="au-q">Rechercher dans le journal</label>
          <input
            id="au-q"
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Action, compte ou cible…"
          />
        </div>
        <button className="cfg-nouveau" onClick={load}><RefreshCw size={15} /> Actualiser</button>
      </div>

      {erreur && <div className="cfg-erreur" role="alert"><AlertCircle size={16} />{erreur}</div>}

      {!liste.length ? (
        <p className="cfg-vide">
          {terme ? 'Aucune entrée ne correspond à cette recherche.' : 'Le journal est vide.'}
        </p>
      ) : (
        <div className="cfg-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Action</th>
                <th scope="col">Compte</th>
                <th scope="col">Cible</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((l) => (
                <tr key={l.id}>
                  <th scope="row"><span className="cfg-mono">{l.action || '—'}</span></th>
                  <td>
                    {acteur(l)}
                    {l.actor?.email && <small className="cfg-gris"> · {l.actor.email}</small>}
                  </td>
                  <td className="cfg-mono">{l.target || <span className="cfg-gris">—</span>}</td>
                  <td>{dateHeure(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
