import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, ClipboardList, CreditCard, Store, Users } from 'lucide-react'
import { api } from './lib/api'
import './admin-overview.css'

const money = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(Number(n || 0))) + ' FDJ'
const nombre = (n) => new Intl.NumberFormat('fr-FR').format(Number(n || 0))

const STATUTS = {
  PENDING: ['En attente', 'attente'],
  PROCESSING: ['En préparation', 'preparation'],
  SHIPPED: ['Expédiée', 'expediee'],
  DELIVERED: ['Livrée', 'livree'],
  CANCELLED: ['Annulée', 'annulee'],
}

const ROLES = { BUYER: 'acheteurs', SELLER: 'vendeurs', ADMIN: 'administrateurs' }

export default function AdminOverviewPage() {
  const [data, setData] = React.useState(null)
  const [erreur, setErreur] = React.useState('')

  React.useEffect(() => {
    Promise.all([
      api('/admin/users').catch(() => []),
      api('/admin/orders').catch(() => []),
      api('/admin/seller-stores').catch(() => []),
    ])
      .then(([users, orders, stores]) => setData({
        users: Array.isArray(users) ? users : [],
        orders: Array.isArray(orders) ? orders : [],
        stores: Array.isArray(stores) ? stores : [],
      }))
      .catch((e) => setErreur(e.message))
  }, [])

  if (erreur) return <div className="admin-overview"><div className="ao-erreur"><AlertCircle size={16} />{erreur}</div></div>
  if (!data) return <div className="admin-overview"><p className="ao-chargement">Chargement de l'activité…</p></div>

  const { users, orders, stores } = data

  const parRole = users.reduce((acc, u) => ({ ...acc, [u.role]: (acc[u.role] || 0) + 1 }), {})
  const parStatut = orders.reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] || 0) + 1 }), {})

  // Le volume ne compte que les commandes non annulées : additionner les
  // annulations gonflerait le chiffre d'affaires apparent.
  const volume = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((total, o) => total + Number(o.totalAmount || 0), 0)

  const enAttente = stores.filter((s) => !s.validated && !s.seller?.suspended).length
  const validees = stores.filter((s) => s.validated && !s.seller?.suspended).length
  const suspendues = stores.filter((s) => s.seller?.suspended).length

  const recentes = [...orders]
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 6)

  const date = (v) => {
    if (!v) return '—'
    const d = new Date(v)
    return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="admin-overview">
      <div className="ao-chiffres">
        <article>
          <span className="ao-ic"><Users size={19} /></span>
          <b>{nombre(users.length)}</b>
          <small>Utilisateurs</small>
          <p>{Object.entries(parRole).map(([r, n]) => `${nombre(n)} ${ROLES[r] || r.toLowerCase()}`).join(' · ') || 'Aucun compte'}</p>
        </article>
        <article>
          <span className="ao-ic"><Store size={19} /></span>
          <b>{nombre(validees)}</b>
          <small>Boutiques actives</small>
          <p>{enAttente ? `${nombre(enAttente)} en attente` : 'Aucun dossier en attente'}{suspendues ? ` · ${nombre(suspendues)} suspendue${suspendues > 1 ? 's' : ''}` : ''}</p>
        </article>
        <article>
          <span className="ao-ic"><ClipboardList size={19} /></span>
          <b>{nombre(orders.length)}</b>
          <small>Commandes</small>
          <p>{Object.entries(parStatut).map(([s, n]) => `${nombre(n)} ${(STATUTS[s]?.[0] || s).toLowerCase()}`).join(' · ') || 'Aucune commande'}</p>
        </article>
        <article>
          <span className="ao-ic"><CreditCard size={19} /></span>
          <b>{money(volume)}</b>
          <small>Volume encaissé</small>
          <p>Hors commandes annulées</p>
        </article>
      </div>

      {enAttente > 0 && (
        <Link to="/admin/sellers" className="ao-action">
          <span className="ao-ic attention"><Store size={19} /></span>
          <span>
            <b>{nombre(enAttente)} dossier{enAttente > 1 ? 's' : ''} vendeur en attente de validation</b>
            <small>Tant qu'un dossier n'est pas traité, la boutique ne peut ni publier ni vendre.</small>
          </span>
          <ArrowRight size={18} />
        </Link>
      )}

      <section className="ao-recentes">
        <header>
          <h2>Commandes récentes</h2>
          <small>{orders.length ? `${nombre(orders.length)} au total` : ''}</small>
        </header>
        {recentes.length ? (
          <div className="ao-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Référence</th>
                  <th scope="col">Date</th>
                  <th scope="col">Paiement</th>
                  <th scope="col">Montant</th>
                  <th scope="col">Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentes.map((o) => {
                  const [label, classe] = STATUTS[o.status] || [o.status, 'attente']
                  return (
                    <tr key={o.id}>
                      <th scope="row">#DT-{o.id}</th>
                      <td>{date(o.createdAt)}</td>
                      <td>{o.paymentMethod || '—'}</td>
                      <td className="ao-montant">{money(o.totalAmount)}</td>
                      <td><span className={`ao-statut ${classe}`}>{label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="ao-vide">Aucune commande enregistrée pour l'instant.</p>
        )}
      </section>
    </div>
  )
}
