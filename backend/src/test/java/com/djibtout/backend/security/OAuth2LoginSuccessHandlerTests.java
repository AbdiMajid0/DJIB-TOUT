package com.djibtout.backend.security;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;import org.mockito.ArgumentCaptor;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;import org.springframework.security.oauth2.core.user.OAuth2User;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.ArgumentMatchers.any;import static org.mockito.Mockito.*;

/** SEC-36 a SEC-38 : retour configurable, adresse verifiee obligatoire, aucune adresse de repli. */
class OAuth2LoginSuccessHandlerTests{
 UserRepository users=mock(UserRepository.class);
 JwtUtil jwt=new JwtUtil("test-only-secret-that-is-long-enough-for-hmac-signing-2026",36000000L,2592000000L);
 HttpServletRequest request=mock(HttpServletRequest.class);
 HttpServletResponse response=mock(HttpServletResponse.class);

 OAuth2LoginSuccessHandler handler(){return new OAuth2LoginSuccessHandler(users,jwt,"https://djibtout.example",true,"real-google-client-id");}

 OAuth2AuthenticationToken token(String registrationId,Map<String,Object> attributes){
  OAuth2User profil=new DefaultOAuth2User(List.of(()->"ROLE_USER"),attributes,attributes.containsKey("email")?"email":attributes.keySet().iterator().next());
  return new OAuth2AuthenticationToken(profil,List.of(()->"ROLE_USER"),registrationId);
 }

 String redirect() throws Exception{
  ArgumentCaptor<String> url=ArgumentCaptor.forClass(String.class);
  verify(response).sendRedirect(url.capture());
  return url.getValue();
 }

 User existing(String email){User u=new User();u.setId(7L);u.setEmail(email);u.setRole(Role.BUYER);u.setProvider(AuthProvider.LOCAL);u.setEmailVerified(true);return u;}

 @Test void configurationRefusesBlankFrontendUrl(){
  OAuth2LoginSuccessHandler h=new OAuth2LoginSuccessHandler(users,jwt,"",true,"real-google-client-id");
  assertThrows(IllegalStateException.class,h::verifierConfiguration);
 }

 @Test void configurationRefusesUrlWithoutScheme(){
  OAuth2LoginSuccessHandler h=new OAuth2LoginSuccessHandler(users,jwt,"djibtout.example",true,"real-google-client-id");
  assertThrows(IllegalStateException.class,h::verifierConfiguration);
 }

 @Test void configurationRefusesTrailingSlash(){
  OAuth2LoginSuccessHandler h=new OAuth2LoginSuccessHandler(users,jwt,"https://djibtout.example/",true,"real-google-client-id");
  assertThrows(IllegalStateException.class,h::verifierConfiguration);
 }

 @Test void configurationRefusesPlaceholderGoogleClientId(){
  OAuth2LoginSuccessHandler h=new OAuth2LoginSuccessHandler(users,jwt,"https://djibtout.example",true,"disabled-google-client");
  assertThrows(IllegalStateException.class,h::verifierConfiguration);
 }

 @Test void configurationIgnoredWhenOauthDisabled(){
  OAuth2LoginSuccessHandler h=new OAuth2LoginSuccessHandler(users,jwt,"",false,"");
  assertDoesNotThrow(h::verifierConfiguration);
 }

 @Test void configurationAcceptsValidSettings(){
  assertDoesNotThrow(handler()::verifierConfiguration);
 }

 @Test void loginRefusedWhenProviderReturnsNoEmail() throws Exception{
  handler().onAuthenticationSuccess(request,response,token("google",Map.of("sub","1","email_verified",true)));
  assertEquals("https://djibtout.example/login#erreur=email_absent",redirect());
  verify(users,never()).save(any());
 }

 @Test void loginRefusedWhenEmailNotVerifiedByProvider() throws Exception{
  handler().onAuthenticationSuccess(request,response,token("facebook",Map.of("email","a@b.com")));
  assertEquals("https://djibtout.example/login#erreur=email_non_verifie",redirect());
  verify(users,never()).save(any());
 }

 @Test void loginAcceptsStringEmailVerifiedAttribute() throws Exception{
  when(users.findByEmail("a@b.com")).thenReturn(Optional.of(existing("a@b.com")));
  handler().onAuthenticationSuccess(request,response,token("apple",Map.of("email","a@b.com","email_verified","TRUE")));
  assertTrue(redirect().startsWith("https://djibtout.example/oauth2/redirect#token="));
 }

 @Test void loginRefusedForSuspendedAccount() throws Exception{
  User user=existing("a@b.com");user.setSuspended(true);
  when(users.findByEmail("a@b.com")).thenReturn(Optional.of(user));
  handler().onAuthenticationSuccess(request,response,token("google",Map.of("email","a@b.com","email_verified",true)));
  assertEquals("https://djibtout.example/login#erreur=compte_indisponible",redirect());
 }

 @Test void loginRefusedForDeletedAccount() throws Exception{
  User user=existing("a@b.com");user.setAccountDeleted(true);
  when(users.findByEmail("a@b.com")).thenReturn(Optional.of(user));
  handler().onAuthenticationSuccess(request,response,token("google",Map.of("email","a@b.com","email_verified",true)));
  assertEquals("https://djibtout.example/login#erreur=compte_indisponible",redirect());
 }

 @Test void existingLocalAccountKeepsItsProviderAndGetsEmailVerified() throws Exception{
  User user=existing("a@b.com");user.setEmailVerified(false);
  when(users.findByEmail("a@b.com")).thenReturn(Optional.of(user));
  handler().onAuthenticationSuccess(request,response,token("google",Map.of("email","a@b.com","email_verified",true)));
  assertTrue(user.isEmailVerified());
  assertEquals(AuthProvider.LOCAL,user.getProvider());
  verify(users).save(user);
 }

 @Test void alreadyVerifiedAccountIsNotSavedAgain() throws Exception{
  when(users.findByEmail("a@b.com")).thenReturn(Optional.of(existing("a@b.com")));
  handler().onAuthenticationSuccess(request,response,token("google",Map.of("email","a@b.com","email_verified",true)));
  verify(users,never()).save(any());
 }

 @Test void unknownEmailCreatesVerifiedBuyerWithHashedRandomPassword() throws Exception{
  when(users.findByEmail("new@b.com")).thenReturn(Optional.empty());
  handler().onAuthenticationSuccess(request,response,token("google",Map.of("email","New@B.com","email_verified",true,"name","  Amina  ")));
  ArgumentCaptor<User> saved=ArgumentCaptor.forClass(User.class);
  verify(users).save(saved.capture());
  User created=saved.getValue();
  assertEquals("new@b.com",created.getEmail());
  assertEquals("Amina",created.getName());
  assertEquals(Role.BUYER,created.getRole());
  assertEquals(AuthProvider.GOOGLE,created.getProvider());
  assertTrue(created.isEmailVerified());
  assertTrue(created.getPassword().startsWith("$2a$"));
 }

 @Test void missingProviderNameFallsBackToEmailLocalPart() throws Exception{
  when(users.findByEmail("amina@b.com")).thenReturn(Optional.empty());
  handler().onAuthenticationSuccess(request,response,token("facebook",Map.of("email","amina@b.com","email_verified",true)));
  ArgumentCaptor<User> saved=ArgumentCaptor.forClass(User.class);
  verify(users).save(saved.capture());
  assertEquals("amina",saved.getValue().getName());
  assertEquals(AuthProvider.FACEBOOK,saved.getValue().getProvider());
 }

 @Test void unknownRegistrationIdIsRecordedAsLocalProvider() throws Exception{
  when(users.findByEmail("a@b.com")).thenReturn(Optional.empty());
  handler().onAuthenticationSuccess(request,response,token("linkedin",Map.of("email","a@b.com","email_verified",true)));
  ArgumentCaptor<User> saved=ArgumentCaptor.forClass(User.class);
  verify(users).save(saved.capture());
  assertEquals(AuthProvider.LOCAL,saved.getValue().getProvider());
 }

 @Test void accessTokenTravelsInFragmentAndIsUrlEncoded() throws Exception{
  when(users.findByEmail("a@b.com")).thenReturn(Optional.of(existing("a@b.com")));
  handler().onAuthenticationSuccess(request,response,token("google",Map.of("email","a@b.com","email_verified",true)));
  String url=redirect();
  assertTrue(url.startsWith("https://djibtout.example/oauth2/redirect#token="));
  assertFalse(url.contains("?"));
  String encoded=url.substring(url.indexOf("#token=")+7);
  String decoded=java.net.URLDecoder.decode(encoded,java.nio.charset.StandardCharsets.UTF_8);
  assertEquals("a@b.com",jwt.extractUsername(decoded));
 }
}
