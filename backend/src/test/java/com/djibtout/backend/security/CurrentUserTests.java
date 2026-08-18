package com.djibtout.backend.security;
import com.djibtout.backend.entity.Role;import com.djibtout.backend.entity.User;import com.djibtout.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;import org.springframework.security.core.Authentication;import org.springframework.security.core.authority.AuthorityUtils;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.Mockito.*;

class CurrentUserTests{
 UserRepository users=mock(UserRepository.class);

 User compte(Role role){User u=new User();u.setId(1L);u.setEmail("a@djibtout.dj");u.setRole(role);return u;}
 Authentication connecte(){return new UsernamePasswordAuthenticationToken("a@djibtout.dj","",AuthorityUtils.NO_AUTHORITIES);}

 @Test void resolvesTheAuthenticatedAccount(){
  User compte=compte(Role.BUYER);
  when(users.findByEmail("a@djibtout.dj")).thenReturn(Optional.of(compte));
  assertSame(compte,CurrentUser.of(users,connecte()));
 }

 @Test void returnsNullWithoutAuthentication(){
  assertNull(CurrentUser.of(users,null));
  verifyNoInteractions(users);
 }

 // Les filtres de securite posent un jeton anonyme sur les routes publiques :
 // sans ce garde, on cherchait un compte nomme « anonymousUser ».
 @Test void returnsNullForTheAnonymousToken(){
  Authentication anonyme=new AnonymousAuthenticationToken("cle","anonymousUser",AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS"));
  assertNull(CurrentUser.of(users,anonyme));
  verifyNoInteractions(users);
 }

 @Test void returnsNullWhenTheAccountNoLongerExists(){
  when(users.findByEmail("a@djibtout.dj")).thenReturn(Optional.empty());
  assertNull(CurrentUser.of(users,connecte()));
 }

 @Test void withRoleAcceptsOnlyTheExpectedRoles(){
  when(users.findByEmail("a@djibtout.dj")).thenReturn(Optional.of(compte(Role.SELLER)));
  assertNotNull(CurrentUser.withRole(users,connecte(),Role.SELLER,Role.ADMIN));
  assertNull(CurrentUser.withRole(users,connecte(),Role.ADMIN));
 }
}
