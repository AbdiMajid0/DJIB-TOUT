package com.djibtout.backend.security;

import com.djibtout.backend.entity.AuthProvider;
import com.djibtout.backend.entity.Role;
import com.djibtout.backend.entity.User;
import com.djibtout.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import java.util.Optional;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public OAuth2LoginSuccessHandler(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = token.getPrincipal();
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String registrationId = token.getAuthorizedClientRegistrationId(); // "google", "facebook", "apple"

        AuthProvider provider = AuthProvider.LOCAL;
        if ("google".equalsIgnoreCase(registrationId)) provider = AuthProvider.GOOGLE;
        else if ("facebook".equalsIgnoreCase(registrationId)) provider = AuthProvider.FACEBOOK;
        else if ("apple".equalsIgnoreCase(registrationId)) provider = AuthProvider.APPLE;

        if (email == null) {
            // Facebook might not return email if not allowed, fallback
            email = oAuth2User.getAttribute("id") + "@" + registrationId + ".com";
        }
        if (name == null) {
            name = email.split("@")[0];
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Update provider if they used OAuth but had local before, or vice-versa
            // We just let them log in
            if (user.getProvider() != provider) {
                user.setProvider(provider);
                userRepository.save(user);
            }
        } else {
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setRole(Role.BUYER); // Default role
            user.setProvider(provider);
            user.setPassword(java.util.UUID.randomUUID().toString()); // Dummy password for DB constraint
            userRepository.save(user);
        }

        // Generate JWT
        // Need to wrap User in UserDetails for JwtUtil
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password("") // OAuth2 users don't have passwords
                .authorities(user.getRole().name())
                .build();
                
        String jwtToken = jwtUtil.generateToken(userDetails);

        // Redirect to Frontend
        String frontendRedirectUrl = "http://localhost:3000/oauth2/redirect?token=" + jwtToken;
        response.sendRedirect(frontendRedirectUrl);
    }
}
