import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, imageUrl, money } from './api'

// api.js lit localStorage a chaque appel. On le remplace par un double : le
// test n'a pas besoin d'un DOM, seulement d'un objet qui repond getItem.
beforeEach(() => {
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const reponse = (corps, { status = 200, json = true } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => (json ? 'application/json' : 'text/plain') },
  json: async () => corps,
  text: async () => String(corps),
})

describe('api — pannes reseau', () => {
  // Le defaut d origine : « Failed to fetch » s affichait tel quel sur l ecran
  // de connexion. Le backend eteint etait indiscernable d un refus serveur.
  it('rend un message lisible quand le serveur ne repond pas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(api('/products')).rejects.toThrow(/injoignable/)
  })

  it('marque la panne reseau avec le statut 0, jamais 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    // Un appelant qui deconnecte l utilisateur sur 401 ne doit pas le faire ici.
    await expect(api('/products')).rejects.toMatchObject({ status: 0 })
  })

  it('conserve la cause d origine pour le diagnostic', async () => {
    const panne = new TypeError('Failed to fetch')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(panne))
    await expect(api('/products')).rejects.toMatchObject({ cause: panne })
  })
})

describe('api — reponses du serveur', () => {
  it('rend le corps decode sur succes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reponse({ id: 7 })))
    await expect(api('/products/7')).resolves.toEqual({ id: 7 })
  })

  it('rend null sur 204 sans tenter de decoder', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reponse(null, { status: 204 })))
    await expect(api('/favorites/7', { method: 'DELETE' })).resolves.toBeNull()
  })

  it('remonte le message du serveur et son statut', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reponse({ message: 'Stock insuffisant.' }, { status: 409 })))
    await expect(api('/orders', { method: 'POST' })).rejects.toMatchObject({
      message: 'Stock insuffisant.',
      status: 409,
    })
  })

  it('se rabat sur le code quand le serveur ne dit rien', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reponse('', { status: 500, json: false })))
    await expect(api('/orders')).rejects.toThrow('Erreur 500')
  })

  it('n essaie pas de rafraichir la session sur les routes /auth/', async () => {
    const appel = vi.fn().mockResolvedValue(reponse({ message: 'Identifiants invalides.' }, { status: 401 }))
    vi.stubGlobal('fetch', appel)
    await expect(api('/auth/login', { method: 'POST' })).rejects.toThrow('Identifiants invalides.')
    expect(appel).toHaveBeenCalledTimes(1)
  })
})

describe('imageUrl', () => {
  // Le defaut d origine : le jeu de demonstration ecrivait des emojis dans
  // `images`, et <img src="🛋️"> affichait une image cassee — pire qu une liste
  // vide, qui aurait laisse le repli prevu par l interface.
  it('ignore une valeur qui n est pas une source', () => {
    expect(imageUrl({ images: ['🛋️'] })).toBeNull()
  })

  it('retient la premiere source exploitable', () => {
    expect(imageUrl({ images: ['🛋️', 'https://exemple.dj/a.jpg'] })).toBe('https://exemple.dj/a.jpg')
  })

  it('accepte un chemin relatif et une image en ligne', () => {
    expect(imageUrl({ images: ['/uploads/a.jpg'] })).toBe('/uploads/a.jpg')
    expect(imageUrl({ images: ['data:image/png;base64,AAA'] })).toBe('data:image/png;base64,AAA')
  })

  it('rend null sur un produit sans image', () => {
    expect(imageUrl({ images: [] })).toBeNull()
    expect(imageUrl({})).toBeNull()
    expect(imageUrl(null)).toBeNull()
  })
})

describe('money', () => {
  it('rend zero pour une valeur absente plutot que NaN', () => {
    expect(money(null)).toBe(money(0))
  })

  it('suffixe la devise locale', () => {
    expect(money(1500)).toMatch(/FDJ$/)
  })
})
