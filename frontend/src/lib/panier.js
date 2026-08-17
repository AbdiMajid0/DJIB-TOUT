// Logique du panier, extraite du contexte React pour etre verifiable sans DOM.
// Toutes ces fonctions sont pures : elles rendent un nouveau tableau et ne
// touchent jamais l'etat. C'est ce qui permet de les tester avec vitest seul,
// sans jsdom ni bibliotheque de rendu.

/**
 * Identifiant d'une ligne de panier.
 *
 * Un meme produit occupe plusieurs lignes s'il est pris en plusieurs variantes.
 * L'ajout indexait deja sur produit+variante, mais la modification filtrait sur
 * le seul identifiant de produit : changer la quantite d'une variante les
 * modifiait toutes, en supprimer une les supprimait toutes.
 *
 * Le repli sur `product.id` sert aux paniers deja en stockage local, enregistres
 * avant l'arrivee des variantes.
 */
export const cleArticle = (x) =>
  x.key || `${x.product.id}:${x.variant?.id || 'base'}`

/** Le stock de la variante prime : les deux different des qu'un modele est epuise. */
export const stockDisponible = (product, variant) =>
  variant?.stockQuantity ?? product?.stockQuantity ?? 99

/** Ajoute une ligne, ou cumule la quantite si la meme variante y figure deja. */
export function ajouter(items, product, quantity = 1, variant = null) {
  const cle = cleArticle({ product, variant })
  const limite = stockDisponible(product, variant)
  if (!items.some((x) => cleArticle(x) === cle))
    return [...items, { key: cle, product, variant, quantity: Math.min(quantity, limite) }]
  return items.map((x) =>
    cleArticle(x) === cle
      ? { ...x, quantity: Math.min(x.quantity + quantity, limite) }
      : x,
  )
}

/** Fixe la quantite d'une ligne. Une quantite nulle ou negative la retire. */
export function modifier(items, cle, quantity) {
  if (quantity < 1) return items.filter((x) => cleArticle(x) !== cle)
  return items.map((x) => (cleArticle(x) === cle ? { ...x, quantity } : x))
}

export const sousTotal = (items) =>
  items.reduce((n, x) => n + Number(x.product.price) * x.quantity, 0)

export const nombreArticles = (items) => items.reduce((n, x) => n + x.quantity, 0)
