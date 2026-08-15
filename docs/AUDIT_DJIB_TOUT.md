# Audit de code — DJIB TOUT

**Date :** 15 août 2026
**Périmètre :** `backend/` (Spring Boot 3.3.13 / Java 17 / PostgreSQL) et `frontend/` (React 19 + Vite + react-router)
**Volume analysé :** 135 fichiers Java (354 Ko), 30 fichiers JSX (~250 Ko dont `SiteRouter.jsx` = 3 828 lignes), 11 migrations Flyway, configuration Docker/CI.
**Méthode :** lecture intégrale du code source fichier par fichier, croisement des 90 appels API du frontend avec les endpoints backend, relecture des logs d'exécution (`backend-run.out.log`) et des rapports de tests (`target/surefire-reports`).

---

## 0. Synthèse

| Sévérité | Nombre | Signification |
|---|---|---|
| 🔴 Critique | 12 | Exploitable à distance ou casse une fonction métier essentielle |
| 🟠 Élevé | 21 | Fuite de données, erreur 500 en production, perte d'argent |
| 🟡 Moyen | 26 | Bug fonctionnel, dette, performance |
| 🔵 Faible | 18 | Accessibilité, cohérence, code mort |

**Ce qui est bien fait** — il faut le dire d'emblée : mots de passe BCrypt, `@JsonIgnore` sur `password` et les jetons de réinitialisation, refresh tokens hachés en SHA-256 et rotatifs, verrous pessimistes (`findByIdForUpdate`) sur le stock, `@Version` sur `Order`/`Product`/`Wallet`, clé d'idempotence sur la création de commande avec contrainte unique en base, validation de la signature binaire des fichiers uploadés, `open-in-view=false`, migrations Flyway versionnées, en-têtes de sécurité HTTP complets (CSP, HSTS, Referrer-Policy, Permissions-Policy), 76 tests qui passent tous.

**Le problème principal n'est pas la qualité moyenne du code, il est ailleurs :** trois fonctionnalités « de démonstration » sont livrées avec le code de production (réinitialisation de mot de passe qui renvoie le jeton, rechargement de portefeuille gratuit, paiement toujours accepté), et le parcours d'achat se casse à deux endroits précis (commande en espèces annulée automatiquement, statut « livré » qui ne remonte jamais à l'acheteur).

---

# PARTIE 1 — SÉCURITÉ

## 🔴 S-01 — Prise de contrôle de n'importe quel compte via `/api/auth/forgot-password`

`backend/.../controller/AuthController.java:22`

```java
return ResponseEntity.ok(Map.of(
    "message", ...,
    "emailSent", sent,
    "developmentResetToken", u.getPasswordResetToken()));   // ← renvoyé au client
```

L'endpoint est `permitAll`. N'importe qui, sans compte, peut :

1. `POST /api/auth/forgot-password` avec `{"email":"admin@djibtout.local"}`
2. lire `developmentResetToken` dans la réponse HTTP
3. `POST /api/auth/reset-password` avec ce jeton et un nouveau mot de passe

**Résultat : compromission totale de n'importe quel compte, y compris administrateur, en deux requêtes.** C'est la faille la plus grave du projet.

Le champ `emailSent` permet en plus l'énumération des comptes existants (réponse différente si l'email existe).

**Correctif :** supprimer `developmentResetToken` de la réponse. Si un mode dev est nécessaire, le conditionner à `@Profile("local")` **et** ne jamais l'inclure quand `SPRING_PROFILES_ACTIVE` vaut `prod`/`staging`. Uniformiser la réponse (même message, même forme) que le compte existe ou non.

## 🔴 S-02 — Même problème sur l'inscription

`AuthController.java:13` — `developmentVerificationToken` est renvoyé à l'inscription. La vérification d'e-mail devient purement décorative : on peut valider n'importe quelle adresse sans y avoir accès. Note secondaire : la connexion ne vérifie de toute façon jamais `emailVerified`, donc un compte non vérifié a tous les droits.

## 🔴 S-03 — Le rechargement DjibPay crée de l'argent

`backend/.../controller/WalletController.java:11`

```java
@PostMapping("/topup") @Transactional
public WalletView topup(...){ w.setBalance(w.getBalance().add(r.amount)); ... }
```

Aucun paiement réel, aucun plafond : `POST /api/wallet/topup {"amount": 999999999}` crédite le portefeuille. Combiné au paiement `DJIBPAY`, tout acheteur connecté peut commander gratuitement, et le vendeur voit une commande payée.

## 🔴 S-04 — Le paiement mobile est simulé et toujours accepté

`backend/.../controller/PaymentController.java:10`

```java
if(r.phoneNumber.endsWith("000")||r.phoneNumber.endsWith("999")){ ...refusé... }
// sinon : SUCCESS
```

Aucun appel à Waafi/D-Money, aucun webhook, aucune vérification. Toute commande peut être marquée payée. Acceptable en maquette, bloquant en production. À isoler derrière une interface `PaymentGateway` avec une implémentation `Simulated` activée seulement en profil `local`.

## 🔴 S-05 — Écrasement arbitraire de produits (mass assignment)

`backend/.../controller/ProductController.java:92`

```java
@PostMapping public ResponseEntity<?> createProduct(@RequestBody Product product) {
    ...
    product.setSeller(owner);
    Product saved = productService.saveProduct(product);   // save() = merge si id présent
```

L'entité JPA est liée directement au corps de la requête. Un vendeur peut envoyer :

```json
{"id": 42, "name": "…", "price": 1, "stockQuantity": 0}
```

`save()` avec un `id` renseigné fait un **merge** : le produit 42, qui appartient à un autre vendeur, est écrasé et lui est réattribué (`setSeller(owner)`). Même problème sur `version`, `createdAt`, `visible`.

**Correctif :** utiliser un DTO d'entrée (`record ProductInput(...)`) et ne jamais exposer l'entité en `@RequestBody`.

## 🔴 S-06 — Aucune validation sur la création/mise à jour de produit

Même méthode : pas de `@Valid`, pas de `@Positive` sur `price`, pas de `@NotBlank` sur `name`. Conséquences :

- `price: -50000` est accepté → produit à prix négatif → total de commande négatif
- `name` absent → `DataIntegrityViolationException` → **500** au lieu de 400
- `stockQuantity: -10` accepté

## 🔴 S-07 — Contournement du rate limit par en-tête falsifié

`backend/.../security/RateLimitFilter.java:7`

```java
String forwarded=req.getHeader("X-Forwarded-For");
String ip=forwarded==null?req.getRemoteAddr():forwarded.split(",")[0].trim();
```

`X-Forwarded-For` est lu sans vérifier que la requête vient d'un reverse-proxy de confiance. Un attaquant envoie une valeur aléatoire à chaque requête et obtient un rate limit illimité → **bruteforce du formulaire de connexion sans entrave**.

Deux défauts associés :
- la `ConcurrentHashMap windows` n'est **jamais purgée** → fuite mémoire, et vecteur d'OOM en envoyant des millions d'IP différentes ;
- `shouldNotFilter` ne couvre que `/api/auth/` et `/api/upload` exactement — `/api/upload/xxx`, `/api/orders/create`, `/api/coupons/validate/*` ne sont pas limités.

## 🔴 S-08 — Reprise de compte via OAuth2

`backend/.../security/OAuth2LoginSuccessHandler.java:46-64`

```java
if (email == null) { email = oAuth2User.getAttribute("id") + "@" + registrationId + ".com"; }
...
if (userOptional.isPresent()) { user = userOptional.get(); user.setProvider(provider); ... }
```

- Aucun contrôle de `email_verified`. Un compte Facebook avec une adresse non vérifiée correspondant à un compte local existant permet de s'y connecter.
- Le repli `id@facebook.com` est un espace d'adresses qu'un attaquant peut préempter en s'inscrivant en local avec `123456@facebook.com`.

Autres défauts du même fichier :
- **URL de redirection en dur** : `"http://localhost:3000/oauth2/redirect?token=" + jwtToken` (ligne 86) → OAuth2 est **totalement cassé en production**, et le jeton transite en clair dans l'URL (logs serveur, historique, en-tête `Referer`).
- Aucun refresh token n'est émis : une session OAuth meurt au bout de 15 minutes sans possibilité de renouvellement.

## 🟠 S-09 — Fuite des adresses e-mail des clients et des vendeurs sur des endpoints publics

`backend/.../entity/Review.java:22` et `entity/Product.java:55`

```java
@JsonIgnoreProperties({"password", "role", "hibernateLazyInitializer", "handler"})
private User user;   // email, phone, birthDate, deliveryInstructions restent sérialisés
```

`GET /api/products` et `GET /api/products/{id}/reviews` sont `permitAll`. Un scraper anonyme récupère donc pour chaque produit et chaque avis : `email`, `phone`, `birthDate`, `preferredLanguage`, `deliveryInstructions`, `accountDeleted`, `suspended` de l'auteur.

**Correctif :** ne jamais sérialiser d'entité `User` ; exposer une vue `{id, name}`. La liste blanche (`@JsonIgnoreProperties`) est une approche fragile — chaque nouveau champ ajouté à `User` fuite par défaut.

## 🟠 S-10 — Le vendeur reçoit la fiche complète de l'acheteur

`backend/.../controller/OrderController.java:263` (`GET /api/orders/{id}`) et `:236` (`/seller-orders`) renvoient l'entité `Order` brute. `Order.buyer` n'est pas `@JsonIgnore` → le vendeur récupère l'objet `User` complet de l'acheteur (e-mail, téléphone, date de naissance, instructions de livraison).

## 🟠 S-11 — Actuator accessible à tout compte connecté

`application.properties` expose `health,info,prometheus,metrics`, mais `SecurityConfig:67` n'autorise explicitement que `/actuator/health`. Le reste retombe sur `anyRequest().authenticated()` : **n'importe quel acheteur connecté** peut lire `/actuator/prometheus`, `/actuator/metrics` et `/actuator/info` (avec `management.info.env.enabled=true`, ce dernier expose des propriétés d'environnement).

**Correctif :** `.requestMatchers("/actuator/**").hasRole("ADMIN")` ou exposition sur un port de management séparé non routé.

## 🟠 S-12 — Le compte `seller@test.com` / `password` est créé en production

`backend/.../DataSeeder.java` — `@Component` sans `@Profile` ni `@ConditionalOnProperty`. Au premier démarrage sur une base vide (donc en production), le seeder crée un compte SELLER avec le mot de passe `password` et 19 faux produits (téléphones, canapés, pâtes Barilla…).

**Correctif :** `@Profile("local")` sur `DataSeeder`, `CampaignSeeder` et `HomeSectionSeeder`.

## 🟠 S-13 — Verrouillage de compte par un tiers

`backend/.../service/LoginAttemptService.java` est indexé sur l'**e-mail** normalisé, pas sur l'IP. Cinq tentatives ratées sur `victime@x.com` bloquent ce compte jusqu'à 15 minutes, et l'attaquant peut recommencer indéfiniment. Il faut combiner IP + e-mail, et la map n'est ici non plus jamais purgée.

## 🟠 S-14 — Injection de formules dans les exports CSV

`backend/.../controller/SellerPortalController.java:177`

```java
private String csvEscape(String value){return "\""+(value==null?"":value.replace("\"","\"\""))+"\"";}
```

L'échappement CSV est correct, mais pas la protection Excel. Un acheteur saisit comme motif de retour :

```
=cmd|'/c calc'!A1
```

Le vendeur exporte `retours-djibtout.csv`, l'ouvre dans Excel → exécution. Les champs concernés (`reason`, nom de produit, `trackingNumber`) sont tous fournis par des tiers.

**Correctif :** préfixer d'une apostrophe toute valeur commençant par `=`, `+`, `-`, `@`, tabulation ou retour chariot.

## 🟠 S-15 — Cardinalité illimitée sur les métriques Micrometer

`backend/.../controller/TelemetryController.java:44` — `/api/telemetry/errors` est `permitAll` et fait :

```java
registry.counter("djibtout.frontend.errors", "type", input.type()).increment();
```

`input.type()` est une chaîne libre (`@Size(max=80)`). Un attaquant non authentifié envoie 100 000 valeurs distinctes → 100 000 séries temporelles en mémoire → **OOM du backend**. (Le endpoint `web-vitals` est correctement protégé par `@Pattern`, ce qui montre que le problème est connu mais a été oublié ici.)

`POST /api/products/{id}/interactions` est également `permitAll` sans rate limit → inondation de la table `product_interactions`.

## 🟡 S-16 — Jetons en `localStorage`

`frontend/src/lib/api.js:10,19` — `dt.accessToken` et surtout `dt.refreshToken` (30 jours) sont en `localStorage`. Toute XSS = vol de session longue durée. Aucune XSS n'a été trouvée dans le code actuel (pas de `dangerouslySetInnerHTML`), mais la marge d'erreur est nulle.

## 🟡 S-17 — Autres points de sécurité

| Point | Fichier | Détail |
|---|---|---|
| Pas de révocation du jeton d'accès à la déconnexion | `AuthController:17` | Le JWT reste valide 15 min après logout |
| `reset-password` ne révoque pas les sessions | `AuthController:23` | Après compromission + reset, les refresh tokens du pirate restent valides 30 j (le changement de mot de passe, lui, révoque bien — `AccountController:16`) |
| Pas de détection de réutilisation de refresh token | `RefreshTokenService:9` | Un jeton volé et rejoué lève juste une erreur ; la famille de jetons n'est pas invalidée |
| Pas de purge des refresh tokens expirés | `RefreshTokenRepository` | La table croît indéfiniment |
| Énumération d'utilisateurs | `SellerStaffController:9` | « Ce collaborateur doit d'abord créer un compte » révèle l'existence d'une adresse |
| Ajout d'employé sans consentement | `SellerStaffController:9` | Pas de flux d'invitation/acceptation |
| `ddl-auto=update` + Flyway | `application-local.properties` | Hibernate peut modifier le schéma en concurrence de Flyway |
| `baseline-on-migrate=true` | `application.properties` | Risque de sauter des migrations sur une base non vide |
| `type` de document non filtré | `SellerDocumentController` | `@RequestParam String type` libre, sans liste blanche ni limite de longueur |
| Conteneurs Docker en root | `backend/Dockerfile` | Pas de `USER` non privilégié |
| `.env` dans un dossier OneDrive | `.env` | Mot de passe base, secret JWT et mot de passe SMTP réels synchronisés dans le cloud. Correctement ignoré par git (vérifié), mais l'emplacement reste un risque |

---

# PARTIE 2 — BUGS FONCTIONNELS

## 🔴 B-01 — Toute commande payée en espèces est annulée au bout de 15 minutes

`frontend/src/SiteRouter.jsx:3406` (CheckoutV2) :

```js
let ref = "CASH-" + order.orderId;
if (method !== "CASH") { ...paiement... }   // pour CASH : rien
```

`backend/.../OrderController.java:85` : `order.setReservedUntil(now().plusMinutes(15))`, statut `PENDING`.
`backend/.../service/OrderReservationService.java:4` : job `@Scheduled(fixedDelay=60000)` qui passe en `CANCELLED` et relâche le stock toute commande `PENDING` dont `reservedUntil` est dépassé.

**Une commande en espèces reste `PENDING` pour toujours → elle est systématiquement annulée 15 minutes après sa création**, alors que le client a reçu une page de confirmation « SUCCESS » et que le vendeur a été notifié.

C'est le bug fonctionnel le plus grave : le mode de paiement le plus utilisé à Djibouti ne fonctionne pas.

**Correctif :** pour `CASH`, créer un `Payment` en statut `PENDING_ON_DELIVERY`, passer la commande en `PROCESSING` et mettre `reservedUntil = null`.

## 🔴 B-02 — Le statut de la commande ne passe jamais à « livré » côté acheteur

`backend/.../SellerPortalController.java:132-166` : le vendeur met à jour `SellerFulfillment.status`, mais **jamais `Order.status`**. Le commentaire du code reconnaît le problème (« le statut du fulfillment change ici sans toucher celui de la commande ») et ajoute une notification, sans corriger la cause.

Chaîne de conséquences :

1. `Order.status` reste `PROCESSING` indéfiniment.
2. `ReturnController.java:50` exige `order.getStatus() == DELIVERED` → **aucun acheteur ne peut jamais demander un retour**.
3. `OwnershipService.purchasedProduct` s'appuie sur `existsDeliveredPurchase` → **aucun acheteur ne peut jamais publier d'avis** (`ReviewController:89` renvoie 403).
4. L'acheteur voit « En préparation » sur `/orders` pour une commande reçue.

Seul un administrateur, via `PATCH /api/admin/orders/{id}/status`, peut débloquer manuellement chaque commande. Les fonctionnalités « retours » et « avis », entièrement développées des deux côtés, sont donc **inaccessibles en pratique**.

**Correctif :** dans `SellerPortalController.update`, quand tous les `SellerFulfillment` d'une commande atteignent un statut donné, propager ce statut sur `Order`.

## 🔴 B-03 — Le stock des variantes est corrompu à chaque annulation

Trois endroits décrémentent la variante mais recréditent le produit :

| Fichier | Ligne | Décrémente | Recrédite |
|---|---|---|---|
| `OrderController.createOrder` | 116 | `variant.stockQuantity` | — |
| `OrderController.cancelOrder` | 322 | — | `product.stockQuantity` |
| `PaymentController.failed` | 17 | — | `product.stockQuantity` |
| `OrderReservationService.releaseExpired` | 4 | — | `product.stockQuantity` |

Pour une commande d'un article avec variante : la variante perd 1 unité qui n'est **jamais** restituée, et le produit **gagne** 1 unité qui ne lui a jamais été retirée. Chaque cycle commande→annulation crée du stock produit fantôme et détruit du stock variante.

**Correctif :** factoriser une méthode `restituerStock(OrderItem)` qui recrédite la variante si `item.getVariant() != null`, sinon le produit.

## 🔴 B-04 — Le remboursement n'existe pas

`ReturnStatus` déclare `REFUNDED`, l'interface vendeur l'affiche (`SellerSupportPage.jsx:6`), l'interface admin aussi (`AdminOperationsPage.jsx:21`) — mais la machine à états de `ReturnController.java:84` n'autorise que :

```
REQUESTED → APPROVED | REJECTED
APPROVED  → RECEIVED
```

**`REFUNDED` est inatteignable.** Aucun code ne recrédite le portefeuille, ne remet le stock, ni ne crée de contre-écriture de paiement. Un retour accepté et reçu ne rembourse rien.

## 🔴 B-05 — Le frontend en production ne peut pas joindre l'API

`frontend/src/lib/api.js:1` : `import.meta.env.VITE_API_URL || '/api'`.

`.env` définit `NEXT_PUBLIC_API_URL` — un préfixe **Next.js**, alors que le projet est en **Vite**. Vite n'expose que les variables préfixées `VITE_`. La valeur retenue est donc toujours `/api`.

`vite.config.js` définit un proxy `/api` **uniquement sous la clé `server`** — qui n'agit qu'en `vite dev`. Le `Dockerfile` du frontend lance `npm run preview`, qui lit la clé `preview.proxy`, absente.

**En production (Docker/compose), 100 % des appels API partent sur `http://frontend:3000/api` et renvoient l'index HTML.** L'application est entièrement non fonctionnelle une fois déployée.

**Correctif :** renommer en `VITE_API_URL` dans `.env` et dans le CI, et ajouter `preview: { proxy: {...} }` ou servir le `dist/` derrière un nginx qui proxifie `/api`.

## 🟠 B-06 — `GET /api/auth/me` renvoie 500 (observé en production)

`AuthController.java:15` : `users.findByEmail(a.getName())` avec `a` (`Authentication`) nul, puisque `/api/auth/**` est `permitAll`.

Confirmé dans `backend/backend-run.out.log` :

```
NullPointerException: Cannot invoke "org.springframework.security.core.Authentication.getName()"
because "a" is null
    at com.djibtout.backend.controller.AuthController.me
```

Deux occurrences enregistrées. Même défaut sur `/api/auth/sessions` (GET et DELETE), qui sont exposés en `permitAll` alors qu'ils manipulent les sessions de l'utilisateur.

**Correctif :** sortir `/me` et `/sessions` du bloc `permitAll`, ou tester `a == null` et renvoyer 401.

## 🟠 B-07 — Le panier confond les variantes

`frontend/src/context/UserContext.jsx:21`

```js
function updateCart(id,quantity){ setCart(items=>quantity<1
    ? items.filter(x=>x.product.id!==id)
    : items.map(x=>x.product.id===id?{...x,quantity}:x)) }
```

`addToCart` (ligne 20) gère pourtant correctement une clé `${product.id}:${variant.id}`. Mais `updateCart` ne travaille que sur `product.id` :

- modifier la quantité d'une variante modifie **toutes** les variantes du même produit ;
- supprimer une variante supprime **toutes** les variantes du produit.

`SiteRouter.jsx:673` aggrave le problème avec `key={p.id}` sur la boucle du panier → **clés React dupliquées** dès qu'un produit est présent en deux variantes (avertissement console + rendu incohérent).

**Correctif :** faire porter `updateCart` sur `x.key`, et utiliser `key={x.key}` dans le rendu.

## 🟠 B-08 — Erreurs 500 par `LazyInitializationException`

Avec `open-in-view=false`, toute lecture d'une association LAZY après la fermeture de session lève une exception convertie en 500. Endpoints concernés (aucun `@Transactional`, aucun `JOIN FETCH` dans la requête) :

| Endpoint | Fichier:ligne | Association lue hors session |
|---|---|---|
| `GET /api/orders/seller-orders` | `OrderController:225` | `order.items` puis `order.buyer` à la sérialisation |
| `GET /api/admin/returns` | `AdminController:16` | `returnRequest.orderItem.product` |
| `GET /api/seller/orders/export` | `SellerPortalController:169` | `order.items`, `item.product` |
| `GET /api/seller/returns/export` | `SellerPortalController:179` | `r.getOrderItem().getProduct()` |
| `GET /api/seller/analytics/export` | `SellerPortalController:182` | `o.getItems()` |
| `GET /api/seller/dashboard` | `SellerPortalController:54` | `order.getItems()` |
| `GET /api/seller/analytics` | `SellerPortalController:83` | `order.getItems()` |

`OrderRepository.findOrdersBySellerId` fait `JOIN o.items i JOIN i.product p` sans `FETCH` : les collections restent paresseuses.

**Correctif :** `@Transactional(readOnly = true)` sur ces méthodes, ou `JOIN FETCH` dans la requête, ou construction d'une vue DTO (approche déjà appliquée avec succès ailleurs, cf. `OrderController.resume`).

## 🟠 B-09 — La suppression d'un produit renvoie 500

`ProductController.java:156` → `productRepository.deleteById(id)`. La contrainte `order_items.product_id → products.id` n'a pas de `ON DELETE CASCADE` (vérifié dans `V1__baseline_schema.sql`). Dès qu'un produit a été commandé une fois, la suppression lève `DataIntegrityViolationException` → **500**, sans message exploitable pour le vendeur.

**Correctif :** suppression logique (`visible = false` + drapeau `archived`), ou 409 explicite.

## 🟠 B-10 — Le champ « visible » est réinitialisé à chaque mise à jour

`ProductController.java:132`

```java
existingProduct.setVisible(productDetails.isVisible());
```

`Product.isVisible()` renvoie `true` quand le champ est `null` (ligne 171). Une mise à jour partielle qui n'envoie pas `visible` **repasse donc systématiquement le produit en visible** — un produit masqué par l'administrateur redevient public dès que le vendeur modifie son prix.

## 🟠 B-11 — Les avis masqués restent publics

`ReviewController.java:54` → `reviewRepository.findByProductOrderByCreatedAtDesc(product)`. Aucun filtre sur `Review.hidden`. L'écran de modération admin (`AdminController:18`) enregistre bien `hidden = true`, mais **l'avis continue d'être servi sur la fiche produit**. La modération est sans effet. Même problème pour `ProductQuestion.hidden` (`ProductQuestionController:7`).

## 🟠 B-12 — Le job CI ne peut pas passer

`.github/workflows/ci.yml`

- `- run: npm run lint` — `frontend/package.json` ne déclare que `dev`, `build`, `preview`. **Le job `frontend` échoue systématiquement.**
- Le job `docker` construit le frontend avec `context: frontend`, alors que `frontend/Dockerfile` fait `COPY frontend/package*.json ./` (il attend la racine du dépôt comme contexte, ce que fait correctement `docker-compose.yml`). **Le job `docker` échoue aussi.**
- Les variables injectées sont `NEXT_PUBLIC_*` alors que le build est Vite — sans effet.

## 🟠 B-13 — Course sur les coupons et absence de limite par utilisateur

`OrderController.java:131-141` : `coupon.isUsable()` puis `usedCount + 1`, sans verrou ni contrainte. Deux commandes simultanées passent toutes les deux le contrôle → le plafond `usageLimit` est dépassable.

Plus grave fonctionnellement : **aucune limite par utilisateur**. Le même acheteur peut utiliser le même coupon sur autant de commandes qu'il veut (jusqu'au plafond global). Et le compteur n'est **pas décrémenté** quand la commande est annulée ou expire.

## 🟠 B-14 — Double débit possible du portefeuille

`PaymentController.java:10` lit `wallets.findByUser(u)` sans verrou pessimiste. Deux requêtes `/payments/process` concurrentes lisent le même solde et le débitent chacune. Le `@Version` sur `Wallet` limite les dégâts, mais produit une `ObjectOptimisticLockingFailureException` non gérée → **500** au lieu d'un message métier.

Même absence de verrou sur `Order` : le contrôle `status != PENDING` n'est pas atomique.

## 🟠 B-15 — Le vendeur peut se payer lui-même

`SellerSettlementController.java:7` génère un `SellerSettlement` dès qu'un `SellerFulfillment` passe en `DELIVERED` — statut que **le vendeur lui-même** déclare (`SellerPortalController:132`). Le règlement naît directement en `AVAILABLE` (`SellerSettlement.java:4`), sans période de rétention. Le vendeur peut donc créer une commande fictive, la marquer livrée et demander immédiatement un retrait.

De plus, `POST /seller/settlements/withdrawals` reçoit `method` et `account` mais **ne les persiste nulle part** : la demande de retrait est enregistrée sans coordonnées de paiement. L'administrateur n'a aucun moyen de savoir où verser.

## 🟠 B-16 — L'import CSV/XLSX échoue en bloc dès qu'une ligne est rejetée

`SellerPortalController.java:190` — la méthode est `@Transactional`, et chaque ligne fautive est capturée dans un `try/catch` puis ajoutée à `errors`. Mais si l'exception vient de `products.save()` (contrainte base), la transaction est marquée *rollback-only* : la réponse `{imported: 480, rejected: 20}` est construite, puis le commit lève `UnexpectedRollbackException` → **500, et aucun produit importé**.

**Correctif :** valider chaque ligne avant `save()`, ou traiter chaque ligne dans sa propre transaction (`REQUIRES_NEW`).

## 🟡 B-17 — Course sur le rafraîchissement du jeton

`frontend/src/lib/api.js:18-27` — sans verrou d'unicité. Au chargement d'une page qui lance 5 appels en parallèle, si le jeton a expiré, **5 rafraîchissements partent simultanément**. Comme `RefreshTokenService.consume` fait de la rotation (le jeton est révoqué à la consommation), les 4 derniers échouent → `dt:unauthorized` → **déconnexion intempestive**.

**Correctif :** mémoriser la promesse de rafraîchissement en cours et la partager.

## 🟡 B-18 — `crypto.randomUUID()` sur le chemin critique

`SiteRouter.jsx:3385` — `crypto.randomUUID` n'existe **que** en contexte sécurisé (HTTPS ou localhost) et à partir de Safari 15.4. En HTTP simple ou sur un navigateur ancien, `submit()` lève `TypeError` → **la commande ne part jamais**, avec un message d'erreur incompréhensible.

De plus, la clé est régénérée à chaque clic : après une erreur réseau, un second clic crée **une deuxième commande** — l'idempotence côté serveur est donc inutilisable telle quelle.

## 🟡 B-19 — Autres bugs fonctionnels

| # | Fichier:ligne | Problème |
|---|---|---|
| B-19a | `AuthController:13` | `findByEmail(r.email)` teste la casse brute mais enregistre `toLowerCase()` → deux inscriptions avec `A@x.com` puis `a@X.com` passent le contrôle et provoquent une violation de contrainte unique (500) |
| B-19b | `OrderController:266` | Message « Seul un vendeur ou un admin peut modifier le statut » alors que le code n'autorise **que** l'admin |
| B-19c | `OrderController:288` | Aucune machine à états : l'admin peut faire revenir une commande `DELIVERED` à `PENDING`, et passer à `CANCELLED` **sans restituer le stock** |
| B-19d | `OrderController:317` | L'annulation est permise en `PROCESSING` (donc payée) sans aucun remboursement |
| B-19e | `OrderController:297` | `cancelOrder` n'est pas `@Transactional` : la boucle de restitution de stock n'est pas atomique |
| B-19f | `ReturnController:53` | La quantité retournable n'est comparée qu'aux retours **ouverts** : après un retour clôturé de 2 unités sur 3, on peut en redemander 3 |
| B-19g | `ProductController:72` | `/my-products` filtre sur `user.getId()` : un employé `CATALOG_MANAGER` voit une liste **vide** alors qu'il peut créer des produits pour le compte du propriétaire |
| B-19h | `ProductQuestionController:8` | `/products/{productId}/questions/mine` ignore `productId` — le frontend appelle d'ailleurs `/products/0/questions/mine` (`SiteRouter.jsx:1583`) |
| B-19i | `SiteRouter.jsx:3031` | `ReturnButton.send()` sans `try/catch` : un 409 « retour déjà ouvert » produit une *unhandled rejection* silencieuse, aucun message |
| B-19j | `SiteRouter.jsx:3031` | La quantité retournée est figée à `1`, impossible de retourner 2 unités sur 3 |
| B-19k | `SiteRouter.jsx:1226` | `SellerProtected` : `api("/seller/store").then(setStore).finally(...)` sans `.catch` → si l'API est en panne, le vendeur voit l'écran d'onboarding au lieu d'une erreur |
| B-19l | `ProductDetailPage.jsx:2` | Aucun `.catch` sur les 5 appels API : un produit inexistant laisse « Chargement du produit… » **à l'infini** (pas de 404) |
| B-19m | `WalletController:8` | Création du portefeuille dans un `GET` sans transaction : deux requêtes concurrentes créent deux portefeuilles → violation de contrainte unique |
| B-19n | `SellerPortalController:73` | Idem pour `GET /seller/store` : écriture dans une lecture |
| B-19o | `AdminController:25` | `POST /admin/coupons` sans `@Valid` : `code` nul → NPE 500 ; `discountValue` négatif accepté |
| B-19p | `PaymentController:11` | `transactionId` = 8 caractères d'UUID sur une colonne `unique` → collision possible → 500 |
| B-19q | `Address.java` | Sérialisation asymétrique : la lecture renvoie `default`, l'écriture attend `isDefault` |
| B-19r | `SavedListController:30` | Aucun plafond sur le nombre de produits par liste, et les doublons sont acceptés |
| B-19s | `ReviewController:99` | Aucune contrainte d'unicité : un acheteur peut publier autant d'avis qu'il veut sur le même produit → manipulation de la note |

---

# PARTIE 3 — FRONTEND : PAGES, BOUTONS ET LIENS

## Architecture du routage — 🟠 problème structurel

`SiteRouter.jsx:3757` — `RoutedSite` est un aiguilleur manuel par `if (pathname === ...)` **posé au-dessus** d'un `<Routes>` react-router (`AppRoutes`, ligne 3595). Les deux systèmes coexistent et se contredisent.

Conséquence directe : **six composants complets ne sont jamais rendus** (code mort), parce que `RoutedSite` intercepte leur chemin avant `AppRoutes` :

| Composant mort | Ligne | Intercepté par |
|---|---|---|
| `HomePage` | route 3598 | `RoutedSite` → `DynamicHome` |
| `ProductDetail` | 519 | `RoutedSite` → `ProductDetailPage.jsx` |
| `Checkout` | 725 | `RoutedSite` → `CheckoutV2` |
| `Auth kind="forgot"` (×2) | 3608-3609 | `RoutedSite` → `ForgotPassword` / `ResetPassword` |
| `App.jsx` entier (12 Ko) | — | `main.jsx` rend `SiteRouter`, jamais `App` |

Autre conséquence : aucune page 404 sur les chemins interceptés. `/seller/nimportequoi` affiche la maquette générique `PortalContent` au lieu d'un 404.

## Pages entièrement fictives — 🟠

`PortalContent` (ligne 2592), `GenericManagement` (2753), `AddressCards` (2780), `StoreForm` (2804) affichent des **données inventées en dur** :

```
"Bonjour, Djib Electronics 👋" · "Bonjour, Ayan 👋"
"187 500 FDJ · Chiffre d'affaires"   "12 482 Utilisateurs"   "2,8 M FDJ Volume du jour"
"+4,2 % ce mois"     tableau "#DT-2026-1048"     adresses "Ayan Mohamed, Rue de Genève"
```

Ces écrans ne sont plus atteignables depuis la navigation (toutes les entrées de `sellerNav`/`adminNav` sont mappées vers de vrais composants), mais ils restent dans le bundle et s'affichent dès qu'une URL sort du chemin balisé — y compris `/seller/` avec une barre oblique finale.

`App.jsx` contient la même chose à une autre échelle : ventes flash statiques, compte à rebours figé « 04:19:52 », « Plus de 12 000 commandes livrées », marques et boutiques fictives.

## Inventaire des boutons et liens morts

| # | Fichier:ligne | Élément | Comportement |
|---|---|---|---|
| L-01 | `SiteRouter.jsx:268` | `<a>Livraison</a>` (pied de page) | **Aucun `href`** — lien mort |
| L-02 | `SiteRouter.jsx:269` | `<a>Nous contacter</a>` (pied de page) | **Aucun `href`** — lien mort |
| L-03 | `SiteRouter.jsx:1491` | `<input placeholder="Rechercher…" />` (en-tête des 3 portails) | Ni `value`, ni `onChange`, ni formulaire — **champ de recherche décoratif** |
| L-04 | `SiteRouter.jsx:1485` | Cloche de notification, portail **admin** | `to="#"` → navigue vers `/#`, page inchangée |
| L-05 | `SiteRouter.jsx:2721` | Bouton « Exporter » de `PageTitle` | Aucun `onClick` — visible sur **toutes** les pages du compte acheteur |
| L-06 | `SiteRouter.jsx:2610-2611` | « Rechercher un produit… » + « + Nouveau produit » | Sans handler (maquette) |
| L-07 | `SiteRouter.jsx:2704` | « Ajouter un produit », « Voir les commandes », « Répondre aux clients », « Mettre à jour la boutique » | 4 boutons « Actions rapides » sans `onClick` |
| L-08 | `SiteRouter.jsx:2757-2763` | Recherche, filtre statut, « + Ajouter » de `GenericManagement` | Sans handler |
| L-09 | `SiteRouter.jsx:2797,2801` | « Modifier » / « + Ajouter une adresse » de `AddressCards` | Sans handler |
| L-10 | `SiteRouter.jsx:684` | « Supprimer » du panier | `<a onClick>` **sans `href`** — non focalisable, inutilisable au clavier |
| L-11 | `SiteRouter.jsx:405,608` | Cœur « favoris » | `.catch(e => alert(e.message))` — `window.alert` natif |
| L-12 | `App.jsx:11` | Formulaire newsletter | `window.alert('Merci ! Votre inscription a bien été prise en compte.')` — **rien n'est envoyé nulle part** |
| L-13 | `App.jsx:21` | Handler global de clic sur tous les `<a>` sans `href` | Détourne le clic et fait `window.location.href` selon le **texte** de l'élément (`destinationFor`) — rechargement complet, et casse dès qu'un libellé change |
| L-14 | `App.jsx:25` | Toutes les cartes produit | `href={'/product/' + id}` avec `id = 1` par défaut → **toutes pointent vers `/product/1`** |
| L-15 | `App.jsx:25` | Icône « Ajouter aux favoris » | Lien vers `/account/favorites` — n'ajoute rien |
| L-16 | `App.jsx:24` | « Effacer l'historique » | Lien vers `/search` — n'efface rien |
| L-17 | `SiteRouter.jsx` | Pied de page « Conditions générales · Confidentialité · Cookies » | Texte brut, pas de lien — obligation légale non remplie |

## Autres constats frontend

- **Fiche produit sans avis ni questions.** `ProductDetailPage.jsx` affiche « ★★★★★ · N avis » mais ne charge jamais `/api/products/{id}/reviews` ni `/questions`. La note en étoiles est **codée en dur à 5 étoiles pleines** quelle que soit la valeur réelle. Les composants `ReviewButton`/`QuestionsPanel` existent mais vivent ailleurs.
- **Rupture de charte.** `ProductDetailPage` a son propre en-tête minimal et **aucun pied de page**, contrairement à toutes les autres pages qui passent par `<Shop>`.
- **Aucun état de chargement** dans `UserAccountContent` : les écrans apparaissent vides avant de se remplir.
- **Page blanche sur clé inconnue** : `/account/xyz` rend le titre « Mon compte » et `null` (`SiteRouter.jsx:1660`).
- **Gestion d'erreurs très inégale** : 68 appels `api()` dans `SiteRouter.jsx` pour 24 `.catch`. `ProductDetailPage.jsx` (5 appels / 0 catch), `AccountDeletionPage.jsx`, `SellerAuth.jsx`, `MediaUploader.jsx` n'en ont aucun.
- **SEO/accessibilité** : `index.html` sans `meta description`, sans favicon, sans balises Open Graph ; aucun `<title>` dynamique par page ; pas de `ErrorBoundary` React.
- **`npm run preview` en production** (`frontend/Dockerfile`) — la documentation Vite indique explicitement que ce serveur n'est pas destiné à la production. De plus, le healthcheck interroge `/health`, route qui n'existe pas → conteneur marqué *unhealthy* en permanence.

---

# PARTIE 4 — PERFORMANCE ET BASE DE DONNÉES

| # | Sévérité | Constat |
|---|---|---|
| P-01 | 🟠 | **Aucun index applicatif.** `V1__baseline_schema.sql` ne crée que 4 index (sur `product_interactions`, `product_questions`, `refresh_tokens`). PostgreSQL **n'indexe pas automatiquement les clés étrangères** : `orders.buyer_id`, `order_items.order_id`, `order_items.product_id`, `products.seller_id`, `products.category`, `reviews.product_id`, `favorites.user_id` sont tous à parcourir en séquentiel |
| P-02 | 🟠 | `Product.averageRating` et `reviewCount` sont des `@Formula` avec sous-requête corrélée : **2 sous-requêtes par produit** sur chaque listing paginé |
| P-03 | 🟠 | `searchProducts` ajoute une **troisième** sous-requête corrélée quand `minRating` est fourni |
| P-04 | 🟠 | `Product.images` est `@ElementCollection(fetch = EAGER)` → **N+1 systématique** sur toutes les listes de produits |
| P-05 | 🟠 | Aucune pagination sur `/api/admin/users`, `/admin/products`, `/admin/orders`, `/admin/returns`, `/admin/audit-logs`, `/seller/orders`, `/seller/returns`, `/seller/questions`, `/seller/reviews`, `/api/addresses`, `/api/notifications`. `orders.findAll()` charge toute la table en mémoire |
| P-06 | 🟡 | `SellerPortalController.sellerOrders` fait une requête `findByOrderAndSeller` **par commande** dans une boucle |
| P-07 | 🟡 | `SavedListController.view` appelle `products.findAllById` **par liste** dans un `.map()` |
| P-08 | 🟡 | `ValidatedSellerFilter` déclenche 2 requêtes SQL sur **chaque** requête `/api/seller/**` |
| P-09 | 🟡 | `ProductRepository.findBestSellers` : `GROUP BY i.product` avec une `@ElementCollection` EAGER — comportement fragile sous PostgreSQL strict |
| P-10 | 🟡 | Rate limit et compteur de tentatives en mémoire locale → inopérants dès la deuxième instance |
| P-11 | 🔵 | Aucun réglage de pool de connexions, ni `hibernate.jdbc.batch_size` |

---

# PARTIE 5 — PLAN D'ACTION

## Avant toute mise en ligne — bloquant

1. **S-01/S-02** — Retirer `developmentResetToken` et `developmentVerificationToken` des réponses HTTP. *(2 lignes)*
2. **S-12** — `@Profile("local")` sur `DataSeeder`, `CampaignSeeder`, `HomeSectionSeeder`. *(3 annotations)*
3. **S-03** — Désactiver `/api/wallet/topup` hors profil `local`.
4. **S-04** — Isoler le paiement derrière une interface, implémentation simulée limitée au profil `local`.
5. **B-05** — `VITE_API_URL` + proxy `preview` (ou nginx). Sans cela, rien ne marche en production.
6. **B-01** — Traiter le cas `CASH` dans `CheckoutV2` et `OrderController`.
7. **B-02** — Propager le statut du `SellerFulfillment` sur `Order`. Débloque retours **et** avis.
8. **S-05/S-06** — DTO d'entrée + `@Valid` sur `ProductController`.
9. **S-11** — `/actuator/**` réservé à `ADMIN`.
10. **S-08** — Rendre l'URL de redirection OAuth2 configurable et vérifier `email_verified`.

## Sous deux semaines

11. **B-03** — Factoriser la restitution de stock (variante *ou* produit).
12. **B-08** — `@Transactional(readOnly=true)` sur les 7 endpoints listés.
13. **S-09/S-10** — Remplacer toutes les sérialisations d'entités `User` par des vues DTO.
14. **S-07** — Rate limit fondé sur `RemoteAddr` (ou XFF avec proxies de confiance) + purge périodique de la map.
15. **B-06** — Sortir `/auth/me` et `/auth/sessions` de `permitAll`.
16. **B-07** — `updateCart` sur `x.key` + `key={x.key}`.
17. **B-12** — Corriger `ci.yml` (script `lint` ou suppression, contexte Docker à la racine).
18. **S-14** — Neutraliser les formules dans les exports CSV.
19. **B-04** — Implémenter le flux de remboursement, ou retirer `REFUNDED` des interfaces.
20. **B-09/B-10** — Suppression logique des produits ; ne pas écraser `visible` en mise à jour partielle.

## Dette à planifier

21. Découper `SiteRouter.jsx` (3 828 lignes) et **supprimer l'aiguilleur manuel `RoutedSite`** au profit de `<Routes>` seul.
22. Supprimer `App.jsx` et les 4 composants morts.
23. Supprimer `PortalContent`, `GenericManagement`, `AddressCards`, `StoreForm` (maquettes).
24. Traiter les 17 boutons et liens morts.
25. Ajouter les index de base (P-01) et paginer les listes admin/vendeur.
26. Ajouter des tests frontend (**il n'y en a aucun**) et étendre la couverture backend au-delà des 76 tests actuels.
27. Migrer jjwt 0.11.5 → 0.12.x (API dépréciée).
28. Homogénéiser la gestion d'erreurs : `ApiExceptionHandler` ne traite que 2 exceptions ; ajouter `NoSuchElementException` → 404, `DataIntegrityViolationException` → 409, `MaxUploadSizeExceededException` → 413, `OptimisticLockException` → 409.

---

## Annexe — état des tests

```
76 tests, 0 échec, 0 erreur   (15 classes, target/surefire-reports)
```

Tous passent. Mais aucun ne couvre les bugs listés ci-dessus : pas de test sur le parcours espèces (B-01), sur la propagation du statut de livraison (B-02), sur le stock des variantes (B-03), ni sur `/auth/me` sans jeton (B-06, pourtant présent dans les logs d'exécution). **Aucun test frontend n'existe.**
