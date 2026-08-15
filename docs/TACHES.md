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

### Boutique publique — route branchée et endpoint rendu public

Le lien « Voir la boutique » des fiches produit tombait sur la page 404. Deux
défauts, pas un seul :

- **Route absente** — `PublicStorePage.jsx` n'était importé nulle part et aucune
  route `/boutique` n'existait. Route `/boutique/vendeur/:sellerId` ajoutée dans
  `AppRoutes` (`SiteRouter.jsx`). Le paramètre devait s'appeler `sellerId`, c'est
  le nom lu par `useParams()` dans le composant.
- **Endpoint fermé aux visiteurs** — `SecurityConfig` n'avait aucune règle pour
  `/api/public/**` et terminait par `anyRequest().authenticated()` :
  `GET /api/public/stores/by-seller/1` renvoyait **401** à un visiteur non
  connecté. Corriger la route seule n'aurait donc affiché que « Boutique
  indisponible ». `/api/public/**` ajouté à la liste `permitAll` en GET.
  `ValidatedSellerFilter` excluait déjà `/api/public/` : l'endpoint était bien
  prévu pour être public, seule la configuration de sécurité manquait.

*Vérifié le 15 août :* même appel anonyme avant/après redémarrage du backend,
401 → **200**. Depuis `/product/19`, le clic sur « Voir la boutique » n'ouvre
plus la 404 et rend `PublicStorePage` ; `/boutique/vendeur/4` affiche la
boutique complète (nom, contacts, politiques), accents corrects.

**Troisième blocage, données cette fois — levé.** Une fois route et endpoint
corrigés, le lien affichait toujours « Boutique indisponible » : le vendeur 1,
qui détient **les 19 produits** du catalogue, n'avait **aucune ligne** dans
`seller_stores` (la seule boutique validée appartenait au vendeur 4, sans aucun
produit). Boutique minimale créée pour le vendeur 1 — `name = 'Test Seller'`,
`validated = true`, le reste laissé vide, le composant ayant ses propres replis
(« Non renseigné »). Aucune donnée commerciale inventée.

⚠️ Créée par `INSERT` direct en base, car l'accès admin n'était pas disponible.
Le parcours prévu reste *onboarding vendeur* (`/api/seller/store`) puis
*validation admin* ; à privilégier pour toute boutique ultérieure.

*Trace de vérification, même URL `/api/public/stores/by-seller/1` :*
`401` (avant correctif sécurité) → `404` (avant correctif données) → **`200`**.
La page affiche « Test Seller » et **19 tuiles produit**, chacune renvoyant vers
sa fiche.

### Vérifié le 15 août — fausses pistes, ne pas rouvrir

Trois points inscrits en « priorité haute » ne tenaient pas à la relecture :

- **Nom de boutique en dur dans le menu vendeur — faux.** `storeName` est chargé
  depuis `/seller/store` (`SiteRouter.jsx:1401`) et affiché en
  `storeName || user?.name || "Ma boutique"` (`:1444` et `:1448`). C'est déjà la
  boutique connectée.
- **Déconnexion cassée — faux.** `SiteRouter.jsx:1453` appelle `logout()` puis
  `navigate("/vendeur/login")` pour un vendeur, ce qui est exactement le critère
  de vérification demandé.
- **« Bonjour, Djib Electronics 👋 » — code mort.** Ce titre
  (`SiteRouter.jsx:2378`) n'est rendu par `PortalContent` que lorsque `root` est
  vrai, donc sur `/seller` ou `/admin` exactement — or `Dashboard` intercepte ces
  deux chemins vers `SellerDashboardHome` et `AdminOverviewPage` (`:1350`,
  `:1374`). Inatteignable par navigation normale. `PortalContent` ne sert plus
  qu'aux écrans admin encore sur maquette. Le corriger ne changerait rien à
  l'écran.

**Encodage UTF-8 — bien plus étroit que craint.** Les données sont saines :
`GET /api/products/19` renvoie `Jus d'Orange Pressé`, sans mojibake, vérifié
dans le navigateur. Seule la **sortie console du backend** est abîmée
(`Base de donn?es d?j? initialis?e`) : c'est la page de codes Windows du flux de
log, pas une corruption en base. La crainte « touchera les noms de produits »
est infirmée. Restent à vérifier séparément les **e-mails**.

### Environnement local de vérification (mis en place le 15 août)

Plusieurs écrans étaient invérifiables : derrière une session, et sans données.
Une pile locale complète existe désormais, **totalement séparée de Supabase**.

- **Backend local** : port **8083**, profil `local`, base
  `localhost:5432/djibtout` (à créer une fois :
  `psql -U postgres -c "CREATE DATABASE djibtout"`). Lancé par
  **`backend/start-local.cmd`**, qui **ne charge pas le `.env`** — celui-ci
  pointe sur Supabase et le profil `local` a `ddl-auto=update`. Flyway applique
  les migrations et le `DataSeeder` crée les produits.
- **Frontend local** : port **5181**, entrée `frontend-local` de
  `.claude/launch.json`. `vite.config.js` accepte maintenant
  `VITE_PROXY_TARGET` (défaut inchangé : 8082).
- **Comptes de test** : `seller@test.com` / `password` est créé par le
  `DataSeeder` (rôle SELLER). Un acheteur jetable a été inscrit via l'API :
  `acheteur.test@local.invalid`. **Local uniquement.**

⚠️ Le health check `/actuator/health` répond DOWN en local : `MailHealthIndicator`
échoue faute de SMTP. L'application, elle, fonctionne — tester `/api/products`
plutôt que le health.

### Listes personnelles — trois défauts, pas un seul

Le point « affiche Produit # » cachait trois causes distinctes, toutes corrigées
et **vérifiées à l'écran** cette fois.

1. **Données absentes.** `GET /api/lists` renvoyait les entités `SavedList`, qui
   ne portent que des identifiants. L'écran ne *pouvait pas* afficher autre
   chose. La réponse est désormais construite par `SavedListController.view()`
   et joint `products` (nom, prix, images, catégorie, visible), en conservant
   `productIds`.
2. **Endpoint cassé depuis le début.** `spring.jpa.open-in-view=false` : lire
   `productIds` (`@ElementCollection` LAZY) hors transaction lève une
   `LazyInitializationException`. C'était déjà le cas avant, Jackson échouant à
   sérialiser l'entité — **la fonctionnalité n'avait jamais pu marcher**, ce qui
   explique que `saved_lists` soit vide en production. `all`, `create`,
   `rename`, `add` et `remove` sont désormais `@Transactional`.
3. **Page blanche.** `React.useEffect(load, [])` renvoyait la promesse de
   `load` ; React la prend pour la fonction de nettoyage et lève « destroy is
   not a function », ce qui vidait tout l'écran. Corrigé par des accolades.

Détail d'affichage : `images` contient parfois un **emoji** et non une URL (le
`DataSeeder` en pose, y compris en production). Le passer à `<img src>` donne
une image cassée ; la pastille affiche donc le glyphe tel quel quand ce n'est pas
une URL.

*Vérifié le 15 août sur la pile locale, connecté :* la liste « Mes envies »
affiche `🍝 Pâtes Barilla 500g — 500 FDJ`, `☕ Café Lavazza 1kg — 4 500 FDJ`,
`🧃 Jus d'Orange Pressé — 800 FDJ`, aucune image cassée, et le bouton « × »
retire bien le produit (3 → 2 pastilles, sans erreur).

### Pagination des écrans personnels

Les quatre endpoints renvoyaient des `List` nues : commandes, paiements, favoris
et avis chargeaient tout, sans limite. Ils acceptent désormais `page` et `size`
et renvoient un `Page`, **exactement comme `/api/products`** — le client savait
déjà lire cette forme (`d.content || d`).

`size` est borné à 50 côté serveur et `page` ramené à 0 s'il est négatif : sans
cela, `?size=9999` permettait de vider la table en un appel, ce qui vidait
l'intérêt même de la pagination.

Côté écran, un composant `Pagination` partagé, qui **ne s'affiche pas** s'il n'y
a qu'une page — les écrans courts ne sont pas encombrés. La page est remise à 0
au changement d'écran, sans quoi passer d'une liste longue en page 3 à une liste
courte aurait affiché du vide.

**Deux pièges rencontrés :**

- **La vue générale comptait `o.length` et `f.length`.** Avec une réponse
  paginée ces compteurs devenaient `undefined` : ils lisent maintenant
  `totalElements`. C'est le genre de casse qui ne se voit qu'à l'écran.
- **`/orders/my-orders` était cassé depuis toujours** pour un utilisateur ayant
  des commandes : `Order.buyer` est un proxy LAZY et l'endpoint renvoyait
  l'entité. Le défaut ne s'était jamais vu parce que la table était vide.
  L'endpoint renvoie désormais un résumé construit dans une transaction — ce qui
  **supprime au passage l'envoi du compte complet de l'acheteur** dans chaque
  ligne de commande.

*Vérifié le 15 août sur la pile locale, 12 commandes créées pour dépasser une
page :* « Page 1 sur 2 · 12 éléments », 10 commandes puis 2, « Précédent »
désactivé en page 1 et « Suivant » en page 2, compteur de la vue générale à 12,
`?size=9999` ramené à 50, `?page=-5` ramené à 0. Aucune erreur console ni
serveur.

### Notifications acheteur

La cloche du portail acheteur pointait vers `#` et son compteur n'était chargé
que pour les vendeurs : **rien n'existait côté acheteur**, ni stockage ni
endpoint.

Ajouté : entité `BuyerNotification` + `V11__buyer_notifications.sql`, un service
d'émission volontairement tolérant (prévenir un client ne doit jamais faire
échouer le paiement qui l'a déclenché), et `/api/notifications`
(liste, `unread-count`, `{id}/read`, `read-all`).

Table distincte de `seller_notification`, dont la colonne porte `seller_id` et
dont le contrôleur refuse les comptes non-SELLER — les mélanger aurait rendu la
table ambiguë.

**Trois moments déclenchent une notification**, ceux qui comptent pour un
acheteur : paiement confirmé, commande expédiée (avec le numéro de suivi),
commande livrée, plus la décision du vendeur sur un retour. À noter :
l'expédition ne change **pas** le statut de la commande mais celui du
fulfillment — sans notification, l'acheteur ne voyait donc rien bouger.

*Vérifié le 15 août sur la pile locale, parcours réel* — commande payée puis
expédiée puis livrée : trois notifications créées, cloche à **3** et pointant
vers `/account/notifications`. Lecture d'une notification → cloche à 2 ; « tout
marquer comme lu » → badge disparu, plus aucun bouton. Le compteur se met à jour
sans rechargement, via l'événement `dt:notifications` déjà écouté par le portail.

**Défaut préexistant corrigé au passage :** `PATCH /api/seller/orders/{id}`
renvoyait **500** en sérialisant l'entité `SellerFulfillment`, alors que
l'expédition était bien enregistrée — le vendeur voyait une erreur sur une
opération réussie. Renvoie désormais les mêmes clés que `GET /seller/orders`,
que l'écran fusionne dans sa ligne.

⚠️ **Deux tests unitaires cassés puis réparés.** Ajouter une dépendance aux
constructeurs de `ReturnController` et `PaymentController` a fait échouer
`ReturnControllerTests` et `PaymentControllerTests`, qui les instancient à la
main. `spring-boot:run` compile les tests : le backend **refusait de démarrer**
tant qu'ils n'étaient pas mis à jour.

### Annulation d'un retour par l'acheteur

L'acheteur pouvait ouvrir une demande de retour mais jamais la retirer. Ajouté :
`POST /api/returns/{id}/cancel`, autorisé **uniquement tant que le statut est
`REQUESTED`** — passé APPROVED ou REJECTED, la décision appartient au vendeur,
qui est prévenu de l'abandon par une notification.

`CANCELLED` est volontairement absent de la liste qui bloque une nouvelle demande
sur le même article : annuler doit permettre de redemander. Vérifié.

⚠️ **Une migration était nécessaire.** Ajouter la valeur à l'enum Java ne suffit
pas : `V1__baseline_schema.sql:582` pose une contrainte `CHECK` qui n'énumérait
que les cinq statuts d'origine. Sans `V10__return_cancellation.sql`, l'annulation
échoue en violation de contrainte alors que le code la juge valide.

**Deux défauts préexistants découverts au passage**, invisibles tant que la table
`return_requests` était vide :

- **Tous les endpoints de retours renvoyaient 500** dès qu'un retour existait.
  `ReturnRequest.orderItem.product` est un proxy LAZY et `open-in-view=false`
  ferme la session avant la sérialisation. Les cinq endpoints renvoient
  désormais une vue compacte construite dans la transaction. Piège à retenir :
  mettre la collection paresseuse dans la vue **ne suffit pas**, il faut la
  copier — sinon Jackson l'initialise après coup et échoue quand même.
- **`PATCH /api/admin/orders/{id}/status` renvoyait 500** tout en appliquant le
  changement : l'administrateur voyait une erreur sur une opération réussie et
  pouvait la rejouer. Renvoie maintenant le même résumé que `GET /admin/orders`.

*Vérifié le 15 août sur la pile locale, parcours complet* — commande créée,
payée, livrée, puis : liste des retours (200, nom du produit et montant),
annulation (`Demandé` → `Annulé` à l'écran, bouton disparu), rejeu refusé en
**409**, nouvelle demande possible après annulation, traitement vendeur
(`APPROVED`), et annulation d'un retour approuvé refusée en **409**.

### Reliquats de `PAID` dans l'écran commandes vendeur

`labels` proposait « Payée » dans le filtre — option qui ne pouvait jamais rien
renvoyer — et le bouton « Commencer la préparation » n'était rendu que si
`status === 'PAID'`, donc jamais. Les deux sont supprimés. Le passage
`PENDING → PROCESSING` restant automatique au paiement, le vendeur enchaîne
directement sur « Confirmer l'expédition ».

### Administration — les cinq derniers écrans branchés sur l'API

`PortalContent` (la maquette statique) ne sert plus aucun écran d'administration.

| Écran | Route | Composant | Opérations |
|---|---|---|---|
| Catégories | `/admin/categories` | `AdminCategoriesPage` | liste, création, modification, suppression |
| Campagnes | `/admin/campaigns` | `AdminCampaignsPage` | liste, création, modification, suppression |
| Coupons | `/admin/coupons` | `AdminCouponsPage` | liste, création, modification, suppression |
| Accueil | `/admin/home-sections` | `AdminHomeSectionsPage` | liste, **modification seule** |
| Journal d'audit | `/admin/audit` | `AdminAuditPage` | **lecture seule**, recherche |

Les deux derniers sont volontairement bridés : l'API n'expose que GET + PUT pour
les sections d'accueil, et GET seul pour le journal.

Les cinq partagent `admin-config.css` — ils ont la même ossature (barre d'outils,
tableau défilant, formulaire), cinq feuilles auraient été cinq quasi-copies.

**Trois pièges rencontrés, tous corrigés :**

- **`Campaign` est bien plus strict que son écran ne le laissait croire.**
  `subtitle`, `badge` et `linkUrl` sont `@NotBlank`, et `gradient` est `NOT NULL`
  avec une valeur par défaut. Envoyer `null` sur un champ vide faisait échouer
  l'insertion en base (500). Les trois champs sont désormais obligatoires dans le
  formulaire et `gradient` retombe sur la valeur par défaut de l'entité.
- **`pattern="[a-z0-9-]+"` désactivait la validation du slug.** Les navigateurs
  compilent l'attribut `pattern` avec le drapeau `v`, où un `-` nu en fin de
  classe est une erreur de syntaxe. Le tiret est maintenant échappé.
- **`Category.parent` est `@ManyToOne(LAZY)`** et le contrôleur renvoie l'entité
  brute — le motif exact qui cassait `/api/lists`. Vérifié en créant une
  sous-catégorie : **pas de casse**, parce que `findAll` charge toutes les
  catégories, donc le parent est déjà dans le contexte de persistance. À
  surveiller si la requête devenait filtrée ou paginée.

*Vérifié le 15 août sur la pile locale, connecté en ADMIN* — chaque écran a été
exercé, pas seulement affiché :

- **Audit** : 32 entrées, tri du plus récent en tête.
- **Accueil** : 14 sections ; nombre d'articles modifié 14 → 8, message de
  succès, tableau rafraîchi.
- **Campagnes** : création, modification (ordre 0 → 5) et suppression (4 → 3).
- **Coupons** : création, passage de « 10 % » à « 2 500 FDJ », suppression,
  retour à l'état vide.
- **Catégories** : création, slug dérivé du nom (« Électroménager » →
  `electromenager`), sous-catégorie rattachée à son parent, conflit de slug
  remonté en clair (« Slug déjà utilisé. », formulaire conservé), suppression.

Les données de test ont été supprimées et les deux valeurs modifiées pendant les
essais remises à leur valeur d'origine.

### Révocation des jetons au changement de mot de passe et à la suppression

`AccountController` ne contenait **aucun appel** à `revokeAll`. Un jeton de
rafraîchissement volé restait donc valable jusqu'à **30 jours**
(`jwt.refresh-token-ms`) après que la victime ait changé son mot de passe —
c'est-à-dire après le geste même qu'on attend d'elle en cas de compromission.
Idem pour un compte supprimé.

Les deux méthodes appellent maintenant `refreshTokens.revokeAll(u)`. Pour le
changement de mot de passe, une **nouvelle session est délivrée dans la réponse**
et enregistrée par le client (`SellerSettingsPage`) : les autres appareils sont
déconnectés, celui qui vient de changer le mot de passe continue sans coupure.
Sans cela il aurait été déconnecté à l'expiration du jeton d'accès, 15 minutes
plus tard, sans explication.

*Vérifié le 15 août sur la pile locale, changement de mot de passe :*

| Contrôle | Résultat |
|---|---|
| Jeton copié avant le changement (vol simulé) | **refusé, 401** |
| Nouvelle session livrée à l'appareil courant | oui (accès + rafraîchissement) |
| Rafraîchissement de l'appareil courant | accepté |
| Jeton d'accès courant sur `/api/lists` | 200 |

*Suppression de compte :* compte jetable créé, connecté, supprimé (204) — son
jeton de rafraîchissement est ensuite **refusé (401)**.

⚠️ Les jetons d'accès restent des JWT sans état, valables 15 minutes : ils ne
sont pas révocables. La fenêtre résiduelle est donc de 15 minutes, contre
30 jours auparavant. Une liste de révocation serait le seul moyen de la fermer
complètement.

### Le rafraîchissement de session ne fonctionnait pas du tout

Le défaut le plus lourd trouvé le 15 août, et il était invisible.

`RefreshToken.user` est `@ManyToOne(fetch = LAZY)`. `RefreshTokenService.consume()`
révoque le jeton, **commit**, puis renvoie `token.getUser()` — un proxy. Avec
`open-in-view=false`, la session est alors fermée : le `u.getEmail()` de
`/auth/refresh` levait une `LazyInitializationException`, avalée par le
`catch(Exception e)` qui répondait « Refresh token invalide ».

Conséquence : **le rafraîchissement échouait pour tout le monde, à chaque fois —
après avoir consommé le jeton.** Le jeton d'accès vivant 15 minutes, toute
session mourait au bout de 15 minutes sans pouvoir être prolongée, et le client
déconnectait l'utilisateur. C'est la cause principale des déconnexions.

Corrigé par `Hibernate.initialize(user)` dans `consume()`, avant la fermeture de
session.

*Vérifié le 15 août sur la pile locale :* rafraîchissement **accepté** (nouveaux
jetons d'accès et de rafraîchissement délivrés), rejouer l'ancien jeton est
**refusé** (rotation à usage unique préservée), et le nouveau jeton d'accès
ouvre bien `/api/lists` (200).

Preuve du diagnostic, avant correction : la ligne créée en base par le login
ressortait **déjà `revoked = true`** et aucune ligne suivante n'était écrite —
`consume` réussissait, la suite échouait.

⚠️ À noter : c'est le `catch(Exception e)` fourre-tout de `/auth/refresh` qui a
rendu ce défaut invisible en le transformant en 401 plausible. Y ajouter une
trace éviterait le prochain.

### Déconnexion intempestive — corrigée en trois endroits

Une panne serveur, ou même une simple coupure réseau, éjectait l'utilisateur de
sa session. Trois maillons, tous nécessaires :

1. **Serveur — l'erreur était déguisée en 401.** Toute exception sur une route
   authentifiée part vers `/error`, que `anyRequest().authenticated()` refuse :
   la vraie erreur ressortait en **401 « Authentification requise »**, donc
   indiscernable d'une session expirée. `/error` est désormais `permitAll` dans
   `SecurityConfig`. Sans risque de fuite : `server.error.include-message=never`
   et `include-stacktrace=never` sont déjà posés en prod et staging.
2. **Client — le statut était perdu.** `api.js` ne levait qu'un message. Le
   statut HTTP est maintenant porté par l'erreur (`error.status`), sans quoi
   l'appelant ne peut pas distinguer une session expirée d'une panne.
3. **Client — le démarrage déconnectait sur n'importe quelle erreur.**
   `UserContext` faisait `api('/auth/me').catch(() => logout(false))` : **toute**
   erreur, y compris réseau, vidait la session. On ne déconnecte plus que sur un
   vrai 401 ; sinon on repart de la session mémorisée.

*Vérifié le 15 août sur la pile locale :*

| Situation | Avant | Après |
|---|---|---|
| Authentifié, méthode non supportée | 401 | **405**, message « Method Not Allowed », session conservée |
| Sans jeton | 401 | 401 *(inchangé)* |
| Jeton invalide | 401 | 401 + `dt:unauthorized` → déconnexion *(comportement correct préservé)* |
| **Backend arrêté, rechargement** | session vidée | **session conservée**, portail « Mon compte » affiché |

Le contre-test compte autant que le test : une session réellement invalide
déconnecte toujours. La correction distingue les deux cas, elle ne supprime pas
la déconnexion.

### Badge « Commandes » du menu vendeur — filtre corrigé

`SiteRouter.jsx:1402` filtrait sur `["PAID","PROCESSING"]` alors que `PAID`
n'existe pas dans `OrderStatus` : la chaîne était morte et le badge ne comptait
que les `PROCESSING`. Arbitrage du 15 août : **compter aussi les `PENDING`**,
pour que le vendeur voie arriver les commandes avant la confirmation du
paiement. Filtre passé à `["PENDING","PROCESSING"]`.

`PENDING` est bien atteignable sur cet écran : `/seller/orders` expose le statut
du **fulfillment**, et `SellerPortalController:115` crée le fulfillment en
`PENDING` lorsque la commande l'est (`:124` fait primer `CANCELLED`).

⚠️ **Non observable en l'état** : la table `orders` est **vide**, le badge vaut
donc 0 avant comme après. Correction fondée sur la lecture du code, pas sur un
constat à l'écran.
*Vérifier quand des commandes existeront : une commande non payée incrémente le
badge ; elle reste non actionnable (`SellerPortalController:135` renvoie 409
tant que le paiement n'est pas confirmé).*

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

*Rien en attente.* Les trois points qui figuraient ici ont été traités ou
requalifiés le 15 août (voir « fausses pistes » plus haut).

### Priorité moyenne — confort client

*Rien en attente.* Les quatre points de confort client ont été traités le
15 août — voir la section « Fait ».

**Jeu de données local disponible :** la pile locale contient désormais un
parcours complet — 12 commandes dont une payée, expédiée puis livrée, quatre
retours dans des états différents, des notifications, et une boutique validée
pour `seller@test.com`. De quoi vérifier à l'écran ce qui restait aveugle, à
commencer par le badge « Commandes » du menu vendeur.

*Rien en attente.* Les cinq derniers écrans d'administration ont été branchés le
15 août — voir la section « Fait ».

### Sécurité restante

*Rien en attente.* La révocation des jetons a été traitée le 15 août — voir la
section « Fait ».

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

**Des composants écrits mais non branchés.** `App.jsx` est routé dans `AppRoutes`
mais `RoutedSite` intercepte `/` avant et rend `DynamicHome` — c'est donc du code
mort. (`PublicStorePage.jsx` était dans ce cas ; il est branché depuis le
15 août.)

**`RoutedSite` court-circuite `AppRoutes`.** `RoutedSite` (`SiteRouter.jsx:3527`)
aiguille sur `pathname` avant d'atteindre `<Routes>`. Il retombe sur `AppRoutes`
en dernier recours, donc une route ajoutée dans `AppRoutes` est bien atteinte —
sauf si un `if` de `RoutedSite` capte le chemin plus tôt. Vérifier les deux
endroits avant de conclure qu'une route est absente.

**Trois bases distinctes.** Supabase en production via `.env`,
`localhost:5432/djibtout` que le profil `local` utilise par défaut, et
`localhost:55432/djibtout_test` pour les tests. Le profil `local` a
`ddl-auto=update` : **ne jamais le pointer sur Supabase.**

**Lancer le backend avec `backend/start-supabase.cmd`**, jamais `mvnw` seul — le
script charge le `.env` et règle le CORS pour les ports 5173, 5174 et 3000.
