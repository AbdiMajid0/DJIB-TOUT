import React from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff, MessageSquare, Star } from 'lucide-react'
import { api } from './lib/api'
import './admin-moderation.css'

const date = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const FILTRES = [['ALL', 'Tous'], ['VISIBLE', 'Visibles'], ['HIDDEN', 'Masqués']]

export default function AdminModerationPage() {
  const [onglet, setOnglet] = React.useState('avis')
  const [reviews, setReviews] = React.useState(null)
  const [questions, setQuestions] = React.useState(null)
  const [filtre, setFiltre] = React.useState('ALL')
  const [erreur, setErreur] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [busy, setBusy] = React.useState(null)

  const load = React.useCallback(() => {
    api('/admin/reviews').then((d) => setReviews(Array.isArray(d) ? d : [])).catch((e) => { setErreur(e.message); setReviews([]) })
    api('/admin/questions').then((d) => setQuestions(Array.isArray(d) ? d : [])).catch(() => setQuestions([]))
  }, [])

  React.useEffect(() => { load() }, [load])

  /**
   * L'API applique getOrDefault("hidden", true) : omettre le champ masquerait
   * l'element. On envoie donc toujours la valeur voulue, explicitement.
   */
  async function basculer(type, item) {
    const cle = `${type}-${item.id}`
    setBusy(cle); setErreur(''); setMessage('')
    const hidden = !item.hidden
    try {
      await api(`/admin/${type === 'avis' ? 'reviews' : 'questions'}/${item.id}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({ hidden }),
      })
      setMessage(hidden ? 'Contenu masqué du site public.' : 'Contenu de nouveau visible.')
      load()
    } catch (e) {
      setErreur(e.message)
    } finally {
      setBusy(null)
    }
  }

  const source = onglet === 'avis' ? reviews : questions
  if (source === null && !erreur) return <div className="admin-mod"><p className="mo-chargement">Chargement…</p></div>

  const items = (source || []).filter((x) =>
    filtre === 'ALL' || (filtre === 'HIDDEN' ? x.hidden : !x.hidden))
  const compte = (cle) => (source || []).filter((x) =>
    cle === 'ALL' || (cle === 'HIDDEN' ? x.hidden : !x.hidden)).length

  const masquesAvis = (reviews || []).filter((r) => r.hidden).length
  const masqueesQuestions = (questions || []).filter((q) => q.hidden).length
  const sansReponse = (questions || []).filter((q) => !q.answer && !q.hidden).length

  return (
    <div className="admin-mod">
      <div className="mo-onglets" role="tablist">
        <button
          role="tab"
          aria-selected={onglet === 'avis'}
          className={onglet === 'avis' ? 'actif' : ''}
          onClick={() => { setOnglet('avis'); setFiltre('ALL') }}
        >
          <Star size={16} /> Avis
          {masquesAvis > 0 && <b>{masquesAvis}</b>}
        </button>
        <button
          role="tab"
          aria-selected={onglet === 'questions'}
          className={onglet === 'questions' ? 'actif' : ''}
          onClick={() => { setOnglet('questions'); setFiltre('ALL') }}
        >
          <MessageSquare size={16} /> Questions
          {masqueesQuestions > 0 && <b>{masqueesQuestions}</b>}
        </button>
      </div>

      {onglet === 'questions' && sansReponse > 0 && (
        <p className="mo-note">
          {sansReponse} question{sansReponse > 1 ? 's' : ''} sans réponse. C'est au vendeur d'y répondre —
          la modération ne sert qu'à masquer un contenu inapproprié.
        </p>
      )}

      <div className="mo-filtres">
        {FILTRES.map(([cle, label]) => (
          <button key={cle} className={filtre === cle ? 'actif' : ''} onClick={() => setFiltre(cle)}>
            {label} <span>{compte(cle)}</span>
          </button>
        ))}
      </div>

      {erreur && <div className="mo-erreur" role="alert"><AlertCircle size={16} />{erreur}</div>}
      {message && <div className="mo-succes" role="status"><CheckCircle2 size={16} />{message}</div>}

      {!items.length ? (
        <p className="mo-vide">Aucun contenu dans cette catégorie.</p>
      ) : (
        <div className="mo-liste">
          {items.map((x) => {
            const cle = `${onglet}-${x.id}`
            return (
              <article className={`mo-carte${x.hidden ? ' masque' : ''}`} key={x.id}>
                <header>
                  <div className="mo-qui">
                    <b>{x.user?.name || x.user?.email || 'Utilisateur inconnu'}</b>
                    <small>
                      {x.product?.name || 'Produit supprimé'} · {date(x.createdAt)}
                    </small>
                  </div>
                  {onglet === 'avis' && x.rating != null && (
                    <span className="mo-note-etoiles" aria-label={`${x.rating} sur 5`}>
                      {'★'.repeat(Math.max(0, Math.min(5, x.rating)))}
                      <i>{'★'.repeat(5 - Math.max(0, Math.min(5, x.rating)))}</i>
                    </span>
                  )}
                  {x.hidden && <span className="mo-badge">Masqué</span>}
                </header>

                <p className="mo-texte">
                  {onglet === 'avis' ? (x.comment || <em>Note sans commentaire.</em>) : x.question}
                </p>

                {onglet === 'avis' && x.sellerResponse && (
                  <p className="mo-reponse"><b>Réponse du vendeur :</b> {x.sellerResponse}</p>
                )}
                {onglet === 'questions' && (
                  x.answer
                    ? <p className="mo-reponse"><b>Réponse :</b> {x.answer}</p>
                    : <p className="mo-attente">En attente d'une réponse du vendeur.</p>
                )}

                <footer>
                  <button
                    className={x.hidden ? 'mo-afficher' : 'mo-masquer'}
                    disabled={busy === cle}
                    onClick={() => basculer(onglet, x)}
                  >
                    {x.hidden ? <><Eye size={15} /> Rendre visible</> : <><EyeOff size={15} /> Masquer</>}
                  </button>
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
