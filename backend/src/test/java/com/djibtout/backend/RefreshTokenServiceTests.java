package com.djibtout.backend;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.RefreshTokenRepository;
import com.djibtout.backend.security.JwtUtil;import com.djibtout.backend.service.RefreshTokenService;
import org.junit.jupiter.api.BeforeEach;import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;
import java.nio.charset.StandardCharsets;import java.security.MessageDigest;import java.time.*;import java.util.*;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.ArgumentMatchers.any;import static org.mockito.Mockito.*;

class RefreshTokenServiceTests{
 RefreshTokenRepository tokens=mock(RefreshTokenRepository.class);
 JwtUtil jwt=new JwtUtil("test-only-secret-that-is-long-enough-for-hmac-signing-2026",60000,120000);
 RefreshTokenService service=new RefreshTokenService(tokens,jwt);

 User user;UserDetails details;

 @BeforeEach void setUp(){
  user=new User();user.setId(1L);user.setEmail("buyer@test.local");user.setRole(Role.BUYER);
  details=org.springframework.security.core.userdetails.User.withUsername(user.getEmail()).password("x").authorities("BUYER").build();
  when(tokens.save(any(RefreshToken.class))).thenAnswer(inv->inv.getArgument(0));
 }

 String hash(String raw){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}

 RefreshToken stored(long id,String raw,boolean revoked,LocalDateTime expiresAt){
  RefreshToken t=new RefreshToken();ReflectionTestUtils.setField(t,"id",id);
  t.setUser(user);t.setTokenHash(hash(raw));t.setRevoked(revoked);t.setExpiresAt(expiresAt);
  when(tokens.findByTokenHash(t.getTokenHash())).thenReturn(Optional.of(t));
  when(tokens.findById(id)).thenReturn(Optional.of(t));
  return t;
 }

 @Test void issueStoresOnlyTheHashOfTheToken(){
  String raw=service.issue(user,details);
  org.mockito.ArgumentCaptor<RefreshToken> saved=org.mockito.ArgumentCaptor.forClass(RefreshToken.class);
  verify(tokens).save(saved.capture());
  assertEquals(hash(raw),saved.getValue().getTokenHash());
  assertNotEquals(raw,saved.getValue().getTokenHash());
  assertEquals(user,saved.getValue().getUser());
  assertTrue(saved.getValue().getExpiresAt().isAfter(LocalDateTime.now(ZoneOffset.UTC)));
  assertTrue(jwt.isRefreshToken(raw));
 }

 @Test void consumeRejectsNullToken(){
  assertThrows(IllegalArgumentException.class,()->service.consume(null));
 }

 @Test void consumeRejectsAnAccessToken(){
  String access=jwt.generateToken(details);
  assertThrows(IllegalArgumentException.class,()->service.consume(access));
  verify(tokens,never()).findByTokenHash(any());
 }

 @Test void consumeRejectsAnUnknownToken(){
  String raw=jwt.generateRefreshToken(details);
  when(tokens.findByTokenHash(hash(raw))).thenReturn(Optional.empty());
  assertThrows(NoSuchElementException.class,()->service.consume(raw));
 }

 @Test void consumeRejectsAnAlreadyRevokedToken(){
  String raw=jwt.generateRefreshToken(details);
  stored(1L,raw,true,LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
  assertThrows(IllegalArgumentException.class,()->service.consume(raw));
 }

 @Test void consumeRejectsAnExpiredToken(){
  String raw=jwt.generateRefreshToken(details);
  stored(1L,raw,false,LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1));
  assertThrows(IllegalArgumentException.class,()->service.consume(raw));
 }

 @Test void consumeRotatesTheTokenAndReturnsItsOwner(){
  String raw=jwt.generateRefreshToken(details);
  RefreshToken token=stored(1L,raw,false,LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
  assertEquals(user,service.consume(raw));
  assertTrue(token.isRevoked());
  assertNotNull(token.getRevokedAt());
  verify(tokens).save(token);
 }

 @Test void revokeIgnoresNullAndUnknownTokens(){
  assertNull(service.revoke(null));
  when(tokens.findByTokenHash(hash("nope"))).thenReturn(Optional.empty());
  assertNull(service.revoke("nope"));
  verify(tokens,never()).save(any());
 }

 @Test void revokeMarksTheTokenAndReturnsItsOwner(){
  RefreshToken token=stored(1L,"raw",false,LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
  assertEquals(user,service.revoke("raw"));
  assertTrue(token.isRevoked());
  assertNotNull(token.getRevokedAt());
 }

 @Test void sessionsListsTheTokensOfTheUser(){
  RefreshToken token=stored(1L,"raw",false,LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
  when(tokens.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(token));
  assertEquals(List.of(token),service.sessions(user));
 }

 @Test void revokeSessionRefusesUnknownAndForeignSessions(){
  when(tokens.findById(99L)).thenReturn(Optional.empty());
  assertFalse(service.revokeSession(user,99L));
  RefreshToken foreign=stored(1L,"raw",false,LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
  User other=new User();other.setId(2L);
  foreign.setUser(other);
  assertFalse(service.revokeSession(user,1L));
  assertFalse(foreign.isRevoked());
 }

 @Test void revokeSessionMarksTheSessionOfItsOwner(){
  RefreshToken token=stored(1L,"raw",false,LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
  assertTrue(service.revokeSession(user,1L));
  assertTrue(token.isRevoked());
 }

 @Test void revokeAllTouchesOnlyTheStillActiveSessions(){
  RefreshToken active=stored(1L,"a",false,LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
  RefreshToken already=stored(2L,"b",true,LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
  LocalDateTime revokedAt=LocalDateTime.now(ZoneOffset.UTC).minusDays(3);
  already.setRevokedAt(revokedAt);
  when(tokens.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(active,already));
  service.revokeAll(user);
  assertTrue(active.isRevoked());
  assertNotNull(active.getRevokedAt());
  assertEquals(revokedAt,already.getRevokedAt());
  verify(tokens).save(active);
  verify(tokens,never()).save(already);
 }
}
