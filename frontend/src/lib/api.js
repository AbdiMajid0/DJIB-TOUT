const API_URL = import.meta.env.VITE_API_URL || '/api'

function messageOf(value, fallback) {
  if (!value) return fallback
  if (typeof value === 'string') return value
  return value.message || value.error || fallback
}

export async function api(path, options = {}, retry = true) {
  const token = localStorage.getItem('dt.accessToken')
  const headers = new Headers(options.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  // fetch ne rejette que sur echec reseau : serveur arrete, DNS, port ferme.
  // Le message natif (« Failed to fetch », « NetworkError ») remontait tel quel
  // jusqu'a l'ecran de connexion, qui l'affichait a l'utilisateur. Il fallait
  // lire le terminal de Vite pour comprendre que le backend n'etait pas lance.
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {...options, headers})
  } catch (cause) {
    const error = new Error('Le serveur est injoignable. Verifiez votre connexion, puis reessayez.')
    error.status = 0
    error.cause = cause
    throw error
  }
  const type = response.headers.get('content-type') || ''
  const data = response.status === 204 ? null : type.includes('json') ? await response.json() : await response.text()
  if (!response.ok) {
    if (response.status === 401 && retry && !path.startsWith('/auth/')) {
      const refreshToken = localStorage.getItem('dt.refreshToken')
      if (refreshToken) {
        try {
          const refreshed = await api('/auth/refresh', {method:'POST', body:JSON.stringify({refreshToken})}, false)
          localStorage.setItem('dt.accessToken', refreshed.token)
          localStorage.setItem('dt.refreshToken', refreshed.refreshToken)
          return api(path, options, false)
        } catch { /* session invalid below */ }
      }
      window.dispatchEvent(new Event('dt:unauthorized'))
    }
    // Le statut est conservé sur l'erreur : sans lui, l'appelant ne peut pas
    // distinguer une session expirée (401, il faut déconnecter) d'une panne
    // serveur ou réseau (il ne faut pas).
    const error = new Error(messageOf(data, `Erreur ${response.status}`))
    error.status = response.status
    throw error
  }
  return data
}

export const nombre = value => new Intl.NumberFormat('fr-FR').format(Number(value || 0))
// Le franc djiboutien n'a pas de subdivision : arrondir evite « 1 500,333 FDJ »
// sur les montants issus d'un calcul de commission ou de remise.
export const money = value => `${nombre(Math.round(Number(value || 0)))} FDJ`

// Les dates arrivent en texte depuis l'API : une valeur absente ou illisible
// donnait « Invalid Date » dans les tableaux. On rend le tiret cadratin utilise
// partout ailleurs comme repli.
const dateValide = value => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
export const dateCourte = (value, repli = '—') =>
  dateValide(value)?.toLocaleDateString('fr-FR') || repli
export const dateLisible = (value, repli = '—') =>
  dateValide(value)?.toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'}) || repli
export const dateHeure = (value, repli = '—') =>
  dateValide(value)?.toLocaleString('fr-FR') || repli

// Un lien direct vers un export renverrait 401 : le jeton vit dans
// localStorage, pas dans un cookie. On telecharge donc le fichier via fetch
// puis on declenche l'enregistrement depuis le blob obtenu.
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function apiBlob(path) {
  const token = localStorage.getItem('dt.accessToken')
  const response = await fetch(`${API_URL}${path}`, {headers: token ? {Authorization:`Bearer ${token}`} : {}})
  if (!response.ok) {
    const error = new Error(`Erreur ${response.status}`)
    error.status = response.status
    throw error
  }
  return response.blob()
}

export async function download(path, filename) {
  saveBlob(await apiBlob(path), filename)
}
// `images` peut contenir n'importe quoi : emoji du jeu de demonstration, texte
// saisi par un vendeur. Rendre <img src="emoji"> affiche une image cassee, la
// ou une liste vide aurait affiche le repli prevu par l'interface. On ne retient
// donc que les valeurs reellement exploitables comme source.
const sourceUtilisable = value =>
  typeof value === 'string' && /^(https?:\/\/|\/|data:image\/)/.test(value.trim())
export const imageUrl = product =>
  (product?.images || []).find(sourceUtilisable)?.trim() || null
