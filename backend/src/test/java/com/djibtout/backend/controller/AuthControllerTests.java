package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.UserRepository;import com.djibtout.backend.security.JwtUtil;import com.djibtout.backend.service.*;
import org.junit.jupiter.api.Test;import org.mockito.ArgumentCaptor;
import org.springframework.http.ResponseEntity;import org.springframework.security.authentication.*;import org.springframework.security.core.userdetails.UserDetails;import org.springframework.security.core.userdetails.UserDetailsService;import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.*;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.ArgumentMatchers.*;import static org.mockito.Mockito.*;

class AuthControllerTests{
 AuthenticationManager authManager=mock(AuthenticationManager.class);
 UserDetailsService userDetailsService=mock(UserDetailsService.class);
 JwtUtil jwt=mock(JwtUtil.class);
 UserRepository users=mock(UserRepository.class);
 PasswordEncoder encoder=mock(PasswordEncoder.class);
 RefreshTokenService refreshTokens=mock(RefreshTokenService.class);
 LoginAttemptService attempts=mock(LoginAttemptService.class);
 SellerEventService events=mock(SellerEventService.class);
 AuthController controller=new AuthController(authManager,userDetailsService,jwt,users,encoder,refreshTokens,attempts,events);

 RegisterRequest registerRequest(String name,String email,String password,String role){
  RegisterRequest r=new RegisterRequest();r.name=name;r.email=email;r.password=password;r.role=role;return r;
 }
 LoginRequest loginRequest(String email,String password){LoginRequest r=new LoginRequest();r.email=email;r.password=password;return r;}

 @Test void registerRejectsAlreadyUsedEmail(){
  when(users.findByEmail("taken@test.local")).thenReturn(Optional.of(new User()));
  ResponseEntity<?> response=controller.register(registerRequest("Ali","taken@test.local","password1",null));
  assertEquals(400,response.getStatusCode().value());
  verify(users,never()).save(any());
 }

 @Test void registerCreatesBuyerByDefaultWithHashedPasswordAndVerificationToken(){
  when(users.findByEmail("new@test.local")).thenReturn(Optional.empty());
  when(encoder.encode("password1")).thenReturn("hashed-password");
  ResponseEntity<?> response=controller.register(registerRequest("Ali","new@test.local","password1",null));
  assertEquals(200,response.getStatusCode().value());
  ArgumentCaptor<User> captor=ArgumentCaptor.forClass(User.class);
  verify(users).save(captor.capture());
  User saved=captor.getValue();
  assertEquals(Role.BUYER,saved.getRole());
  assertEquals("hashed-password",saved.getPassword());
  assertEquals("new@test.local",saved.getEmail());
  assertNotNull(saved.getEmailVerificationToken());
 }

 @Test void registerWithSellerRoleCreatesSellerAccount(){
  when(users.findByEmail("seller@test.local")).thenReturn(Optional.empty());
  when(encoder.encode(any())).thenReturn("hashed");
  controller.register(registerRequest("Amina","seller@test.local","password1","seller"));
  ArgumentCaptor<User> captor=ArgumentCaptor.forClass(User.class);
  verify(users).save(captor.capture());
  assertEquals(Role.SELLER,captor.getValue().getRole());
 }

 @Test void loginIsRateLimitedAfterTooManyFailures(){
  when(attempts.blocked("user@test.local")).thenReturn(true);
  ResponseEntity<?> response=controller.login(loginRequest("user@test.local","wrong"));
  assertEquals(429,response.getStatusCode().value());
  verifyNoInteractions(authManager);
 }

 @Test void loginWithWrongCredentialsRecordsFailureAndReturns401(){
  when(attempts.blocked("user@test.local")).thenReturn(false);
  when(authManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));
  ResponseEntity<?> response=controller.login(loginRequest("user@test.local","wrong"));
  assertEquals(401,response.getStatusCode().value());
  verify(attempts).failed("user@test.local");
  verify(attempts,never()).succeeded(any());
 }

 @Test void loginSuccessReturnsTokensAndAuditsAndResetsAttempts(){
  when(attempts.blocked("user@test.local")).thenReturn(false);
  when(authManager.authenticate(any())).thenReturn(new UsernamePasswordAuthenticationToken("user@test.local","x",List.of()));
  UserDetails details=org.springframework.security.core.userdetails.User.withUsername("user@test.local").password("x").authorities(List.of()).build();
  when(userDetailsService.loadUserByUsername("user@test.local")).thenReturn(details);
  User user=new User();user.setId(1L);user.setEmail("user@test.local");user.setName("Ali");user.setRole(Role.BUYER);
  when(users.findByEmail("user@test.local")).thenReturn(Optional.of(user));
  when(jwt.generateToken(details)).thenReturn("access-token");
  when(refreshTokens.issue(user,details)).thenReturn("refresh-token");

  ResponseEntity<?> response=controller.login(loginRequest("user@test.local","x"));
  assertEquals(200,response.getStatusCode().value());
  AuthResponse body=(AuthResponse)response.getBody();
  assertEquals("access-token",body.getToken());
  assertEquals("refresh-token",body.getRefreshToken());
  verify(attempts).succeeded("user@test.local");
  verify(events).audit(eq(user),eq("AUTH_LOGIN"),any());
 }

 @Test void logoutRevokesTokenAndAuditsWhenUserFound(){
  User user=new User();user.setId(1L);
  when(refreshTokens.revoke("raw-token")).thenReturn(user);
  ResponseEntity<?> response=controller.logout(Map.of("refreshToken","raw-token"));
  assertEquals(204,response.getStatusCode().value());
  verify(events).audit(eq(user),eq("AUTH_LOGOUT"),any());
 }

 @Test void logoutIsSilentNoOpForUnknownToken(){
  when(refreshTokens.revoke("unknown")).thenReturn(null);
  ResponseEntity<?> response=controller.logout(Map.of("refreshToken","unknown"));
  assertEquals(204,response.getStatusCode().value());
  verifyNoInteractions(events);
 }

 @Test void refreshWithInvalidTokenReturns401(){
  when(refreshTokens.consume("bad")).thenThrow(new IllegalArgumentException("invalid refresh token"));
  ResponseEntity<?> response=controller.refresh(Map.of("refreshToken","bad"));
  assertEquals(401,response.getStatusCode().value());
 }

 @Test void refreshWithValidTokenRotatesAndReturnsNewTokens(){
  User user=new User();user.setId(1L);user.setEmail("user@test.local");
  when(refreshTokens.consume("old-refresh")).thenReturn(user);
  UserDetails details=org.springframework.security.core.userdetails.User.withUsername("user@test.local").password("x").authorities(List.of()).build();
  when(userDetailsService.loadUserByUsername("user@test.local")).thenReturn(details);
  when(jwt.generateToken(details)).thenReturn("new-access");
  when(refreshTokens.issue(user,details)).thenReturn("new-refresh");

  ResponseEntity<?> response=controller.refresh(Map.of("refreshToken","old-refresh"));
  assertEquals(200,response.getStatusCode().value());
  @SuppressWarnings("unchecked") Map<String,String> body=(Map<String,String>)response.getBody();
  assertEquals("new-access",body.get("token"));
  assertEquals("new-refresh",body.get("refreshToken"));
  verify(events).audit(eq(user),eq("AUTH_REFRESH"),any());
 }

 @Test void expiredPasswordResetTokenIsRejected(){
  User user=new User();user.setPasswordResetToken("expired-token");user.setPasswordResetExpiresAt(LocalDateTime.now().minusMinutes(1));
  when(users.findByPasswordResetToken("expired-token")).thenReturn(Optional.of(user));
  ResponseEntity<?> response=controller.reset(Map.of("token","expired-token","password","NewPassword123"));
  assertEquals(400,response.getStatusCode().value());
  verify(encoder,never()).encode(anyString());
  verify(users,never()).save(any());
 }
}
