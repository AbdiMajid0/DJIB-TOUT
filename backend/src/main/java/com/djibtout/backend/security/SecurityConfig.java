package com.djibtout.backend.security;

import com.djibtout.backend.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(SecurityConfig.class);
    // Troisieme repli localhost du projet, apres application.properties et
    // docker-compose. On le supprime : la propriete doit etre definie.
    @Value("${app.cors.allowed-origins}") private String allowedOrigins;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService customUserDetailsService;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final RateLimitFilter rateLimitFilter;
    private final ValidatedSellerFilter validatedSellerFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, CustomUserDetailsService customUserDetailsService, OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,RateLimitFilter rateLimitFilter,ValidatedSellerFilter validatedSellerFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customUserDetailsService = customUserDetailsService;
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        this.rateLimitFilter=rateLimitFilter;
        this.validatedSellerFilter=validatedSellerFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            // Bearer-token API calls are not cookie-authenticated and are not vulnerable to CSRF.
            // CSRF remains enabled for browser/OAuth endpoints that may use cookies.
            .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()).ignoringRequestMatchers("/api/**"))
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"))
                .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).preload(true).maxAgeInSeconds(31536000))
                .referrerPolicy(ref -> ref.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .permissionsPolicy(p -> p.policy("camera=(), microphone=(), geolocation=(), payment=()")))
            .authorizeHttpRequests(auth -> auth
                // Sans cette ligne, toute exception sur une route authentifiee
                // est renvoyee vers /error, que `anyRequest().authenticated()`
                // refuse : la vraie erreur (500, 405...) ressort en 401, et le
                // client prend cela pour une session expiree et deconnecte.
                // `server.error.include-message=never` en prod/staging : rien ne fuit.
                .requestMatchers("/error").permitAll()
                // Ces quatre routes exigent une session : declarees publiques, elles
                // recevaient un Authentication nul et levaient une NullPointerException
                // — un 500 la ou un 401 s'impose. Observe en production dans
                // backend-run.out.log. Matchers plus specifiques d'abord : l'ordre
                // de declaration decide.
                .requestMatchers("/api/auth/me", "/api/auth/sessions", "/api/auth/sessions/**").authenticated()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/telemetry/**").permitAll()
                .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                // Seule la sonde de sante est publique : prometheus, metrics et info
                // retombaient sur anyRequest().authenticated(), donc tout acheteur
                // connecte pouvait les lire.
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/products", "/api/products/**", "/api/catalog/**", "/api/public/**", "/uploads/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/products/*/interactions").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/products", "/api/products/**").hasAnyRole("SELLER","ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/products/**").hasAnyRole("SELLER","ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/products/**").hasAnyRole("SELLER","ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/products/**").hasAnyRole("SELLER","ADMIN")
                .requestMatchers("/api/upload/**").hasAnyRole("SELLER","ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request,response,exception)->{response.setStatus(401);response.setContentType("application/json");response.getWriter().write("{\"message\":\"Authentification requise.\"}");})
                .accessDeniedHandler((request,response,exception)->{response.setStatus(403);response.setContentType("application/json");response.getWriter().write("{\"message\":\"Accès refusé.\"}");}))
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2LoginSuccessHandler)
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(jwtAuthenticationFilter, RateLimitFilter.class);
        http.addFilterAfter(validatedSellerFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(customUserDetailsService)
                .passwordEncoder(passwordEncoder())
                .and()
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> origins = Arrays.stream(allowedOrigins.split(",")).map(String::trim).filter(o -> !o.isEmpty()).toList();
        if (origins.isEmpty())
            throw new IllegalStateException("app.cors.allowed-origins est vide : aucun navigateur ne pourra appeler l'API.");
        for (String origin : origins) {
            // Avec un en-tete Authorization, '*' revient a ouvrir l'API a tout site.
            if ("*".equals(origin))
                throw new IllegalStateException("app.cors.allowed-origins ne peut pas valoir '*' : listez les origines.");
            if (!origin.startsWith("http://") && !origin.startsWith("https://"))
                throw new IllegalStateException("Origine CORS invalide, schema http:// ou https:// attendu : " + origin);
            // Le navigateur envoie une origine nue (schema + hote + port). Spring la
            // compare caractere par caractere : une barre finale ou un chemin ne
            // correspond jamais, et le rejet ne laisse aucune trace cote serveur.
            if (origin.indexOf('/', origin.indexOf("://") + 3) >= 0)
                throw new IllegalStateException("Origine CORS invalide, ni chemin ni barre finale : " + origin);
        }
        log.info("CORS : {} origine(s) autorisee(s) : {}", origins.size(), origins);
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-CSRF-TOKEN", "X-XSRF-TOKEN", "Idempotency-Key"));
        configuration.setExposedHeaders(List.of("Location", "Retry-After"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
