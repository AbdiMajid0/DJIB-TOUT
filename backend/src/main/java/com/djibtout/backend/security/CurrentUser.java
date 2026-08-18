package com.djibtout.backend.security;
import com.djibtout.backend.entity.Role;import com.djibtout.backend.entity.User;import com.djibtout.backend.repository.UserRepository;import org.springframework.security.core.Authentication;import org.springframework.security.core.context.SecurityContextHolder;
/** Resolution du compte porte par la requete. Chaque controleur en avait sa
 *  copie privee, avec des gardes differentes : certaines oubliaient le jeton
 *  anonyme, d'autres le controle de role. */
public final class CurrentUser{
 private CurrentUser(){}
 /** Renvoie null si aucun compte exploitable : Authentication absent, session
  *  anonyme, ou e-mail du jeton inconnu en base (compte supprime). */
 public static User of(UserRepository users,Authentication auth){
  if(auth==null||auth.getName()==null||"anonymousUser".equals(auth.getName()))return null;
  return users.findByEmail(auth.getName()).orElse(null);
 }
 public static User ofContext(UserRepository users){return of(users,SecurityContextHolder.getContext().getAuthentication());}
 /** Meme resolution, mais restreinte aux roles autorises : renvoie null quand
  *  le compte existe sans porter l'un d'eux. */
 public static User withRole(UserRepository users,Authentication auth,Role... roles){
  User user=of(users,auth);
  if(user==null)return null;
  for(Role role:roles)if(user.getRole()==role)return user;
  return null;
 }
}
