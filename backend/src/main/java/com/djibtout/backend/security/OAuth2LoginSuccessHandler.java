package com.djibtout.backend.security;

import com.djibtout.backend.entity.AuthProvider;
import com.djibtout.backend.entity.Role;
import com.djibtout.backend.entity.User;
import com.djibtout.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * Fin du parcours « se connecter avec Google / Facebook / Apple ».
 *
 * Trois defauts corriges ici :
 *
 * SEC-36 — l'URL de retour etait ecrite en dur sur http://localhost:3000. Mise
 * en ligne, la connexion renvoyait l'utilisateur vers une machine qui n'existe
 * pas. Elle vient desormais de `app.frontend-url`, validee au demarrage.
 *
 * SEC-37 — aucun controle de `email_verified`. Un fournisseur peut rendre une
 * adresse que son porteur n'a jamais confirmee ; il suffisait alors de declarer
 * l'adresse d'un compte existant pour en prendre le controle. Sans preuve de
 * verification, la connexion est refusee.
 *
 * SEC-38 — le repli « identifiant@provider.com » fabriquait une adresse
 * previsible, qu'un tiers pouvait donc reserver a l'avance par une inscription
 * locale. Il est supprime : pas d'adresse, pas de compte.
 *
 * Reste ouvert, et documente ici pour ne pas etre oublie :
 *
 * SEC-39 — le jeton voyage encore dans l'URL de retour. Il est passe du
 * parametre de requete au fragment (#), qui n'est ni envoye au serveur, ni
 * journalise, ni transmis dans l'en-tete Referer. Cela ferme les fuites
 * concretes, pas le principe. La correction propre est un code a usage unique
 * echange contre le jeton ; elle demande une table dediee et un ecran de retour
 * cote navigateur, qui n'existe pas encore.
 *
 * SEC-40 — aucun jeton de rafraichissement n'est emis, donc la session expire
 * au bout de quinze minutes. L'emettre dans l'URL aggraverait SEC-39 : un jeton
 * de longue duree dans l'historique du navigateur est pire qu'un jeton court.
 * Les deux se reglent ensemble, le jour ou l'ecran de retour sera ecrit.
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

    /**
     * Un compte cree par un fournisseur externe n'a pas de mot de passe local,
     * mais la colonne est NOT NULL. On y met l'empreinte d'un secret aleatoire
     * que personne ne connait. L'ancien code y ecrivait un UUID en clair : le
     * comparateur BCrypt le rejetait en journalisant un avertissement a chaque
     * tentative de connexion sur ce compte.
     */
    private static final PasswordEncoder ENCODEUR = new BCryptPasswordEncoder();

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final String frontendUrl;
    private final boolean actif;
    private final String googleClientId;

    public OAuth2LoginSuccessHandler(UserRepository userRepository,
                                     JwtUtil jwtUtil,
                                     @Value("${app.frontend-url:}") String frontendUrl,
                                     @Value("${app.oauth2.enabled:false}") boolean actif,
                                     @Value("${spring.security.oauth2.client.registration.google.client-id:}") String googleClientId) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.frontendUrl = frontendUrl == null ? "" : frontendUrl.trim();
        this.actif = actif;
        this.googleClientId = googleClientId == null ? "" : googleClientId.trim();
    }

    /**
     * Verifiee au demarrage plutot qu'au premier retour de Google : une adresse
     * de repli fausse ne se voit qu'au moment ou un utilisateur reel se
     * retrouve sur une page blanche.
     */
    @PostConstruct
    void verifierConfiguration() {
        if (!actif) return;
        if (frontendUrl.isBlank())
            throw new IllegalStateException("app.oauth2.enabled=true exige app.frontend-url (variable APP_FRONTEND_URL).");
        if (!frontendUrl.startsWith("http://") && !frontendUrl.startsWith("https://"))
            throw new IllegalStateException("app.frontend-url doit commencer par http:// ou https:// : " + frontendUrl);
        if (frontendUrl.endsWith("/"))
            throw new IllegalStateException("app.frontend-url ne doit pas finir par une barre oblique : " + frontendUrl);
        // Les identifiants de repli du depot ("disabled-google-client") laissent
        // l'application demarrer, puis renvoient une erreur Google incomprehensible
        // au premier utilisateur. Mieux vaut ne pas demarrer du tout.
        if (googleClientId.isBlank() || googleClientId.startsWith("disabled-"))
            throw new IllegalStateException("app.oauth2.enabled=true exige de vrais identifiants client (GOOGLE_CLIENT_ID).");
        log.info("Connexion OAuth2 configuree, retour vers {}.", frontendUrl);
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken jeton = (OAuth2AuthenticationToken) authentication;
        OAuth2User profil = jeton.getPrincipal();
        String fournisseurId = jeton.getAuthorizedClientRegistrationId();
        AuthProvider fournisseur = fournisseur(fournisseurId);

        String email = normaliser(profil.getAttribute("email"));
        if (email == null) {
            log.warn("Connexion {} refusee : le fournisseur n'a rendu aucune adresse e-mail.", fournisseurId);
            refuser(response, "email_absent");
            return;
        }

        if (!adresseVerifiee(profil)) {
            log.warn("Connexion {} refusee pour {} : adresse non verifiee par le fournisseur.", fournisseurId, email);
            refuser(response, "email_non_verifie");
            return;
        }

        Optional<User> existant = userRepository.findByEmail(email);
        User utilisateur;

        if (existant.isPresent()) {
            utilisateur = existant.get();
            if (utilisateur.isAccountDeleted() || utilisateur.isSuspended()) {
                log.warn("Connexion {} refusee pour {} : compte suspendu ou supprime.", fournisseurId, email);
                refuser(response, "compte_indisponible");
                return;
            }
            // Le fournisseur n'est plus ecrase : un compte cree avec un mot de
            // passe garde AuthProvider.LOCAL et donc son parcours de connexion
            // classique. La seule chose que le fournisseur nous apprend, c'est
            // que l'adresse est bien celle de son porteur.
            if (!utilisateur.isEmailVerified()) {
                utilisateur.setEmailVerified(true);
                userRepository.save(utilisateur);
            }
        } else {
            utilisateur = new User();
            utilisateur.setEmail(email);
            utilisateur.setName(nom(profil, email));
            utilisateur.setRole(Role.BUYER);
            utilisateur.setProvider(fournisseur);
            utilisateur.setEmailVerified(true);
            utilisateur.setPassword(ENCODEUR.encode(UUID.randomUUID().toString()));
            userRepository.save(utilisateur);
            log.info("Compte cree via {} pour {}.", fournisseurId, email);
        }

        UserDetails details = org.springframework.security.core.userdetails.User
                .withUsername(utilisateur.getEmail())
                .password("")
                .authorities(utilisateur.getRole().name())
                .build();

        String acces = jwtUtil.generateToken(details);
        response.sendRedirect(frontendUrl + "/oauth2/redirect#token=" + encoder(acces));
    }

    private void refuser(HttpServletResponse response, String motif) throws IOException {
        response.sendRedirect(frontendUrl + "/login#erreur=" + encoder(motif));
    }

    /**
     * Google rend un booleen, Apple parfois la chaine "true", Facebook ne rend
     * rien du tout. Sans reponse explicite du fournisseur, on refuse : c'est
     * exactement la situation que SEC-37 decrit. En pratique, Facebook restera
     * donc inutilisable tant qu'aucune autre preuve ne sera exigee de lui.
     */
    private boolean adresseVerifiee(OAuth2User profil) {
        Object valeur = profil.getAttribute("email_verified");
        if (valeur instanceof Boolean b) return b;
        if (valeur instanceof String s) return "true".equalsIgnoreCase(s.trim());
        return false;
    }

    private static AuthProvider fournisseur(String registrationId) {
        if ("google".equalsIgnoreCase(registrationId)) return AuthProvider.GOOGLE;
        if ("facebook".equalsIgnoreCase(registrationId)) return AuthProvider.FACEBOOK;
        if ("apple".equalsIgnoreCase(registrationId)) return AuthProvider.APPLE;
        return AuthProvider.LOCAL;
    }

    /** Les inscriptions locales enregistrent en minuscules : on aligne, sinon deux comptes coexistent. */
    private static String normaliser(Object email) {
        if (!(email instanceof String s) || s.isBlank()) return null;
        return s.trim().toLowerCase(Locale.ROOT);
    }

    private static String nom(OAuth2User profil, String email) {
        Object valeur = profil.getAttribute("name");
        if (valeur instanceof String s && !s.isBlank()) return s.trim();
        return email.substring(0, email.indexOf('@'));
    }

    private static String encoder(String valeur) {
        return URLEncoder.encode(valeur, StandardCharsets.UTF_8);
    }
}
