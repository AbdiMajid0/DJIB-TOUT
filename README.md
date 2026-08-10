# DJIB TOUT

Marketplace composée d’un frontend Next.js, d’une API Spring Boot et de PostgreSQL.

## Développement local

Prérequis : Java 17+, Node.js 20+ et PostgreSQL 15+.

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

```powershell
cd frontend
npm ci
npm run dev
```

Le profil `local` est sélectionné par défaut. Il utilise `localhost:5432/djibtout`, le port API `8082` et un secret JWT réservé au développement.

## Production avec Docker

1. Copier `.env.example` vers `.env`.
2. Remplacer obligatoirement `POSTGRES_PASSWORD` et `JWT_SECRET`.
3. Configurer les domaines CORS et API.
4. Configurer le stockage objet S3-compatible avec un bucket privé en écriture et une URL média publique/CDN.
5. Lancer `docker compose up --build -d`.

Le profil `prod` refuse de démarrer sans les variables de base de données et le secret JWT. Hibernate valide le schéma sans le modifier. Flyway applique les migrations versionnées.

## Sécurité

- Les secrets OAuth, JWT et PostgreSQL ne doivent jamais être commités.
- La clé Google précédemment exposée doit être révoquée et remplacée dans la console Google.
- Révoquer également les anciens secrets Facebook, PostgreSQL, JWT et stockage objet depuis leurs consoles respectives. Une modification du fichier `.env` ne révoque pas un secret déjà divulgué.
- Générer `JWT_SECRET` avec un générateur cryptographique (au moins 32 octets aléatoires) et conserver la même valeur entre les redémarrages d’une même période de rotation.
- Après rotation de `JWT_SECRET`, tous les access tokens deviennent invalides. Purger aussi la table `refresh_tokens` lors d’une rotation d’urgence.
- Les refresh tokens sont stockés sous forme de hash, tournés à chaque utilisation et révoqués à la déconnexion.
- Les uploads vérifient taille, MIME, extension et signature, puis utilisent un nom UUID sans nom d’origine.
- Le bootstrap administrateur est désactivé par défaut, notamment en production.
- Les erreurs de validation API utilisent un format JSON commun.

## Validation

```powershell
cd backend
.\mvnw.cmd test
```

```powershell
cd frontend
npm run build
```
