import React from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Search } from 'lucide-react'
import { api, money } from './lib/api'
import './admin-products.css'

// visible vaut null sur les produits anterieurs au champ : le backend traite
// null comme visible (p.visible IS NULL OR p.visible = true), on fait pareil.
const estVisible = (p) => p.visible !== false

const FILTRES = [
  ['ALL', 'Tous'],
  ['VISIBLE', 'Visibles'],
  ['HIDDEN', 'Masqués'],
  ['OUT', 'En rupture'],
]

export default function AdminProductsPage() {
  const [products, setProducts] = React.useState(null)
  const [filtre, setFiltre] = React.useState('ALL')
  const [recherche, setRecherche] = React.useState('')
  const [erreur, setErreur] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [busy, setBusy] = React.useState(null)

  const load = React.useCallback(() => {
    api('/admin/products')
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch((e) => { setErreur(e.message); setProducts([]) })
  }, [])

  React.useEffect(() => { load() }, [load])

  /**
   * L'API applique getOrDefault("visible", true). On envoie donc toujours la
   * valeur voulue : un champ omis rendrait le produit visible sans le vouloir.
   */
  async function basculer(p) {
    setBusy(p.id); setErreur(''); setMessage('')
    const visible = !estVisible(p)
    try {
      await api(`/admin/products/${p.id}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({ visible }),
      })
      setMessage(visible ? `« ${p.name} » est de nouveau en vente.` : `« ${p.name} » retiré de la vente.`)
      load()
    } catch (e) {
      setErreur(e.message)
    } finally {
      setBusy(null)
    }
  }

  if (products === null && !erreur) return <div className="admin-prod"><p className="pr-chargement">Chargement du catalogue…</p></div>

  const correspond = (p, cle) => {
    if (cle === 'ALL') return true
    if (cle === 'VISIBLE') return estVisible(p)
    if (cle === 'HIDDEN') return !estVisible(p)
    return Number(p.stockQuantity || 0) <= 0
  }

  const terme = recherche.trim().toLowerCase()
  const liste = (products || [])
    .filter((p) => correspond(p, filtre))
    .filter((p) => !terme || `${p.name || ''} ${p.brand || ''} ${p.category || ''} ${p.seller?.name || ''}`.toLowerCase().includes(terme))

  const compte = (cle) => (products || []).filter((p) => correspond(p, cle)).length

  return (
    <div className="admin-prod">
      <div className="pr-barre">
        <div className="pr-recherche">
          <Search size={16} />
          <label className="sr-only" htmlFor="pr-q">Rechercher un produit</label>
          <input
            id="pr-q"
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Nom, marque, catégorie ou boutique…"
          />
        </div>
        <div className="pr-filtres">
          {FILTRES.map(([cle, label]) => (
            <button key={cle} className={filtre === cle ? 'actif' : ''} onClick={() => setFiltre(cle)}>
              {label} <span>{compte(cle)}</span>
            </button>
          ))}
        </div>
      </div>

      {erreur && <div className="pr-erreur" role="alert"><AlertCircle size={16} />{erreur}</div>}
      {message && <div className="pr-succes" role="status"><CheckCircle2 size={16} />{message}</div>}

      {!liste.length ? (
        <p className="pr-vide">{terme ? 'Aucun produit ne correspond à cette recherche.' : 'Aucun produit dans cette catégorie.'}</p>
      ) : (
        <div className="pr-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Produit</th>
                <th scope="col">Boutique</th>
                <th scope="col">Prix</th>
                <th scope="col">Stock</th>
                <th scope="col">État</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {liste.map((p) => {
                const visible = estVisible(p)
                const stock = Number(p.stockQuantity || 0)
                return (
                  <tr key={p.id} className={visible ? '' : 'masque'}>
                    <th scope="row">
                      <b>{p.name || 'Sans nom'}</b>
                      <small>
                        {[p.brand, p.category].filter(Boolean).join(' · ') || 'Sans catégorie'}
                      </small>
                    </th>
                    <td>{p.seller?.name || <span className="pr-gris">Sans vendeur</span>}</td>
                    <td className="pr-prix">
                      {money(p.price)}
                      {p.originalPrice > p.price && <del>{money(p.originalPrice)}</del>}
                    </td>
                    <td>
                      <span className={`pr-stock ${stock <= 0 ? 'rupture' : stock <= 5 ? 'faible' : 'ok'}`}>
                        {stock <= 0 ? 'Rupture' : `${stock} en stock`}
                      </span>
                    </td>
                    <td>
                      <span className={`pr-etat ${visible ? 'visible' : 'cache'}`}>
                        {visible ? 'En vente' : 'Retiré'}
                      </span>
                    </td>
                    <td className="pr-actions">
                      <button
                        className={visible ? 'pr-masquer' : 'pr-afficher'}
                        disabled={busy === p.id}
                        onClick={() => basculer(p)}
                      >
                        {visible ? <><EyeOff size={15} /> Retirer</> : <><Eye size={15} /> Remettre</>}
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
