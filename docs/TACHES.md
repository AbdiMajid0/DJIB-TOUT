# DJIB TOUT — état des travaux

Dernière mise à jour : 15 août 2026.

Chaque tâche porte son **critère de vérification** : de quoi contrôler soi-même
qu'elle est réellement faite, sans se fier à une déclaration.

---

## Fait

### Administration — six écrans branchés sur l'API

Avant, `Dashboard type="admin"` retombait sur `PortalContent`, une maquette
statique. **Aucun appel `/api/admin/...` n'existait dans le frontend**, alors
que 17 endpoints étaient déjà écrits côté backend.

| Écran | Route | Commit |
|---|---|---|
| Vue générale | `/admin` | `28808a7` |
| Vendeurs | `/admin/sellers` | `f2204b0` |
| Utilisateurs | `/admin/users` | `c403762` |
| Opérations (commandes, retours) | `/admin/operations` | `273551e` |
| Modération (avis, questions) | `/admin/moderation` | `af3468d` |
| Produits | `/admin/products` | `ac0d25e` |

### Accès et sécurité

- **`AdminProtected`** — `/admin/*` n'avait aucune protection frontend. N'importe
  qui pouvait ouvrir l'administration en tapant l'URL. *(`b7b5583`)*
- **Entrée « Administration »** dans le menu du compte, visible seulement si
  `role === "ADMIN"`. Auparavant l'URL était le seul accès. *(`b7b5583`)*
- **Libellés réels** — « Administrateur », « Compte actif » et « Acheteur »
  étaient écrits en dur et s'affichaient même sans session. *(`b7b5583`)*
- **Fuite de jetons corrigée** — `GET /api/admin/users` renvoyait les entités
  `User` complètes. `password` était masqué, mais pas `emailVerificationToken`
  ni `passwordResetToken`. Un jeton de réinitialisation suffit à prendre le
  contrôle d'un compte. *(`b4fb0b1`)*
- **`GET /api/admin/products` ajouté** — la modération produit était à sens
  unique : les requêtes publiques filtrent sur `visible`, donc un produit masqué
  devenait introuvable. *(`ac0d25e`)*

### Vérifié comme déjà fait, aucune modification

- Les jetons ne fuitent pas par `/api/auth/*` — `/register` renvoie un message,
  `/forgot-password` répond « Si ce compte existe… », volontairement non énumérable.
- `RateLimitFilter` couvre tout le préfixe `/api/auth/`, donc `forgot-password`
  et la vérification e-mail sont déjà limités.
- `ValidatedSellerFilter` bloque déjà les vendeurs non validés sur
  `/api/products`, `/api/seller/*` et `/api/upload`.

---

## À faire

### Priorité haute — visible par les clients

**Route `/boutique/vendeur/:id` manquante.**
`ProductDetailPage.jsx` pointe vers cette adresse, mais aucune route `/boutique`
n'est déclarée dans `SiteRouter.jsx`. Le lien « Voir la boutique » tombe donc sur
la page 404 **sur toutes les fiches produit**. Le composant `PublicStorePage.jsx`
existe et n'est importé nulle part.
*Vérifier : cliquer sur le nom du vendeur depuis une fiche produit ouvre sa boutique.*

**Encodage UTF-8.**
Visible dans les logs du backend : « Base de donn?es d?j? initialis?e ».
Touchera les e-mails, les noms de produits et les messages d'erreur.
*Vérifier : les accents s'affichent correctement dans les logs et sur un produit
nommé « Téléphone à écran incurvé ».*

**Menu vendeur.**
Le nom de boutique « Djib Electronics » est écrit en dur (`SiteRouter.jsx:67`).
La déconnexion serait cassée. Et le compteur de commandes filtre sur
`["PAID","PROCESSING"]` — **`PAID` n'existe pas** dans `OrderStatus`
(`PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED`), donc il sous-compte.
*Vérifier : le nom affiché est celui de la boutique connectée ; la déconnexion
ramène à `/vendeur/login` ; une nouvelle commande incrémente le compteur.*

### Priorité moyenne — confort client

- **Listes personnelles** — affichent « Produit # » (`SiteRouter.jsx` lignes 2213,
  2744, 2814) au lieu du nom, de l'image et du prix.
- **Pagination** absente sur commandes, paiements, favoris et avis.
- **Annulation d'un retour** non traité — aucune trace dans le code.
- **Notifications client** — un `notificationCount` existe, mais rien ne remonte
  les commandes, paiements et retours côté acheteur.

### Administration — cinq écrans encore sur maquette

Catégories, Campagnes, Coupons, Accueil, Journal d'audit. **Aucun ne bloque
personne** : ce sont des outils de configuration, pas des files d'attente.
Les endpoints existent déjà.

### Sécurité restante

**Révocation des jetons** après suppression de compte et changement de mot de
passe. `revokeAll` et `deleteByUser` existent ; reste à confirmer qu'ils sont
bien appelés depuis `AccountController`.
*Vérifier : changer son mot de passe, puis réutiliser l'ancien jeton — doit
renvoyer 401.*

### Mise en ligne — reporté

Décision du 14 août : finir le projet d'abord.

- **`VITE_API_URL` n'est passé nulle part** — ni Dockerfile, ni docker-compose.
  `api.js` retombe sur `/api` relatif et le proxy Vite n'existe qu'en
  développement : **tous les appels API renverraient 404 en production**. Vite
  fige la valeur au build, l'image devra être reconstruite.
- **`vite preview` n'est pas un serveur de production.** Servir `dist/` derrière
  nginx avec repli SPA et proxy `/api`, ce qui supprime aussi les questions de
  CORS. Le healthcheck actuel teste `/health`, qui renvoie `index.html` avec un
  code 200 même si l'application est cassée.

### Tests de bout en bout

- **Parcours vendeur** : inscription → dossier → validation admin → produit →
  commande → expédition → règlement → retrait, sans intervention en base.
- **Parcours client** : inscription → e-mail réellement reçu → panier → paiement
  → suivi → retour.
- **Responsive** à 375, 768 et 1280 px, plus les 86 tests backend et le build.

---

## Pièges connus du code

**`getOrDefault` avec une valeur par défaut active.** Plusieurs endpoints
appliquent `getOrDefault("champ", valeur)` : omettre le champ déclenche l'action.
Rencontré sur la validation vendeur (`validated` → `false`), la modération
(`hidden` → `true`) et les produits (`visible` → `true`). **Toujours envoyer les
valeurs explicitement.**

**Des composants écrits mais non branchés.** `PublicStorePage.jsx` n'est importé
nulle part. `App.jsx` est routé dans `AppRoutes` mais `RoutedSite` intercepte
`/` avant et rend `DynamicHome` — c'est donc du code mort.

**Trois bases distinctes.** Supabase en production via `.env`,
`localhost:5432/djibtout` que le profil `local` utilise par défaut, et
`localhost:55432/djibtout_test` pour les tests. Le profil `local` a
`ddl-auto=update` : **ne jamais le pointer sur Supabase.**

**Lancer le backend avec `backend/start-supabase.cmd`**, jamais `mvnw` seul — le
script charge le `.env` et règle le CORS pour les ports 5173, 5174 et 3000.
