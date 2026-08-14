package com.djibtout.backend.service;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.RefreshTokenRepository;import com.djibtout.backend.security.JwtUtil;
import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;import java.security.MessageDigest;import java.time.*;import java.util.HexFormat;
@Service public class RefreshTokenService{
 private final RefreshTokenRepository tokens;private final JwtUtil jwt;
 public RefreshTokenService(RefreshTokenRepository t,JwtUtil j){tokens=t;jwt=j;}
 @Transactional public String issue(User user,org.springframework.security.core.userdetails.UserDetails details){String raw=jwt.generateRefreshToken(details);RefreshToken token=new RefreshToken();token.setUser(user);token.setTokenHash(hash(raw));token.setExpiresAt(LocalDateTime.ofInstant(jwt.extractExpiration(raw).toInstant(),ZoneOffset.UTC));tokens.save(token);return raw;}
 @Transactional public User consume(String raw){if(raw==null||!jwt.isRefreshToken(raw))throw new IllegalArgumentException("invalid refresh token");RefreshToken token=tokens.findByTokenHash(hash(raw)).orElseThrow();if(token.isRevoked()||token.getExpiresAt().isBefore(LocalDateTime.now(ZoneOffset.UTC)))throw new IllegalArgumentException("revoked refresh token");token.setRevoked(true);token.setRevokedAt(LocalDateTime.now(ZoneOffset.UTC));tokens.save(token);return token.getUser();}
 @Transactional public User revoke(String raw){if(raw==null)return null;RefreshToken t=tokens.findByTokenHash(hash(raw)).orElse(null);if(t==null)return null;t.setRevoked(true);t.setRevokedAt(LocalDateTime.now(ZoneOffset.UTC));tokens.save(t);return t.getUser();}
 public java.util.List<RefreshToken> sessions(User user){return tokens.findByUserOrderByCreatedAtDesc(user);}
 @Transactional public boolean revokeSession(User user,Long id){RefreshToken t=tokens.findById(id).orElse(null);if(t==null||!t.getUser().getId().equals(user.getId()))return false;t.setRevoked(true);t.setRevokedAt(LocalDateTime.now(ZoneOffset.UTC));tokens.save(t);return true;}
 @Transactional public void revokeAll(User user){tokens.findByUserOrderByCreatedAtDesc(user).stream().filter(t->!t.isRevoked()).forEach(t->{t.setRevoked(true);t.setRevokedAt(LocalDateTime.now(ZoneOffset.UTC));tokens.save(t);});}
 private String hash(String raw){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
}
