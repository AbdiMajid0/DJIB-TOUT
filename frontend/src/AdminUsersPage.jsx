import React from 'react'
import { AlertCircle, Ban, CheckCircle2, RotateCcw, Search, ShieldCheck } from 'lucide-react'
import { api, dateLisible } from './lib/api'
import './admin-users.css'

const ROLES = {
  BUYER: ['Acheteur', 'acheteur'],
  SELLER: ['Vendeur', 'vendeur'],
  ADMIN: ['Administrateur', 'admin'],
}

const FILTRES = [['ALL', 'Tous'], ['BUYER', 'Acheteurs'], ['SELLER', 'Vendeurs'], ['ADMIN', 'Administrateurs']]

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState(null)
  const [role, setRole] = React.useState('ALL')
  const [recherche, setRecherche] = React.useState('')
  const [erreur, setErreur] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [busy, setBusy] = React.useState(null)

  const load = React.useCallback(() => {
    api('/admin/users')
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((e) => { setErreur(e.message); setUsers([]) })
  }, [])

  React.useEffect(() => { load() }, [load])

  async function basculerSuspension(u) {
    setBusy(u.id); setErreur(''); setMessage('')
    try {
      await api(`/admin/users/${u.id}/suspension`, {
        method: 'PATCH',
        body: JSON.stringify({ suspended: !u.suspended }),
      })
      setMessage(u.suspended ? `${u.name || u.email} réactivé.` : `${u.name || u.email} suspendu.`)
      load()
    } catch (e) {
      setErreur(e.message)
    } finally {
      setBusy(null)
    }
  }

  if (users === null && !erreur) return <div className="admin-users"><p className="au-chargement">Chargement des comptes…</p></div>

  const terme = recherche.trim().toLowerCase()
  const liste = (users || [])
    .filter((u) => role === 'ALL' || u.role === role)
    .filter((u) => !terme || `${u.name || ''} ${u.email || ''} ${u.phone || ''}`.toLowerCase().includes(terme))

  const compte = (cle) => (users || []).filter((u) => cle === 'ALL' || u.role === cle).length

  return (
    <div className="admin-users">
      <div className="au-barre">
        <div className="au-recherche">
          <Search size={16} />
          <label className="sr-only" htmlFor="au-q">Rechercher un compte</label>
          <input
            id="au-q"
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Nom, e-mail ou téléphone…"
          />
        </div>
        <div className="au-filtres" role="tablist">
          {FILTRES.map(([cle, label]) => (
            <button
              key={cle}
              role="tab"
              aria-selected={role === cle}
              className={role === cle ? 'actif' : ''}
              onClick={() => setRole(cle)}
            >
              {label} <span>{compte(cle)}</span>
            </button>
          ))}
        </div>
      </div>

      {erreur && <div className="au-erreur" role="alert"><AlertCircle size={16} />{erreur}</div>}
      {message && <div className="au-succes" role="status"><CheckCircle2 size={16} />{message}</div>}

      {!liste.length ? (
        <p className="au-vide">{terme ? 'Aucun compte ne correspond à cette recherche.' : 'Aucun compte dans cette catégorie.'}</p>
      ) : (
        <div className="au-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Compte</th>
                <th scope="col">Rôle</th>
                <th scope="col">État</th>
                <th scope="col">Inscription</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {liste.map((u) => {
                const [labelRole, classeRole] = ROLES[u.role] || [u.role, 'acheteur']
                const estAdmin = u.role === 'ADMIN'
                return (
                  <tr key={u.id} className={u.suspended ? 'suspendu' : ''}>
                    <th scope="row">
                      <b>{u.name || 'Sans nom'}</b>
                      <small>{u.email}</small>
                      {u.phone && <small>{u.phone}</small>}
                    </th>
                    <td><span className={`au-role ${classeRole}`}>{labelRole}</span></td>
                    <td>
                      <span className="au-etats">
                        {u.suspended
                          ? <span className="au-etat suspendu">Suspendu</span>
                          : <span className="au-etat actif">Actif</span>}
                        {u.emailVerified
                          ? <span className="au-etat verifie">E-mail vérifié</span>
                          : <span className="au-etat attente">E-mail non vérifié</span>}
                      </span>
                    </td>
                    <td className="au-date">{dateLisible(u.createdAt)}</td>
                    <td className="au-actions">
                      {estAdmin ? (
                        // Le backend renvoie 409 sur un administrateur : autant
                        // expliquer la regle plutot que d'afficher une erreur.
                        <span className="au-protege"><ShieldCheck size={14} /> Compte protégé</span>
                      ) : (
                        <button
                          className={u.suspended ? 'au-reactiver' : 'au-suspendre'}
                          disabled={busy === u.id}
                          onClick={() => basculerSuspension(u)}
                        >
                          {u.suspended ? <><RotateCcw size={15} /> Réactiver</> : <><Ban size={15} /> Suspendre</>}
                        </button>
                      )}
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
