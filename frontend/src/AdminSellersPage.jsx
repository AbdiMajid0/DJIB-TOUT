import React from 'react'
import { AlertCircle, Ban, CheckCircle2, FileText, Hourglass, RotateCcw, Store, X } from 'lucide-react'
import { api, apiBlob } from './lib/api'
import './admin-sellers.css'

const FILTRES = [
  ['pending', 'En attente'],
  ['validated', 'Validées'],
  ['suspended', 'Suspendues'],
  ['all', 'Toutes'],
]

const etatDe = (s) => (s.seller?.suspended ? 'suspended' : s.validated ? 'validated' : 'pending')

const ETATS = {
  pending: { label: 'En attente', classe: 'attente' },
  validated: { label: 'Validée', classe: 'validee' },
  suspended: { label: 'Suspendue', classe: 'suspendue' },
}

export default function AdminSellersPage() {
  const [stores, setStores] = React.useState(null)
  const [filtre, setFiltre] = React.useState('pending')
  const [erreur, setErreur] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [busy, setBusy] = React.useState(null)
  const [refus, setRefus] = React.useState(null)
  const [motif, setMotif] = React.useState('')

  const load = React.useCallback(() => {
    setErreur('')
    api('/admin/seller-stores')
      .then((data) => setStores(Array.isArray(data) ? data : []))
      .catch((e) => { setErreur(e.message); setStores([]) })
  }, [])

  React.useEffect(() => { load() }, [load])

  /**
   * L'API applique getOrDefault("validated", false) : omettre un champ le
   * remet à false. On envoie donc toujours les deux valeurs, jamais une seule.
   */
  async function appliquer(store, changements, texte) {
    setBusy(store.id)
    setErreur('')
    setMessage('')
    const corps = {
      validated: store.validated ?? false,
      suspended: store.seller?.suspended ?? false,
      ...changements,
    }
    try {
      await api(`/admin/seller-stores/${store.id}/validation`, {
        method: 'PATCH',
        body: JSON.stringify(corps),
      })
      setMessage(texte)
      load()
    } catch (e) {
      setErreur(e.message)
    } finally {
      setBusy(null)
    }
  }

  /**
   * Un <a href> ne transmet pas l'en-tête Authorization, et le jeton vit dans
   * localStorage : un lien direct renverrait 401. On télécharge donc le
   * document avec l'en-tête, puis on l'ouvre depuis un blob.
   */
  async function ouvrirDocument(doc) {
    setErreur('')
    try {
      const url = URL.createObjectURL(await apiBlob(`/seller/documents/${doc.id}`))
      window.open(url, '_blank', 'noopener')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (e) {
      setErreur(e.status ? `Document indisponible (${e.status})` : e.message)
    }
  }

  function confirmerRefus(e) {
    e.preventDefault()
    const store = refus
    setRefus(null)
    const suffixe = motif.trim() ? ` Motif : ${motif.trim()}` : ''
    setMotif('')
    appliquer(store, { validated: false }, `Dossier « ${store.name} » refusé.${suffixe}`)
  }

  if (stores === null && !erreur) return <div className="admin-sellers"><p className="as-chargement">Chargement des dossiers…</p></div>

  const liste = (stores || []).filter((s) => filtre === 'all' || etatDe(s) === filtre)
  const compte = (cle) => (stores || []).filter((s) => cle === 'all' || etatDe(s) === cle).length

  return (
    <div className="admin-sellers">
      <div className="as-filtres" role="tablist">
        {FILTRES.map(([cle, label]) => (
          <button
            key={cle}
            role="tab"
            aria-selected={filtre === cle}
            className={filtre === cle ? 'actif' : ''}
            onClick={() => setFiltre(cle)}
          >
            {label} <span>{compte(cle)}</span>
          </button>
        ))}
      </div>

      {erreur && <div className="as-erreur" role="alert"><AlertCircle size={16} />{erreur}</div>}
      {message && <div className="as-succes" role="status"><CheckCircle2 size={16} />{message}</div>}

      {!liste.length && !erreur && (
        <div className="as-vide">
          <Store size={30} />
          <p>Aucune boutique dans cette catégorie.</p>
        </div>
      )}

      <div className="as-liste">
        {liste.map((store) => {
          const etat = ETATS[etatDe(store)]
          const documents = store.documents || []
          const enCours = busy === store.id
          return (
            <article className="as-carte" key={store.id}>
              <header>
                <span className="as-avatar"><Store size={20} /></span>
                <div className="as-titre">
                  <b>{store.name || 'Boutique sans nom'}</b>
                  <small>
                    {store.seller?.name || 'Vendeur inconnu'}
                    {store.seller?.email ? ` · ${store.seller.email}` : ''}
                  </small>
                </div>
                <span className={`as-etat ${etat.classe}`}>{etat.label}</span>
              </header>

              <dl className="as-infos">
                {store.businessAddress && (
                  <div><dt>Adresse</dt><dd>{store.businessAddress}</dd></div>
                )}
                {store.openingHours && (
                  <div><dt>Horaires</dt><dd>{store.openingHours}</dd></div>
                )}
                {store.description && (
                  <div><dt>Description</dt><dd>{store.description}</dd></div>
                )}
              </dl>

              <div className="as-documents">
                <b><FileText size={14} /> Justificatifs</b>
                {documents.length ? (
                  <ul>
                    {documents.map((d) => (
                      <li key={d.id}>
                        <button type="button" onClick={() => ouvrirDocument(d)}>
                          {d.originalName || d.type || `Document #${d.id}`}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <small>Aucun document déposé.</small>
                )}
              </div>

              <footer className="as-actions">
                {!store.validated && (
                  <button
                    className="as-valider"
                    disabled={enCours}
                    onClick={() => appliquer(store, { validated: true, suspended: false }, `Boutique « ${store.name} » validée.`)}
                  >
                    <CheckCircle2 size={16} /> Valider
                  </button>
                )}
                {!store.validated && (
                  <button className="as-refuser" disabled={enCours} onClick={() => { setRefus(store); setMotif('') }}>
                    <X size={16} /> Refuser
                  </button>
                )}
                {store.validated && !store.seller?.suspended && (
                  <button
                    className="as-suspendre"
                    disabled={enCours}
                    onClick={() => appliquer(store, { suspended: true }, `Boutique « ${store.name} » suspendue.`)}
                  >
                    <Ban size={16} /> Suspendre
                  </button>
                )}
                {store.seller?.suspended && (
                  <button
                    className="as-reactiver"
                    disabled={enCours}
                    onClick={() => appliquer(store, { suspended: false }, `Boutique « ${store.name} » réactivée.`)}
                  >
                    <RotateCcw size={16} /> Réactiver
                  </button>
                )}
                {enCours && <span className="as-busy"><Hourglass size={14} /> …</span>}
              </footer>
            </article>
          )
        })}
      </div>

      {refus && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setRefus(null)}>
          <form className="confirm-dialog as-refus" onSubmit={confirmerRefus}>
            <button type="button" aria-label="Fermer" className="modal-close" onClick={() => setRefus(null)}>×</button>
            <h2>Refuser « {refus.name} »</h2>
            <p>Le vendeur restera inscrit mais ne pourra ni publier de produit ni recevoir de commande.</p>
            <label htmlFor="as-motif">Motif du refus</label>
            <textarea
              id="as-motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Document illisible, informations incohérentes…"
              rows={3}
            />
            <div className="as-refus-actions">
              <button type="button" onClick={() => setRefus(null)}>Annuler</button>
              <button type="submit" className="as-refuser">Confirmer le refus</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
