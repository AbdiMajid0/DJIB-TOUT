package com.djibtout.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Sans ce gestionnaire, un echec cote fournisseur (consentement refuse, jeton
 * expire, identifiants client invalides) tombait sur la page d'erreur par
 * defaut de Spring Security : une page blanche servie par le backend, hors de
 * la charte du site, et qui affiche le message d'exception.
 *
 * Le motif reel est journalise, jamais renvoye au navigateur : il decrit la
 * configuration du serveur.
 */
@Component
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2LoginFailureHandler.class);

    private final String frontendUrl;

    public OAuth2LoginFailureHandler(@Value("${app.frontend-url:}") String frontendUrl) {
        this.frontendUrl = frontendUrl == null ? "" : frontendUrl.trim();
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        log.warn("Echec de connexion OAuth2 : {}", exception.getMessage());
        response.sendRedirect(frontendUrl + "/login#erreur=oauth2");
    }
}
