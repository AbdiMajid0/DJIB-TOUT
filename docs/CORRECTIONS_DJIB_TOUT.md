# DJIB TOUT — Liste complète des corrections

Tous les points relevés, quelle que soit leur gravité, classés par catégorie.
Légende : 🔴 bloquant · 🟠 important · 🟡 à planifier · 🔵 confort / dette

- **SÉCURITÉ** — 49 points
- **BACKEND** — 38 points
- **FRONTEND** — 34 points
- **BUGS** — 41 points
- **TESTS** — 16 points

**Total : 178 points.**

**Avancement au 17 août 2026 — 46 points corrigés, 132 restants.**
Les cases cochées ont été appliquées, compilées et poussées. Cinq points marqués ⏳
sont entamés sans être clos. La connexion OAuth2 est désormais désactivée
par défaut (`app.oauth2.enabled`) : aucun écran de retour n'existe côté navigateur. Un défaut absent de cet inventaire a été trouvé pendant
les corrections et réglé au passage : `SellerDocument.content` portait `@Lob` alors que
la migration V9 crée une colonne `bytea` — l'application ne démarrait dans aucun profil
en `ddl-auto=validate` (test, staging, production).

---

# 🔐 SÉCURITÉ

### Authentification et comptes

- [x] 🔴 **SEC-01** `AuthController:22` — `/auth/forgot-password` renvoie `developmentResetToken` dans la réponse HTTP → prise de contrôle de n'importe quel compte, admin compris. Supprimer le champ.
- [x] 🔴 **SEC-02** `AuthController:13` — `/auth/register` renvoie `developmentVerificationToken` → la vérification d'e-mail est contournable. Supprimer le champ.
- [x] 🟠 **SEC-03** `AuthController:22` — `emailSent` diffère selon que le compte existe → énumération d'utilisateurs. Uniformiser la réponse.
- [ ] 🟠 **SEC-04** `AuthController:14` — la connexion ne vérifie jamais `emailVerified`. Décider : bloquer, ou restreindre les actions.
- [ ] 🟠 **SEC-05** `AuthController:17` — le logout ne révoque pas le jeton d'accès (valide encore 15 min). Prévoir une liste de révocation par `jti`.
- [x] 🟠 **SEC-06** `AuthController:23` — `/reset-password` ne révoque pas les sessions existantes. Ajouter `refreshTokens.revokeAll(u)` (déjà fait dans `AccountController:16`).
- [x] 🟠 **SEC-07** `SecurityConfig:65` — `/api/auth/**` en `permitAll` inclut `/me`, `/sessions` (GET/DELETE). Les sortir du bloc public.
- [ ] 🟠 **SEC-08** `RefreshTokenService:9` — pas de détection de réutilisation : un jeton volé rejoué n'invalide pas la famille. Révoquer toute la chaîne.
- [ ] 🟡 **SEC-09** `RefreshTokenRepository` — aucune purge des jetons expirés, la table croît indéfiniment. Ajouter un job planifié.
- [ ] 🟡 **SEC-10** `AuthController:13` — `role` accepté depuis le corps de la requête d'inscription (SELLER en libre-service). Documenter ou passer par une demande validée.
- [ ] 🟡 **SEC-11** `AuthController:21` — les jetons de vérification d'e-mail n'expirent jamais.
- [ ] 🟡 **SEC-12** `JwtUtil.java` — jjwt 0.11.5, API dépréciée (`parserBuilder`, `setClaims`). Migrer en 0.12.x.
- [ ] 🟡 **SEC-13** `JwtAuthenticationFilter:47` — `loadUserByUsername` peut lever `UsernameNotFoundException` (compte supprimé/suspendu) non capturée → 500 au lieu de 401.

### Limitation de débit et déni de service

- [x] 🔴 **SEC-14** `RateLimitFilter:7` — `X-Forwarded-For` accepté sans proxy de confiance → rate limit contournable, bruteforce du login libre. — *atténué : nginx réécrit `X-Forwarded-For`. Le filtre lui-même reste à durcir.*
- [ ] 🟠 **SEC-15** `RateLimitFilter:5` — la `ConcurrentHashMap windows` n'est jamais purgée → fuite mémoire / OOM par IP forgées.
- [ ] 🟠 **SEC-16** `RateLimitFilter:6` — ne couvre que `/api/auth/` et `/api/upload` exact. Étendre à `/api/orders/create`, `/api/coupons/validate/*`, `/api/upload/**`, `/api/telemetry/**`.
- [ ] 🟠 **SEC-17** `LoginAttemptService:6` — verrouillage indexé sur l'e-mail seul → un tiers peut bloquer n'importe quel compte. Combiner IP + e-mail.
- [ ] 🟠 **SEC-18** `LoginAttemptService:4` — map jamais purgée (même fuite mémoire).
- [ ] 🟠 **SEC-19** `TelemetryController:44` — `input.type()` (chaîne libre) utilisé comme tag Micrometer sur un endpoint public → explosion de cardinalité, OOM. Ajouter un `@Pattern` comme sur `web-vitals`.
- [ ] 🟠 **SEC-20** `ProductInteractionController:17` — `POST /products/{id}/interactions` public et sans limite → inondation de la table.
- [ ] 🟡 **SEC-21** `CouponController:6` — `/coupons/validate/{code}` sans limite de débit → énumération des codes promo.
- [ ] 🟡 **SEC-22** Rate limit et compteur de tentatives en mémoire locale → inopérants dès la 2ᵉ instance. Passer sur Redis.

### Autorisations et exposition de données

- [x] 🔴 **SEC-23** `ProductController:92` — `@RequestBody Product` : un `id` fourni fait un `merge` → écrasement du produit d'un autre vendeur. Passer par un DTO.
- [x] 🔴 **SEC-24** `ProductController:92,104` — aucun `@Valid`, aucun `@Positive` : prix négatif, stock négatif, `name` nul acceptés.
- [x] 🔴 **SEC-25** `application.properties` + `SecurityConfig:67` — `/actuator/prometheus|metrics|info` accessibles à tout compte connecté. Réserver à ADMIN ou port séparé.
- [x] 🟠 **SEC-26** `application.properties` — `management.info.env.enabled=true` expose des propriétés d'environnement. — *`management.info.env.enabled=false`.*
- [x] 🟠 **SEC-27** `Review.java:22` — `@JsonIgnoreProperties` n'exclut que `password`/`role` : **e-mail, téléphone, date de naissance** de l'auteur exposés sur `/api/products/{id}/reviews` (public).
- [x] 🟠 **SEC-28** `Product.java:55` — idem pour `seller` : e-mails de vendeurs exposés sur `/api/products` (public).
- [x] 🟠 **SEC-29** `OrderController:263,236` — `Order.buyer` non ignoré : le vendeur reçoit la fiche complète de l'acheteur.
- [ ] 🟠 **SEC-30** Principe général — remplacer toute sérialisation d'entité JPA par une vue DTO. La liste noire (`@JsonIgnoreProperties`) fait fuiter chaque nouveau champ par défaut. — ⏳ *partiel : listes blanches `@JsonIncludeProperties` sur 9 entités. Le passage en DTO reste entier.*
- [ ] 🟠 **SEC-31** `SellerStaffController:9` — « Ce collaborateur doit d'abord créer un compte » révèle l'existence d'une adresse.
- [ ] 🟠 **SEC-32** `SellerStaffController:9` — un employé est ajouté sans consentement ni invitation.
- [ ] 🟡 **SEC-33** `SellerDocumentController` — `@RequestParam String type` libre : pas de liste blanche, pas de limite de longueur.
- [ ] 🟡 **SEC-34** `SellerSettlementController:10` — endpoint admin (`/admin/{id}/paid`) placé sous `/api/seller/**`. Le contrôle de rôle est correct, mais le chemin est trompeur.
- [ ] 🟡 **SEC-35** `SellerNotificationController:2` — `seller()` exclut ADMIN, contrairement aux autres contrôleurs. Incohérence de politique.

### OAuth2

- [x] 🔴 **SEC-36** `OAuth2LoginSuccessHandler:86` — URL de redirection en dur `http://localhost:3000/...` → OAuth2 cassé en production. Rendre configurable. — *URL de retour issue de `app.frontend-url`, validee au demarrage.*
- [x] 🔴 **SEC-37** `OAuth2LoginSuccessHandler:57` — aucun contrôle de `email_verified` : reprise d'un compte local via un e-mail Facebook non vérifié. — *`email_verified` exige. Facebook ne le rend pas : ce fournisseur reste donc inutilisable en l'etat.*
- [x] 🟠 **SEC-38** `OAuth2LoginSuccessHandler:48` — repli `id@provider.com` préemptable par inscription locale. — *repli supprime : sans adresse rendue par le fournisseur, la connexion est refusee.*
- [ ] 🟠 **SEC-39** `OAuth2LoginSuccessHandler:86` — jeton transmis dans l'URL (logs, historique, `Referer`). Utiliser un code d'échange à usage unique. — ⏳ *partiel : le jeton est passe du parametre de requete au fragment (#), donc hors des journaux serveur et de l'en-tete `Referer`. Le code a usage unique reste a faire, avec l'ecran de retour.*
- [ ] 🟡 **SEC-40** `OAuth2LoginSuccessHandler` — aucun refresh token émis : session morte au bout de 15 min sans renouvellement possible. — ⏳ *ouvert volontairement : emettre un jeton de rafraichissement dans l'URL aggraverait SEC-39. A traiter avec l'ecran de retour.*

### Configuration et déploiement

- [x] 🔴 **SEC-41** `DataSeeder.java` — aucun `@Profile` : crée `seller@test.com` / `password` et 19 faux produits **en production**. Ajouter `@Profile("local")` (idem `CampaignSeeder`, `HomeSectionSeeder`).
- [x] 🔴 **SEC-42** `WalletController:11` — `/wallet/topup` crédite sans paiement. Désactiver hors profil `local`.
- [x] 🔴 **SEC-43** `PaymentController:10` — paiement simulé, toujours accepté. Isoler derrière une interface `PaymentGateway`.
- [x] 🟠 **SEC-44** `application-prod.properties` — `app.cors.allowed-origins` non redéfini : repli sur les origines localhost si la variable d'env manque.
- [ ] 🟠 **SEC-45** `application-local.properties` — `ddl-auto=update` en parallèle de Flyway. Passer à `validate`.
- [ ] 🟠 **SEC-46** `application.properties` — `spring.flyway.baseline-on-migrate=true` : risque de sauter des migrations sur une base non vide.
- [ ] 🟠 **SEC-47** `.env` — mot de passe base, secret JWT et mot de passe SMTP réels dans un dossier **OneDrive synchronisé**. Correctement ignoré par git (vérifié), mais à déplacer hors du cloud.
- [ ] 🟡 **SEC-48** `backend/Dockerfile`, `frontend/Dockerfile` — conteneurs exécutés en root. Ajouter un `USER` non privilégié.
- [ ] 🟡 **SEC-49** `SellerPortalController:236` — `WorkbookFactory.create` sur un fichier non fiable (zip bomb, entités XML). Appliquer `IOUtils.setByteArrayMaxOverride` et un plafond de décompression.

---

# ⚙️ BACKEND

### Robustesse et gestion d'erreurs

- [x] 🟠 **BE-01** `ApiExceptionHandler:3` — ne traite que 2 exceptions. Ajouter : `NoSuchElementException` → 404, `DataIntegrityViolationException` → 409, `MaxUploadSizeExceededException` → 413, `ObjectOptimisticLockingFailureException` → 409, `HttpMessageNotReadableException` → 400, `AccessDeniedException` → 403, fallback `Exception` → 500 sans détail.
- [x] 🟠 **BE-02** `ApiExceptionHandler:3` — `IllegalArgumentException` renvoie `e.getMessage()` brut : peut divulguer des détails internes.
- [ ] 🟠 **BE-03** Nombreux `.orElseThrow()` sans argument (`AuthController:14,15,18,19,20`, `WalletController:8`, `RefreshTokenService:9`) → 500 au lieu de 401/404.
- [ ] 🟠 **BE-04** `@Transactional` manquant : `OrderController.cancelOrder:297`, `OrderController.getSellerOrders:225`, `AdminController.returns:16`, les 4 exports CSV de `SellerPortalController`, `SellerPortalController.dashboard:54` et `.analytics:83`. — ⏳ *partiel : `getSellerOrders` et 6 méthodes de `SellerPortalController`. `cancelOrder` reste sans transaction.*
- [ ] 🟡 **BE-05** `ProductVariantController` — `create`, `update`, `delete` sans `@Transactional`.
- [ ] 🟡 **BE-06** Écritures dans des méthodes `GET` : `WalletController:8` (crée le portefeuille), `SellerPortalController:73` (crée la boutique), `SellerSettlementController:7` (crée les règlements).

### Modèle de données et logique métier

- [ ] 🟠 **BE-07** Aucune machine à états pour `OrderStatus` : l'admin peut faire revenir `DELIVERED` → `PENDING`, ou passer à `CANCELLED` sans restituer le stock.
- [ ] 🟠 **BE-08** `ProductController:156` — suppression physique impossible dès qu'un produit a été commandé (FK `order_items`). Passer en suppression logique.
- [ ] 🟠 **BE-09** `OrderController:135` — `divide(new BigDecimal("100"))` sans `RoundingMode` ni échelle : arrondi monétaire non maîtrisé sur les colonnes `DECIMAL(10,2)`.
- [ ] 🟠 **BE-10** `OrderController:100` — verrous `findByIdForUpdate` pris dans l'ordre d'envoi du client → risque d'interblocage entre deux commandes croisées. Trier les identifiants avant.
- [ ] 🟠 **BE-11** `OrderController:100` — aucune vérification que le produit est `visible`, que le vendeur n'est pas suspendu, ni que sa boutique est validée.
- [ ] 🟡 **BE-12** `OrderItemRequest:357` — `@Positive` sans borne haute : quantité arbitraire.
- [ ] 🟡 **BE-13** `SellerSettlementController:7` — taux de commission `0.10` en dur. Externaliser en configuration.
- [ ] 🟡 **BE-14** `OrderController:142` — frais de livraison (3000 / 1500 / seuil 50000) en dur, dupliqués dans le frontend. — ⏳ *partiel : constante `LIVRAISON` côté frontend. Les valeurs restent en dur dans `OrderController`.*
- [ ] 🟡 **BE-15** `PaymentController:11` — `transactionId` sur 8 caractères d'UUID, colonne `unique` → collision possible → 500.
- [x] 🟡 **BE-16** `PaymentController:9` — `r.paymentMethod` accepté sans liste blanche : une commande peut être marquée payée avec la méthode « FOO ».
- [ ] 🟡 **BE-17** `Coupon.java` — pas de montant minimum de commande, pas de plafond de remise, pas de limite par utilisateur.
- [ ] 🟡 **BE-18** `ReturnStatus` — `REFUNDED` déclaré mais inatteignable : aucun service de remboursement (portefeuille, stock, contre-écriture de paiement).
- [ ] 🔵 **BE-19** `Address.java` — `isDefault()` sérialisé en `default` mais reçu en `isDefault` : API asymétrique.
- [ ] 🔵 **BE-20** `SellerStore.java` — `logoUrl`, `bannerUrl`, `identityDocumentUrl`, `registrationNumber` sans `@Size` ni `@Column(length=…)` → dépassement de colonne → 500.

### Performance et base de données

- [ ] 🟠 **BE-21** `V1__baseline_schema.sql` — seulement 4 index créés. PostgreSQL n'indexe pas les clés étrangères : ajouter `orders.buyer_id`, `order_items.order_id`, `order_items.product_id`, `products.seller_id`, `products.category`, `products.brand`, `reviews.product_id`, `reviews.user_id`, `favorites.user_id`, `return_requests.buyer_id`, `return_requests.seller_id`, `payments.order_id`.
- [ ] 🟠 **BE-22** `Product.java:24-25` — `averageRating` et `reviewCount` en `@Formula` : 2 sous-requêtes corrélées par produit sur chaque listing.
- [ ] 🟠 **BE-23** `ProductRepository.searchProducts` — 3ᵉ sous-requête corrélée quand `minRating` est fourni.
- [ ] 🟠 **BE-24** `Product.java:45` — `@ElementCollection(fetch = EAGER)` sur `images` → N+1 sur toutes les listes.
- [ ] 🟠 **BE-25** Aucune pagination : `/admin/users`, `/admin/products`, `/admin/orders`, `/admin/returns`, `/admin/reviews`, `/admin/questions`, `/admin/coupons`, `/admin/seller-stores`, `/admin/audit-logs`, `/seller/orders`, `/seller/returns`, `/seller/questions`, `/seller/reviews`, `/seller/notifications`, `/api/addresses`, `/api/notifications`, `/api/lists`, `/api/favorites/ids`, `/api/wallet/transactions`.
- [ ] 🟡 **BE-26** `SellerPortalController:114` — `findByOrderAndSeller` appelé dans une boucle sur chaque commande.
- [ ] 🟡 **BE-27** `SavedListController:17` — `products.findAllById` appelé par liste dans un `.map()`.
- [ ] 🟡 **BE-28** `ValidatedSellerFilter:6` — 2 requêtes SQL sur chaque appel `/api/seller/**`. Mettre en cache le statut de validation dans le JWT ou un cache court.
- [ ] 🟡 **BE-29** `ProductRepository.findBestSellers` — `GROUP BY i.product` avec une collection EAGER : comportement fragile sous PostgreSQL strict.
- [ ] 🟡 **BE-30** `OrderRepository.findOrdersBySellerId` — `JOIN` sans `FETCH` : les collections restent paresseuses (cause des 500 listés en BUG-08).
- [ ] 🔵 **BE-31** `application.properties` — aucun réglage de pool HikariCP ni de `hibernate.jdbc.batch_size`.
- [ ] 🔵 **BE-32** `OrderReservationService:4` — job planifié sans verrou distribué : double exécution en multi-instance (ShedLock).

### Infrastructure

- [x] 🟠 **BE-33** `.github/workflows/ci.yml` — le job `backend` lance `./mvnw verify` sans service PostgreSQL, alors que `application-test.properties` exige une base sur le port 55432. Ajouter un `services: postgres`.
- [x] 🟠 **BE-34** `.github/workflows/ci.yml` — le job `docker` construit le frontend avec `context: frontend`, alors que `frontend/Dockerfile` fait `COPY frontend/…` (contexte racine attendu). Job en échec.
- [x] 🟠 **BE-35** `frontend/Dockerfile` — `npm run preview` n'est pas un serveur de production (documentation Vite). Servir `dist/` derrière nginx.
- [x] 🟠 **BE-36** `frontend/Dockerfile` — le healthcheck interroge `/health`, route inexistante → conteneur `unhealthy` en permanence.
- [ ] 🟡 **BE-37** `docker-compose.yml` — aucun service de base : dépendance implicite à Supabase, non documentée pour un démarrage local.
- [ ] 🔵 **BE-38** `AuditLog` — journalisation partielle : les actions produits, coupons et campagnes ne sont pas tracées.

---

# 🖥️ FRONTEND

### Configuration et build

- [x] 🔴 **FE-01** `.env` + `lib/api.js:1` — `NEXT_PUBLIC_API_URL` (préfixe Next.js) sur un projet **Vite** : la variable est ignorée, `API_URL` retombe sur `/api`. Renommer en `VITE_API_URL`.
- [x] 🔴 **FE-02** `vite.config.js:7` — proxy `/api` déclaré sous `server` uniquement (dev). `npm run preview` lit `preview.proxy`, absent → **aucun appel API n'aboutit en production**. — *résolu par la topologie même origine derrière nginx : plus de proxy Vite en production.*
- [x] 🟠 **FE-03** `package.json` — le CI lance `npm run lint`, script **inexistant**. Ajouter ESLint ou retirer l'étape.
- [ ] 🟠 **FE-04** `package.json` — toutes les dépendances en `"latest"` (react, vite, react-router-dom, lucide-react, typescript). Builds non reproductibles. Épingler les versions.
- [ ] 🔵 **FE-05** `package.json` — `typescript` déclaré en dépendance de production alors qu'aucun `.ts` n'existe.

### Architecture

- [ ] 🟠 **FE-06** `SiteRouter.jsx:3757` — `RoutedSite` est un aiguilleur manuel `if (pathname === …)` posé au-dessus de `<Routes>`. Les deux systèmes se contredisent. Tout ramener à react-router.
- [ ] 🟠 **FE-07** `SiteRouter.jsx` — 3 828 lignes dans un seul fichier. Découper par domaine.
- [ ] 🟠 **FE-08** Code mort — jamais rendus car interceptés par `RoutedSite` : `HomePage` (3598), `ProductDetail` (519), `Checkout` (725), `Auth kind="forgot"` (3608, 3609).
- [ ] 🟠 **FE-09** `App.jsx` — 12 Ko jamais montés (`main.jsx` rend `SiteRouter`). Supprimer le fichier.
- [ ] 🟠 **FE-10** `SiteRouter.jsx:2592,2753,2780,2804` — `PortalContent`, `GenericManagement`, `AddressCards`, `StoreForm` : maquettes avec données inventées (« Bonjour, Ayan 👋 », « 12 482 Utilisateurs », « 187 500 FDJ »). Supprimer.
- [ ] 🟡 **FE-11** Aucun `NotFound` sur les chemins interceptés : `/seller/nimportequoi` affiche la maquette générique.
- [ ] 🟡 **FE-12** `SiteRouter.jsx:1660` — clé de compte inconnue (`/account/xyz`) → contenu `null`, page blanche.
- [ ] 🟡 **FE-13** Aucun `ErrorBoundary` React : une exception de rendu vide toute la page.

### Boutons et liens morts

- [x] 🟠 **FE-14** `SiteRouter.jsx:268` — `<a>Livraison</a>` sans `href` (pied de page).
- [x] 🟠 **FE-15** `SiteRouter.jsx:269` — `<a>Nous contacter</a>` sans `href` (pied de page).
- [ ] 🟠 **FE-16** `SiteRouter.jsx:1491` — champ « Rechercher… » de l'en-tête des 3 portails : ni `value`, ni `onChange`, ni formulaire.
- [ ] 🟠 **FE-17** `SiteRouter.jsx:1485` — cloche de notification du portail **admin** : `to="#"`.
- [ ] 🟠 **FE-18** `SiteRouter.jsx:2721` — bouton « Exporter » de `PageTitle` sans `onClick`, affiché sur **toutes** les pages du compte acheteur.
- [ ] 🟡 **FE-19** `SiteRouter.jsx:2610-2611` — « Rechercher un produit… » et « + Nouveau produit » sans handler.
- [ ] 🟡 **FE-20** `SiteRouter.jsx:2704` — 4 boutons « Actions rapides » sans `onClick`.
- [ ] 🟡 **FE-21** `SiteRouter.jsx:2757-2763` — recherche, filtre statut et « + Ajouter » de `GenericManagement` sans handler.
- [ ] 🟡 **FE-22** `SiteRouter.jsx:2797,2801` — « Modifier » et « + Ajouter une adresse » de `AddressCards` sans handler.
- [ ] 🟡 **FE-23** `App.jsx:11` — formulaire newsletter : `window.alert('Merci !')`, rien n'est envoyé.
- [ ] 🟡 **FE-24** `App.jsx:21` — handler global qui intercepte tous les `<a>` sans `href` et redirige selon le **texte** de l'élément. Rechargement complet, casse au moindre changement de libellé.
- [ ] 🟡 **FE-25** `App.jsx:25` — toutes les cartes produit pointent vers `/product/1` (`id` par défaut).
- [ ] 🟡 **FE-26** `App.jsx:25` — icône « Ajouter aux favoris » = simple lien vers `/account/favorites`.
- [ ] 🟡 **FE-27** `App.jsx:24` — « Effacer l'historique » = lien vers `/search`, n'efface rien.
- [x] 🟡 **FE-28** Pied de page — « Conditions générales · Confidentialité · Cookies » en texte brut, sans lien ni page. Obligation légale non remplie.

### Qualité d'expérience

- [ ] 🟠 **FE-29** 68 appels `api()` dans `SiteRouter.jsx` pour 24 `.catch`. Sans aucune gestion d'erreur : `ProductDetailPage.jsx` (5/0), `AccountDeletionPage.jsx`, `SellerAuth.jsx`, `MediaUploader.jsx`, `SecureDocumentUpload.jsx`, `SellerExportsPage.jsx`.
- [ ] 🟠 **FE-30** `ProductDetailPage.jsx` — n'affiche **ni avis ni questions**, alors que les deux endpoints existent. La note en étoiles est codée en dur à `★★★★★`.
- [ ] 🟡 **FE-31** `ProductDetailPage.jsx` — en-tête propre et **aucun pied de page** : rupture de charte avec le reste du site (`<Shop>`).
- [ ] 🟡 **FE-32** `UserAccountContent` — aucun état de chargement : les écrans s'affichent vides avant remplissage.
- [x] 🟡 **FE-33** `SiteRouter.jsx:684` — « Supprimer » du panier en `<a onClick>` sans `href` : non focalisable au clavier. Idem pour plusieurs actions. Utiliser `<button>`.
- [ ] 🟡 **FE-34** `index.html` — aucune `meta description`, aucun favicon, aucune balise Open Graph, aucun `<title>` par page.

---

# 🐛 BUGS

### Parcours d'achat

- [x] 🔴 **BUG-01** `SiteRouter.jsx:3406` + `OrderController:85` + `OrderReservationService:4` — **toute commande en espèces est annulée 15 minutes après sa création** : `CASH` ne crée aucun paiement, la commande reste `PENDING`, le job de libération de stock l'annule. Le client a pourtant vu « SUCCESS ».
- [x] 🔴 **BUG-02** `SellerPortalController:132-166` — le vendeur met à jour `SellerFulfillment.status` mais jamais `Order.status`. Conséquences : l'acheteur voit « En préparation » à vie, **aucun retour possible** (`ReturnController:50` exige `DELIVERED`), **aucun avis possible** (`ReviewController:89`).
- [ ] 🔴 **BUG-03** Stock des variantes corrompu : `OrderController:116` décrémente la variante, mais `OrderController:322`, `PaymentController:17` et `OrderReservationService:4` recréditent le **produit**. Chaque annulation crée du stock produit fantôme et détruit du stock variante.
- [ ] 🔴 **BUG-04** `ReturnController:84` — la machine à états s'arrête à `RECEIVED`. `REFUNDED` est inatteignable : **aucun remboursement n'est jamais effectué**, alors que les 3 interfaces l'affichent.
- [ ] 🟠 **BUG-05** `SiteRouter.jsx:3385` — `crypto.randomUUID()` n'existe qu'en contexte sécurisé (HTTPS/localhost) et depuis Safari 15.4. En HTTP simple, `submit()` lève `TypeError` → la commande ne part pas.
- [ ] 🟠 **BUG-06** `SiteRouter.jsx:3385` — la clé d'idempotence est régénérée à chaque clic : un second essai après erreur crée **une deuxième commande**.
- [ ] 🟠 **BUG-07** `OrderController:317` — l'annulation est autorisée en `PROCESSING` (commande déjà payée) sans aucun remboursement.
- [ ] 🟡 **BUG-08** `SiteRouter.jsx:3438` — le panier n'est pas vidé quand le paiement échoue, alors que la commande a été annulée côté serveur.
- [ ] 🟡 **BUG-09** `Cart:696` — quand `stockQuantity` vaut 0, le `<select>` propose quand même « 1 » et la commande part.

### Panier et variantes

- [x] 🟠 **BUG-10** `UserContext.jsx:21` — `updateCart` filtre sur `product.id` alors que `addToCart` utilise une clé `id:variantId`. Modifier une variante modifie **toutes** les variantes ; en supprimer une les supprime **toutes**.
- [x] 🟠 **BUG-11** `SiteRouter.jsx:673` — `key={p.id}` sur la boucle du panier → clés React dupliquées dès qu'un produit est présent en deux variantes.
- [x] 🟡 **BUG-12** `SiteRouter.jsx:673` — le panier n'affiche jamais quelle variante a été choisie.

### Erreurs 500

- [x] 🟠 **BUG-13** `AuthController:15` — `GET /api/auth/me` sans jeton : `NullPointerException` sur `a.getName()`. **Observé deux fois dans `backend-run.out.log`.**
- [x] 🟠 **BUG-14** `AuthController:18,19,20` — même NPE sur `/auth/sessions` (GET et DELETE), exposés en `permitAll`.
- [ ] 🟠 **BUG-15** `LazyInitializationException` → 500 sur 7 endpoints (`open-in-view=false`, ni `@Transactional` ni `JOIN FETCH`) : `/orders/seller-orders`, `/admin/returns`, `/seller/orders/export`, `/seller/returns/export`, `/seller/analytics/export`, `/seller/dashboard`, `/seller/analytics`. — ⏳ *partiel : quelques endpoints annotés. Les 7 cas n'ont pas été repris un à un.*
- [ ] 🟠 **BUG-16** `ProductController:156` — suppression d'un produit déjà commandé : `DataIntegrityViolationException` → 500 sans message exploitable.
- [ ] 🟠 **BUG-17** `AuthController:13` — `findByEmail(r.email)` teste la casse brute mais enregistre en minuscules : `A@x.com` puis `a@X.com` passent le contrôle → violation de contrainte unique → 500.
- [ ] 🟠 **BUG-18** `PaymentController:10` — pas de verrou pessimiste sur `Wallet` : deux paiements concurrents lèvent `ObjectOptimisticLockingFailureException` non gérée → 500.
- [ ] 🟡 **BUG-19** `WalletController:8` — création du portefeuille dans un `GET` sans transaction : deux requêtes concurrentes → violation de contrainte unique → 500.
- [ ] 🟡 **BUG-20** `AdminController:25` — `POST /admin/coupons` sans `@Valid` : `code` nul → NPE → 500.
- [ ] 🟡 **BUG-21** `SellerPortalController:190` — import CSV/XLSX : la méthode est `@Transactional` et les erreurs de ligne sont capturées, mais une exception venant de `save()` marque la transaction *rollback-only* → `UnexpectedRollbackException` au commit → **500 et zéro produit importé**.

### Logique métier

- [x] 🟠 **BUG-22** `ProductController:132` — `setVisible(productDetails.isVisible())` : `isVisible()` renvoie `true` quand la valeur est nulle → **une mise à jour partielle repasse toujours le produit en visible**, y compris un produit masqué par l'admin.
- [x] 🟠 **BUG-23** `ReviewController:54` — aucun filtre sur `Review.hidden` : les avis masqués par la modération restent servis publiquement.
- [x] 🟠 **BUG-24** `ProductQuestionController:7` — même problème pour `ProductQuestion.hidden`.
- [ ] 🟠 **BUG-25** `OrderController:131-141` — course sur les coupons : `isUsable()` puis `usedCount+1` sans verrou → plafond dépassable.
- [ ] 🟠 **BUG-26** `OrderController:131` — aucune limite par utilisateur : le même acheteur peut réutiliser un coupon indéfiniment.
- [ ] 🟠 **BUG-27** `OrderController:139` — `usedCount` jamais décrémenté quand la commande est annulée ou expire.
- [ ] 🟠 **BUG-28** `SellerSettlementController:7` — le règlement naît en `AVAILABLE` dès que le vendeur déclare lui-même « livré » : il peut se payer sur une commande fictive, sans période de rétention.
- [ ] 🟠 **BUG-29** `SellerSettlementController:9` — `method` et `account` de la demande de retrait ne sont **persistés nulle part** : l'admin ne sait pas où verser.
- [ ] 🟠 **BUG-30** `ReviewController:99` — aucune contrainte d'unicité : un acheteur peut publier un nombre illimité d'avis sur le même produit.
- [ ] 🟡 **BUG-31** `ReturnController:53` — la quantité retournable n'est comparée qu'aux retours **ouverts** : après un retour clôturé de 2 unités sur 3, on peut en redemander 3.
- [ ] 🟡 **BUG-32** `OrderController:266` — message « Seul un vendeur ou un admin peut modifier le statut » alors que le code n'autorise que l'admin.
- [ ] 🟡 **BUG-33** `OrderController:288` — l'admin peut passer une commande en `CANCELLED` **sans restituer le stock**.
- [ ] 🟡 **BUG-34** `ProductController:72` — `/my-products` filtre sur `user.getId()` : un employé `CATALOG_MANAGER` voit une liste vide alors qu'il peut créer des produits.
- [ ] 🟡 **BUG-35** `ProductQuestionController:8` — `/products/{productId}/questions/mine` ignore `productId`. Le frontend appelle d'ailleurs `/products/0/questions/mine`.
- [ ] 🟡 **BUG-36** `SavedListController:30` — aucun plafond de produits par liste, doublons acceptés.

### Frontend — erreurs silencieuses

- [ ] 🟠 **BUG-37** `lib/api.js:18-27` — pas de verrou sur le rafraîchissement : 5 appels parallèles en 401 déclenchent 5 rafraîchissements ; la rotation invalide les 4 derniers → **déconnexion intempestive**.
- [ ] 🟠 **BUG-38** `SiteRouter.jsx:3031` — `ReturnButton.send()` sans `try/catch` : un 409 « retour déjà ouvert » produit une *unhandled rejection* silencieuse, sans aucun message.
- [ ] 🟠 **BUG-39** `ProductDetailPage.jsx:2` — aucun `.catch` : un produit inexistant laisse « Chargement du produit… » **à l'infini**, sans 404.
- [ ] 🟡 **BUG-40** `SiteRouter.jsx:1226` — `SellerProtected` : `.then(setStore).finally(...)` sans `.catch` → si l'API est en panne, le vendeur voit l'écran d'onboarding au lieu d'une erreur.
- [ ] 🟡 **BUG-41** `SiteRouter.jsx:3031` — la quantité retournée est figée à `1` : impossible de retourner 2 unités sur 3.

---

# 🧪 TESTS

État actuel : **76 tests backend, tous au vert. Zéro test frontend.**

### Couverture manquante — régressions déjà présentes

- [ ] 🔴 **TST-01** Aucun test ne vérifie que `/auth/forgot-password` **ne renvoie pas** le jeton de réinitialisation (SEC-01).
- [ ] 🔴 **TST-02** Aucun test du parcours de paiement en espèces (BUG-01).
- [ ] 🔴 **TST-03** Aucun test de propagation du statut de livraison vendeur → commande (BUG-02).
- [ ] 🔴 **TST-04** Aucun test de restitution de stock sur une commande **avec variante** (BUG-03).
- [ ] 🟠 **TST-05** Aucun test sur `/auth/me` sans jeton — le NPE est pourtant présent dans les logs d'exécution (BUG-13).
- [ ] 🟠 **TST-06** Aucun test de sérialisation JSON vérifiant qu'aucun endpoint public ne renvoie d'adresse e-mail (SEC-27, SEC-28, SEC-29).
- [ ] 🟠 **TST-07** Aucun test d'autorisation systématique (IDOR) : pour chaque ressource, vérifier qu'un utilisateur A ne peut pas lire/modifier celle de B.
- [ ] 🟠 **TST-08** Aucun test des endpoints exports CSV / dashboard / analytics — précisément ceux qui lèvent une `LazyInitializationException` (BUG-15).

### Outillage

- [x] 🟠 **TST-09** **Aucun test frontend.** Mettre en place Vitest + Testing Library. Priorités : panier avec variantes, `CheckoutV2`, `lib/api.js` (rafraîchissement concurrent). — *Vitest en place, 17 tests sur `lib/panier.js`. Testing Library et les autres écrans restent à faire.*
- [ ] 🟠 **TST-10** Aucun ESLint configuré, alors que le CI appelle `npm run lint`. — ⏳ *partiel : `npm run lint` retiré du CI. ESLint n'est toujours pas installé.*
- [x] 🟠 **TST-11** `ci.yml` — le job backend n'a pas de service PostgreSQL alors que `application-test.properties` en exige un.
- [ ] 🟡 **TST-12** Aucune mesure de couverture (JaCoCo) ni seuil minimal.
- [ ] 🟡 **TST-13** Aucune analyse de dépendances vulnérables (OWASP Dependency-Check / `npm audit` en CI).
- [ ] 🟡 **TST-14** Aucune analyse statique (SpotBugs, SonarQube).
- [ ] 🟡 **TST-15** Un seul test de concurrence (`OrderStockConcurrencyTests`). Ajouter : double paiement de portefeuille (BUG-18), coupon en course (BUG-25), création de portefeuille concurrente (BUG-19).
- [ ] 🔵 **TST-16** Aucun test de bout en bout du parcours complet (inscription → commande → paiement → expédition → livraison → retour → remboursement). `BuyerJourneyIntegrationTests` ne contient qu'un seul test.

---

## Ordre de traitement conseillé

**Semaine 1 — bloquant avant mise en ligne**
SEC-01, SEC-02, SEC-41, SEC-42, SEC-43, FE-01, FE-02, BUG-01, BUG-02, SEC-23, SEC-24, SEC-25, SEC-36

**Semaine 2 — corrections structurantes**
BUG-03, BUG-04, BUG-13, BUG-15, BUG-22, BUG-23, SEC-14, SEC-27 à SEC-30, BUG-10, BE-33, BE-34, SEC-14

**Semaine 3-4 — fiabilité**
BE-01 à BE-06, BUG-16 à BUG-21, BUG-25 à BUG-30, BE-21, BE-25, TST-01 à TST-08

**Ensuite — dette**
FE-06 à FE-13 (architecture du routage), FE-14 à FE-28 (boutons et liens morts), BE-22 à BE-32 (performance), TST-09 à TST-16 (outillage)
