package com.djibtout.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    // Generate a secure key for HS256
    private final SecretKey secretKey;
    private final long accessTokenMs,refreshTokenMs;
    public JwtUtil(@Value("${jwt.secret}") String secret,@Value("${jwt.access-token-ms:36000000}") long accessTokenMs,@Value("${jwt.refresh-token-ms:2592000000}") long refreshTokenMs) {
        if(secret==null||secret.length()<32)throw new IllegalStateException("JWT_SECRET doit contenir au moins 32 caractères.");
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        this.accessTokenMs=accessTokenMs;this.refreshTokenMs=refreshTokenMs;
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", userDetails.getAuthorities().iterator().next().getAuthority());
        claims.put("type", "access");
        claims.put("jti", java.util.UUID.randomUUID().toString());
        return createToken(claims, userDetails.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenMs))
                .signWith(secretKey)
                .compact();
    }
    public String generateRefreshToken(UserDetails userDetails) {
        return Jwts.builder().setSubject(userDetails.getUsername()).setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshTokenMs))
                .claim("type", "refresh").claim("jti",java.util.UUID.randomUUID().toString()).signWith(secretKey).compact();
    }
    public boolean isRefreshToken(String token) { return "refresh".equals(extractAllClaims(token).get("type")) && !isTokenExpired(token); }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && "access".equals(extractAllClaims(token).get("type")) && !isTokenExpired(token));
    }
}
