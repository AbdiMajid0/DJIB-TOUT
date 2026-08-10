# Conversation et état du projet DJIB TOUT

Dernière mise à jour : 10 août 2026

## Demande actuelle

L’objectif est de terminer le projet point par point, sans annoncer un point comme terminé tant que ses interfaces, son backend et ses tests ne sont pas réellement finalisés.

## État vérifié

- Le frontend Next.js compile avec succès et contient 43 routes.
- Le backend Spring Boot compile et son test de démarrage réussit.
- Le projet est avancé, mais il n’est pas encore prêt pour la production.
- Estimation actuelle : environ 70 à 80 % d’un MVP fonctionnel.

## Point 12 — Espace vendeur terminé le 10 août 2026

- Interface de médias multiples livrée : upload groupé, aperçus, suppression et réorganisation.
- Corriger la modification d’un produit afin de conserver toutes ses images.
- Ajouter les images propres aux variantes.
- Terminer la gestion vidéo dans les formulaires produit.
- Exports commandes, retours, statistiques et règlements disponibles dans `/seller/exports`.
- Ajouter les boutons de téléchargement dans l’espace vendeur.
- Onboarding vendeur livré : documents, coordonnées professionnelles, conditions et suivi de validation.
- Notifications automatiques livrées pour commandes, retours, questions, avis et stocks faibles.
- Journal d’audit branché sur les mises à jour de boutique, expéditions et retours.
- Connecter les versements Waafi/D-Money lorsque les accès marchand seront disponibles.

## Point 13 — Administration terminée le 10 août 2026

- Interface de gestion des catégories, sous-catégories et attributs disponible dans `/admin/categories`.
- Gestion des commandes, retours et remboursements disponible dans `/admin/operations`.
- Modération des avis et questions disponible dans `/admin/moderation`.
- Gestion des coupons disponible dans `/admin/coupons`.
- Suspension et réactivation complètes des boutiques vendeurs.
- Journal d’audit consultable dans `/admin/audit`.
- Gestion des rôles et permissions administratives.
- Tests des actions administratives.

## Sécurité avant production

- Déplacer les secrets OAuth, JWT et PostgreSQL vers des variables d’environnement.
- Renouveler les clés déjà présentes dans la configuration locale.
- Remplacer la création automatique du compte administrateur par une procédure sécurisée.
- Remplacer `spring.jpa.hibernate.ddl-auto=update` par des migrations Flyway ou Liquibase.
- Désactiver l’affichage des requêtes SQL en production.

## Tests et livraison

- Ajouter des tests unitaires et des tests d’intégration API.
- Tester les autorisations client, vendeur, employé vendeur et administrateur.
- Ajouter des tests end-to-end des parcours principaux.
- Préparer les configurations de développement et de production.
- Finaliser HTTPS, stockage des médias, sauvegardes PostgreSQL, supervision et documentation.

## Point 14 — Architecture backend et préparation production

- Configurations `local` et `prod` séparées.
- Secrets JWT, OAuth et PostgreSQL externalisés.
- Flyway installé et première migration versionnée appliquée.
- Hibernate limité à la validation du schéma en production.
- Format JSON commun pour les erreurs de validation.
- Bootstrap administrateur désactivé par défaut.
- Docker Compose utilise des variables obligatoires, un healthcheck PostgreSQL et des politiques de redémarrage.
- Documentation d’exploitation ajoutée dans le `README.md` racine.

## Ordre de travail convenu

1. Terminer entièrement le point 12.
2. Terminer entièrement le point 13.
3. Traiter le point 14 comme une phase complète.
4. Sécuriser la configuration.
5. Ajouter les tests complets.
6. Préparer et valider le déploiement.

## Derniers échanges

- L’utilisateur a demandé ce qu’il restait pour terminer le projet et a demandé de revoir la conversation précédente.
- L’historique de la tâche « Analyser le projet » a été consulté.
- Les builds frontend et backend ont été relancés et réussissent.
- L’utilisateur a ensuite demandé d’ouvrir le projet dans VS Code.
- Le dossier `DJIB TOUT` a été ouvert dans VS Code.
- Le présent fichier a été créé pour rendre le suivi de la conversation accessible directement dans VS Code.

## Point 18 — Tests et stabilisation (travail partiel du 10 août 2026)

- 13 tests backend automatisés passent sans échec.
- Authentification, validation, jetons JWT et protection des API administratives testées.
- Autorisations administrateur, acheteur et vendeur testées sur les opérations sensibles.
- Parcours de retours testé : accès anonyme, séparation entre vendeurs et transitions invalides.
- Routes principales frontend et API contrôlées par tests de fumée.
- Bug d’hydratation du compteur panier corrigé dans l’en-tête.
- Bug de sérialisation de `/api/admin/orders` corrigé avec une réponse DTO sécurisée.
- Build backend et build frontend validés.

## Point 15 — Sécurité (travail du 10 août 2026)

- Secret JWT obligatoire depuis l’environnement en production, longueur minimale contrôlée et durée de l’access token ramenée à 15 minutes.
- Access tokens et refresh tokens typés séparément ; un refresh token est refusé comme bearer token.
- Refresh tokens persistés uniquement sous forme de hash, tournés après chaque usage et révocables à la déconnexion.
- CORS limité à la liste de domaines configurée et aux headers nécessaires.
- CSRF activé pour les parcours navigateur/OAuth et explicitement ignoré pour l’API stateless utilisant le header Authorization.
- Écritures produit et uploads réservés aux vendeurs et administrateurs.
- Uploads contrôlés par MIME, extension, signature et taille, puis renommés avec UUID.
- Stockage objet S3-compatible obligatoire dans le profil de production ; stockage disque conservé uniquement en local.
- Rate limiting sur authentification et uploads, avec blocage progressif par compte après échecs de connexion.
- Headers CSP, HSTS, Referrer-Policy, Permissions-Policy, anti-sniffing et anti-framing sur backend et frontend.
- Contrôles de propriété présents sur commandes, paiements et favoris ; service de propriété ajouté et avis réservés aux achats livrés.
- Connexion, rotation et déconnexion ajoutées au journal d’audit sans mot de passe, JWT ou donnée de paiement.
- Révocation des anciens secrets documentée mais à effectuer manuellement dans les consoles Google/Facebook, PostgreSQL et du fournisseur de stockage.

## Prochaine phase

- Terminer les opérations externes du point 15 : révoquer réellement les anciens secrets et renseigner les nouveaux identifiants S3/OAuth.
- Point 16 : SEO, accessibilité et internationalisation.
- Ensuite : déploiement, HTTPS, stockage médias externe, sauvegardes et supervision.

## Point 16 — SEO, accessibilité et internationalisation (en cours)

- Métadonnées globales et dynamiques, canonical, Open Graph, Twitter Cards et données structurées produit/fil d’Ariane ajoutés.
- `robots.txt` et `sitemap.xml` dynamiques disponibles.
- URLs produit lisibles au format `/product/{id}-{slug}` ; anciennes URLs et slugs périmés redirigés définitivement vers l’URL canonique.
- Lien d’évitement vers le contenu principal et focus clavier visible ajoutés.
- Ordre des titres de l’accueil corrigé : un seul H1 et titres du carrousel en H2.
- Carrousel amélioré pour les technologies d’assistance et les diapositives inactives.
- Respect global de `prefers-reduced-motion` ajouté.
- Socle français, arabe et anglais ajouté avec formats centralisés pour monnaie, dates et nombres.
- Sélecteur de langue et bascule RTL fonctionnels.
- Build Next.js validé avec 51 routes, dont `robots.txt` et `sitemap.xml`.
- Audit lint initial effectué : le projet comporte encore un passif de règles React/JSX à corriger avant de déclarer le point terminé.
- Les fichiers publics principaux du point 16 passent désormais ESLint sans erreur ni avertissement.
- Audit du DOM rendu validé sur l’accueil : un H1, aucune image sans attribut `alt`, aucun contrôle sans nom accessible et lien d’évitement présent.
- Fiche produit validée : un H1, canonical correct, deux blocs JSON-LD, aucune image sans `alt` et titre dynamique correct.
- Nettoyage ESLint achevé sur les espaces admin, vendeur, compte, authentification, panier, paiement, commandes et catalogue : aucune erreur restante (trois avertissements de redirection centralisée seulement).
- Ancienne vitrine vendeur rendue compatible avec les règles React modernes ; les animations d’apparition ne lisent plus les refs pendant le rendu.
- Images de connexion, zoom et galerie plein écran migrées vers `next/image` avec dimensions, tailles et textes alternatifs.
- Build de production revalidé après le nettoyage : TypeScript et génération des 51 routes réussis.
- Le sélecteur de langue pilote désormais un état global réactif : l’en-tête, le panier, le compte, la recherche et leurs libellés accessibles se traduisent immédiatement en français, arabe ou anglais.
- Validation dans le navigateur : arabe en `lang="ar"`/`dir="rtl"`, anglais et français en `dir="ltr"`, avec libellés de navigation traduits.
- Le lien d’évitement est maintenant traduit dans la langue active.

## Point 17 — Performance et exploitation (en cours)

- Health checks Docker ajoutés pour PostgreSQL, le backend et le frontend, avec démarrage du frontend conditionné par la disponibilité du backend.
- Spring Boot Actuator et Micrometer Prometheus ajoutés : readiness, liveness, métriques HTTP et métriques backend exposées.
- Logs backend structurés en JSON sur la sortie standard pour staging et production.
- Profil Spring `staging` ajouté et séparation développement/staging/production documentée.
- Volume PostgreSQL persistant conservé ; procédures PowerShell de sauvegarde et restauration PostgreSQL ajoutées avec documentation d’exploitation.
- Pipeline GitHub Actions ajouté : lint et build frontend, tests backend, puis construction des deux images Docker uniquement après succès.
- Validation locale réussie : 15 tests backend, lint frontend sans erreur, build des 51 routes et configuration Docker Compose valides.
- Collecte RUM des Core Web Vitals ajoutée avec objectifs LCP ≤ 2,5 s, INP ≤ 200 ms et CLS ≤ 0,1 au 75e percentile.
- Monitoring des erreurs JavaScript ajouté sans transmettre message libre, query string, JWT ou donnée utilisateur.
- Métriques frontend agrégées dans Micrometer/Prometheus et erreurs journalisées de façon structurée.
- Cache CDN ajouté pour le catalogue public, les produits et les médias versionnés, avec `stale-while-revalidate`.
- Après ces ajouts, les 15 tests backend et le build frontend de 51 routes restent validés.
