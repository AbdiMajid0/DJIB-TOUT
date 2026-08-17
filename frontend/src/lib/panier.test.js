import { describe, expect, it } from 'vitest'
import {
  ajouter, cleArticle, modifier, nombreArticles, sousTotal, stockDisponible,
} from './panier'

const produit = { id: 7, name: 'Canapé', price: 150000, stockQuantity: 5 }
const rouge = { id: 71, sku: 'CAN-R', price: 150000, stockQuantity: 2 }
const bleu = { id: 72, sku: 'CAN-B', price: 150000, stockQuantity: 4 }

describe('cleArticle', () => {
  it('distingue deux variantes du meme produit', () => {
    expect(cleArticle({ product: produit, variant: rouge }))
      .not.toBe(cleArticle({ product: produit, variant: bleu }))
  })

  it('retombe sur le produit seul quand il n y a pas de variante', () => {
    expect(cleArticle({ product: produit, variant: null })).toBe('7:base')
  })

  it('accepte un panier herite, enregistre avant les variantes', () => {
    expect(cleArticle({ product: produit })).toBe('7:base')
  })
})

describe('ajouter', () => {
  it('cree une ligne', () => {
    expect(ajouter([], produit, 1, rouge)).toHaveLength(1)
  })

  it('cumule la quantite pour une variante deja presente', () => {
    const panier = ajouter(ajouter([], produit, 1, rouge), produit, 1, rouge)
    expect(panier).toHaveLength(1)
    expect(panier[0].quantity).toBe(2)
  })

  // Le defaut d origine : deux variantes se confondaient en une seule ligne.
  it('tient deux lignes distinctes pour deux variantes', () => {
    const panier = ajouter(ajouter([], produit, 1, rouge), produit, 1, bleu)
    expect(panier).toHaveLength(2)
    expect(panier.map((x) => x.variant.id)).toEqual([71, 72])
  })

  it('plafonne au stock de la variante, pas a celui du produit', () => {
    // rouge n a que 2 unites la ou le produit en affiche 5.
    expect(ajouter([], produit, 9, rouge)[0].quantity).toBe(2)
  })

  it('plafonne au stock du produit en l absence de variante', () => {
    expect(ajouter([], produit, 9)[0].quantity).toBe(5)
  })
})

describe('modifier', () => {
  const panier = ajouter(ajouter([], produit, 1, rouge), produit, 1, bleu)

  // Le defaut d origine : la modification portait sur toutes les variantes.
  it('ne change que la variante visee', () => {
    const apres = modifier(panier, cleArticle({ product: produit, variant: rouge }), 2)
    expect(apres.find((x) => x.variant.id === 71).quantity).toBe(2)
    expect(apres.find((x) => x.variant.id === 72).quantity).toBe(1)
  })

  // Le defaut d origine : la suppression emportait toutes les variantes.
  it('ne retire que la variante visee', () => {
    const apres = modifier(panier, cleArticle({ product: produit, variant: rouge }), 0)
    expect(apres).toHaveLength(1)
    expect(apres[0].variant.id).toBe(72)
  })

  it('laisse le panier intact pour une cle inconnue', () => {
    expect(modifier(panier, '999:base', 5)).toEqual(panier)
  })

  it('traite un panier herite sans cle', () => {
    const herite = [{ product: produit, quantity: 3 }]
    expect(modifier(herite, '7:base', 0)).toHaveLength(0)
  })
})

describe('totaux', () => {
  const panier = ajouter(ajouter([], produit, 2, rouge), produit, 1, bleu)

  it('additionne le sous-total sur toutes les lignes', () => {
    expect(sousTotal(panier)).toBe(450000)
  })

  it('compte les articles et non les lignes', () => {
    expect(nombreArticles(panier)).toBe(3)
  })

  it('rend zero sur un panier vide', () => {
    expect(sousTotal([])).toBe(0)
    expect(nombreArticles([])).toBe(0)
  })
})

describe('stockDisponible', () => {
  it('donne la priorite a la variante', () => {
    expect(stockDisponible(produit, rouge)).toBe(2)
  })

  it('accepte un stock nul sans le confondre avec une absence de valeur', () => {
    expect(stockDisponible(produit, { ...rouge, stockQuantity: 0 })).toBe(0)
  })
})
