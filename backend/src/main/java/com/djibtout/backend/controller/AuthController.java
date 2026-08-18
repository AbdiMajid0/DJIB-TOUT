package com.djibtout.backend.controller;

import com.djibtout.backend.entity.*; import com.djibtout.backend.repository.UserRepository; import com.djibtout.backend.security.JwtUtil; import com.djibtout.backend.service.*;
import jakarta.validation.Valid; import jakarta.validation.constraints.*;
import org.springframework.http.ResponseEntity; import org.springframework.security.authentication.*; import org.springframework.security.core.userdetails.UserDetails; import org.springframework.security.core.userdetails.UserDetailsService; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime; import java.util.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
 private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(AuthController.class);
 /**
  * BUG-17 : l'inscription verifiait l'unicite sur l'adresse telle que saisie
  * puis enregistrait sa version minuscule, tandis que la connexion cherchait
  * a nouveau la casse brute. Deux consequences : « Radwan@x.com » et
  * « radwan@x.com » creaient deux comptes, et un utilisateur inscrit avec une
  * majuscule ne pouvait plus se connecter — le mot de passe etait bon, le
  * serveur repondait « Email ou mot de passe incorrect ».
  * Une seule normalisation, appliquee a chaque point d'entree.
  */
 private static String normaliser(String email){return email==null?"":email.trim().toLowerCase(java.util.Locale.ROOT);}
 @org.springframework.beans.factory.annotation.Autowired(required=false) private org.springframework.beans.factory.ObjectProvider<TransactionalEmailService> emailProvider;
 private final AuthenticationManager authenticationManager; private final UserDetailsService userDetailsService; private final JwtUtil jwtUtil; private final UserRepository users; private final PasswordEncoder encoder;private final RefreshTokenService refreshTokens;private final LoginAttemptService attempts;private final SellerEventService events;
 public AuthController(AuthenticationManager a,UserDetailsService d,JwtUtil j,UserRepository u,PasswordEncoder e,RefreshTokenService rt,LoginAttemptService la,SellerEventService events){authenticationManager=a;userDetailsService=d;jwtUtil=j;users=u;encoder=e;refreshTokens=rt;attempts=la;this.events=events;}
 @PostMapping("/register") public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest r){String email=normaliser(r.email);if(users.findByEmail(email).isPresent())return ResponseEntity.badRequest().body(new MessageResponse("L'email est déjà utilisé."));User u=new User();u.setName(r.name);u.setEmail(email);u.setPassword(encoder.encode(r.password));u.setRole("SELLER".equalsIgnoreCase(r.role)?Role.SELLER:Role.BUYER);u.setEmailVerificationToken(UUID.randomUUID().toString());users.save(u);TransactionalEmailService mail=emailProvider==null?null:emailProvider.getIfAvailable();if(mail!=null)mail.verification(u.getEmail(),u.getEmailVerificationToken());return ResponseEntity.ok(new MessageResponse("Inscription réussie. Vérifiez votre email."));}
 @PostMapping("/login") public ResponseEntity<?> login(@Valid @RequestBody LoginRequest r){String email=normaliser(r.email);if(attempts.blocked(email))return ResponseEntity.status(429).body(new MessageResponse("Trop de tentatives. Réessayez plus tard."));try{authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email,r.password));}
  // Seul un refus d'authentification compte comme tentative ratee. Un
  // catch(Exception) faisait passer une panne de base pour un mauvais mot de
  // passe : l'utilisateur cherchait ses identifiants, et cinq essais
  // suffisaient a bloquer son compte pendant que le serveur etait en cause.
  catch(org.springframework.security.core.AuthenticationException e){attempts.failed(email);return ResponseEntity.status(401).body(new MessageResponse("Email ou mot de passe incorrect."));}attempts.succeeded(email);UserDetails d=userDetailsService.loadUserByUsername(email);User u=users.findByEmail(email).orElseThrow();events.audit(u,"AUTH_LOGIN","account="+u.getId());return ResponseEntity.ok(new AuthResponse(jwtUtil.generateToken(d),refreshTokens.issue(u,d),u.getName(),u.getEmail(),u.getRole().name()));}
 // La configuration de securite exige desormais une session sur ces routes.
 // Le controle reste ici : une regle de securite peut etre modifiee, une
 // NullPointerException ne doit pas en etre la consequence.
 @GetMapping("/me") public ResponseEntity<?> me(org.springframework.security.core.Authentication a){User u=compte(a);if(u==null)return nonAuthentifie();return ResponseEntity.ok(Map.of("name",u.getName(),"email",u.getEmail(),"role",u.getRole().name(),"emailVerified",u.isEmailVerified()));}
 // Seules les causes qui invalident reellement le jeton donnent un 401 : jeton
 // absent, inconnu, revoque, expire, ou compte disparu. Tout le reste — panne
 // de base, association non initialisee — remonte au gestionnaire d'erreurs et
 // sort en 500. Un catch(Exception) repondait 401 dans ces cas aussi, et le
 // client, croyant sa session perdue, deconnectait l'utilisateur.
 @PostMapping("/refresh") public ResponseEntity<?> refresh(@RequestBody Map<String,String> b){try{User u=refreshTokens.consume(b.get("refreshToken"));UserDetails d=userDetailsService.loadUserByUsername(u.getEmail());events.audit(u,"AUTH_REFRESH","account="+u.getId());return ResponseEntity.ok(Map.of("token",jwtUtil.generateToken(d),"refreshToken",refreshTokens.issue(u,d)));}
  catch(IllegalArgumentException|NoSuchElementException|io.jsonwebtoken.JwtException|org.springframework.security.core.userdetails.UsernameNotFoundException e){log.debug("Rafraichissement refuse : {}",e.getMessage());return ResponseEntity.status(401).body(new MessageResponse("Refresh token invalide."));}}
 @PostMapping("/logout") public ResponseEntity<?> logout(@RequestBody Map<String,String>b){User u=refreshTokens.revoke(b.get("refreshToken"));if(u!=null)events.audit(u,"AUTH_LOGOUT","account="+u.getId());return ResponseEntity.noContent().build();}
 @GetMapping("/sessions") public ResponseEntity<?> sessions(org.springframework.security.core.Authentication a){User u=compte(a);if(u==null)return nonAuthentifie();return ResponseEntity.ok(refreshTokens.sessions(u).stream().map(t->Map.of("id",t.getId(),"createdAt",t.getCreatedAt(),"expiresAt",t.getExpiresAt(),"active",!t.isRevoked()&&t.getExpiresAt().isAfter(LocalDateTime.now(java.time.ZoneOffset.UTC)))).toList());}
 @DeleteMapping("/sessions/{id}") public ResponseEntity<?> session(org.springframework.security.core.Authentication a,@PathVariable Long id){User u=compte(a);if(u==null)return nonAuthentifie();return refreshTokens.revokeSession(u,id)?ResponseEntity.noContent().build():ResponseEntity.notFound().build();}
 @DeleteMapping("/sessions") public ResponseEntity<?> sessionsDelete(org.springframework.security.core.Authentication a){User u=compte(a);if(u==null)return nonAuthentifie();refreshTokens.revokeAll(u);return ResponseEntity.noContent().build();}
 @PostMapping("/verify-email") public ResponseEntity<?> verify(@RequestBody Map<String,String> b){User u=users.findByEmailVerificationToken(b.get("token")).orElse(null);if(u==null)return ResponseEntity.badRequest().body(new MessageResponse("Jeton invalide."));u.setEmailVerified(true);u.setEmailVerificationToken(null);users.save(u);return ResponseEntity.ok(new MessageResponse("Email vérifié."));}
 // Reponse strictement identique que le compte existe ou non : toute difference
 // (message, champ supplementaire, code HTTP) transforme cet endpoint public en
 // oracle d'enumeration des adresses inscrites.
 @PostMapping("/forgot-password") public ResponseEntity<?> forgot(@RequestBody Map<String,String> b){
  MessageResponse reponse=new MessageResponse("Si ce compte existe, un lien de réinitialisation vient d’être envoyé.");
  User u=users.findByEmail(normaliser(b.getOrDefault("email",""))).orElse(null);
  if(u==null)return ResponseEntity.ok(reponse);
  u.setPasswordResetToken(UUID.randomUUID().toString());u.setPasswordResetExpiresAt(LocalDateTime.now().plusMinutes(30));users.save(u);
  TransactionalEmailService mail=emailProvider==null?null:emailProvider.getIfAvailable();
  if(mail!=null)mail.passwordReset(u.getEmail(),u.getPasswordResetToken());
  // Sans service e-mail, aucun chemin ne mene plus au jeton : la demande reste
  // sans effet pour l'utilisateur, l'exploitant doit pouvoir s'en apercevoir.
  else log.warn("Reinitialisation demandee sans service e-mail configure : jeton genere mais non transmis (compte={})",u.getId());
  return ResponseEntity.ok(reponse);}
 @PostMapping("/reset-password") public ResponseEntity<?> reset(@RequestBody Map<String,String> b){User u=users.findByPasswordResetToken(b.get("token")).orElse(null);String p=b.get("password");if(u==null||u.getPasswordResetExpiresAt()==null||u.getPasswordResetExpiresAt().isBefore(LocalDateTime.now())||p==null||p.length()<8)return ResponseEntity.badRequest().body(new MessageResponse("Jeton ou mot de passe invalide."));u.setPassword(encoder.encode(p));u.setPasswordResetToken(null);u.setPasswordResetExpiresAt(null);users.save(u);
  // Une reinitialisation fait suite a une compromission presumee : les jetons de
  // rafraichissement deja emis doivent mourir avec l'ancien mot de passe, sinon
  // l'attaquant garde un acces valable 30 jours.
  refreshTokens.revokeAll(u);
  events.audit(u,"AUTH_PASSWORD_RESET","account="+u.getId());
  return ResponseEntity.ok(new MessageResponse("Mot de passe modifié. Toutes les sessions ont été déconnectées."));}
 // Renvoie null si aucune session exploitable : Authentication absent, jeton
 // anonyme, ou compte disparu depuis l'emission du jeton.
 private User compte(org.springframework.security.core.Authentication a){
  if(a==null||!a.isAuthenticated()||"anonymousUser".equals(a.getName()))return null;
  return users.findByEmail(a.getName()).orElse(null);
 }
 private ResponseEntity<?> nonAuthentifie(){return ResponseEntity.status(401).body(new MessageResponse("Authentification requise."));}
}
class RegisterRequest{@NotBlank @Size(max=100) public String name;@NotBlank @Email public String email;@NotBlank @Size(min=8,max=72) public String password;public String role;}
class LoginRequest{@NotBlank @Email public String email;@NotBlank public String password;}
class AuthResponse{private String token,refreshToken,name,email,role;public AuthResponse(String t,String rt,String n,String e,String r){token=t;refreshToken=rt;name=n;email=e;role=r;}public String getToken(){return token;}public String getRefreshToken(){return refreshToken;}public String getName(){return name;}public String getEmail(){return email;}public String getRole(){return role;}}
class MessageResponse{private String message;public MessageResponse(String m){message=m;}public String getMessage(){return message;}}
