import React from 'react'
import { AlertCircle, CheckCircle2, ClipboardList, Undo2 } from 'lucide-react'
import { api, dateLisible, money } from './lib/api'
import './admin-operations.css'

const STATUTS_COMMANDE = {
  PENDING: ['En attente', 'attente'],
  PROCESSING: ['En préparation', 'preparation'],
  SHIPPED: ['Expédiée', 'expediee'],
  DELIVERED: ['Livrée', 'livree'],
  CANCELLED: ['Annulée', 'annulee'],
}

const STATUTS_RETOUR = {
  REQUESTED: ['Demandé', 'attente'],
  APPROVED: ['Accepté', 'preparation'],
  REJECTED: ['Refusé', 'annulee'],
  RECEIVED: ['Reçu', 'expediee'],
  REFUNDED: ['Remboursé', 'livree'],
}

export default function AdminOperationsPage() {
  const [onglet, setOnglet] = React.useState('commandes')
  const [orders, setOrders] = React.useState(null)
  const [returns, setReturns] = React.useState(null)
  const [filtre, setFiltre] = React.useState('ALL')
  const [erreur, setErreur] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [busy, setBusy] = React.useState(null)

  const load = React.useCallback(() => {
    api('/admin/orders').then((d) => setOrders(Array.isArray(d) ? d : [])).catch((e) => { setErreur(e.message); setOrders([]) })
    api('/admin/returns').then((d) => setReturns(Array.isArray(d) ? d : [])).catch(() => setReturns([]))
  }, [])

  React.useEffect(() => { load() }, [load])

  async function changer(type, id, status, libelle) {
    setBusy(`${type}-${id}`); setErreur(''); setMessage('')
    try {
      await api(type === 'commandes' ? `/admin/orders/${id}/status` : `/admin/returns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setMessage(`${type === 'commandes' ? 'Commande' : 'Retour'} #${id} → ${libelle}.`)
      load()
    } catch (e) {
      setErreur(e.message)
    } finally {
      setBusy(null)
    }
  }

  const enCours = onglet === 'commandes' ? orders : returns
  const statuts = onglet === 'commandes' ? STATUTS_COMMANDE : STATUTS_RETOUR

  if (enCours === null && !erreur) return <div className="admin-ope"><p className="op-chargement">Chargement…</p></div>

  const items = (enCours || []).filter((x) => filtre === 'ALL' || x.status === filtre)
  const compte = (cle) => (enCours || []).filter((x) => cle === 'ALL' || x.status === cle).length

  // Les demandes non traitees bloquent quelqu'un : on les met en avant.
  const aTraiterCommandes = (orders || []).filter((o) => ['PENDING', 'PROCESSING'].includes(o.status)).length
  const aTraiterRetours = (returns || []).filter((r) => r.status === 'REQUESTED').length

  return (
    <div className="admin-ope">
      <div className="op-onglets" role="tablist">
        <button
          role="tab"
          aria-selected={onglet === 'commandes'}
          className={onglet === 'commandes' ? 'actif' : ''}
          onClick={() => { setOnglet('commandes'); setFiltre('ALL') }}
        >
          <ClipboardList size={16} /> Commandes
          {aTraiterCommandes > 0 && <b>{aTraiterCommandes}</b>}
        </button>
        <button
          role="tab"
          aria-selected={onglet === 'retours'}
          className={onglet === 'retours' ? 'actif' : ''}
          onClick={() => { setOnglet('retours'); setFiltre('ALL') }}
        >
          <Undo2 size={16} /> Retours
          {aTraiterRetours > 0 && <b>{aTraiterRetours}</b>}
        </button>
      </div>

      <div className="op-filtres">
        <button className={filtre === 'ALL' ? 'actif' : ''} onClick={() => setFiltre('ALL')}>
          Tous <span>{compte('ALL')}</span>
        </button>
        {Object.entries(statuts).map(([cle, [label]]) => (
          <button key={cle} className={filtre === cle ? 'actif' : ''} onClick={() => setFiltre(cle)}>
            {label} <span>{compte(cle)}</span>
          </button>
        ))}
      </div>

      {erreur && <div className="op-erreur" role="alert"><AlertCircle size={16} />{erreur}</div>}
      {message && <div className="op-succes" role="status"><CheckCircle2 size={16} />{message}</div>}

      {!items.length ? (
        <p className="op-vide">
          {onglet === 'commandes' ? 'Aucune commande dans cette catégorie.' : 'Aucun retour dans cette catégorie.'}
        </p>
      ) : (
        <div className="op-scroll">
          <table>
            <thead>
              {onglet === 'commandes' ? (
                <tr>
                  <th scope="col">Référence</th>
                  <th scope="col">Date</th>
                  <th scope="col">Livraison</th>
                  <th scope="col">Paiement</th>
                  <th scope="col">Montant</th>
                  <th scope="col">Statut</th>
                </tr>
              ) : (
                <tr>
                  <th scope="col">Retour</th>
                  <th scope="col">Date</th>
                  <th scope="col">Motif</th>
                  <th scope="col">Remboursement</th>
                  <th scope="col">Statut</th>
                </tr>
              )}
            </thead>
            <tbody>
              {items.map((x) => {
                const [label, classe] = statuts[x.status] || [x.status, 'attente']
                const cle = `${onglet}-${x.id}`
                return (
                  <tr key={x.id}>
                    <th scope="row">
                      <b>#{onglet === 'commandes' ? 'DT' : 'RT'}-{x.id}</b>
                      {onglet === 'retours' && (
                        <small>{x.buyer?.name || x.buyer?.email || 'Client inconnu'}</small>
                      )}
                    </th>
                    <td className="op-date">{dateLisible(x.createdAt)}</td>
                    {onglet === 'commandes' ? (
                      <>
                        <td className="op-adresse">{x.deliveryAddress || '—'}</td>
                        <td>{x.paymentMethod || '—'}</td>
                        <td className="op-montant">{money(x.totalAmount)}</td>
                      </>
                    ) : (
                      <>
                        <td className="op-adresse">{x.reason || x.customerComment || '—'}</td>
                        <td className="op-montant">{money(x.refundAmount)}</td>
                      </>
                    )}
                    <td>
                      <span className={`op-statut ${classe}`}>{label}</span>
                      <label className="sr-only" htmlFor={`st-${cle}`}>Changer le statut</label>
                      <select
                        id={`st-${cle}`}
                        className="op-select"
                        value={x.status}
                        disabled={busy === cle}
                        onChange={(e) => changer(onglet, x.id, e.target.value, statuts[e.target.value]?.[0] || e.target.value)}
                      >
                        {Object.entries(statuts).map(([k, [l]]) => (
                          <option key={k} value={k}>{l}</option>
                        ))}
                      </select>
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
