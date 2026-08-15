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
  const response = await fetch(`${API_URL}${path}`, {...options, headers})
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

export const money = value => `${new Intl.NumberFormat('fr-FR').format(Number(value || 0))} FDJ`
export const imageUrl = product => product?.images?.[0] || null
