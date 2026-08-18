package com.djibtout.backend;
import org.junit.jupiter.api.Test;import org.springframework.beans.factory.annotation.Autowired;import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;import org.springframework.boot.test.context.SpringBootTest;import org.springframework.http.MediaType;import org.springframework.test.web.servlet.MockMvc;import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest @AutoConfigureMockMvc @org.springframework.test.context.ActiveProfiles("test") class AuthApiTests{
 @Autowired MockMvc mvc;
 @Test void invalidRegistrationReturnsStructuredValidationError()throws Exception{mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\",\"email\":\"invalid\",\"password\":\"short\"}")).andExpect(status().isBadRequest()).andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON)).andExpect(jsonPath("$.code").value("VALIDATION_ERROR")).andExpect(jsonPath("$.details.email").exists());}
 @Test void invalidRefreshTokenIsRejected()throws Exception{mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON).content("{\"refreshToken\":\"invalid\"}")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.message").value("Refresh token invalide."));}
 @Test void adminApiIsNotPublic()throws Exception{mvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized()).andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));}
 @Test void catalogRemainsPublic()throws Exception{mvc.perform(get("/api/catalog/metadata")).andExpect(status().isOk());}
 @Test void securityHeadersArePresent()throws Exception{mvc.perform(get("/api/catalog/metadata")).andExpect(header().exists("Content-Security-Policy")).andExpect(header().string("X-Content-Type-Options","nosniff")).andExpect(header().exists("Referrer-Policy")).andExpect(header().exists("Permissions-Policy"));}
 @Test void uploadRequiresAuthentication()throws Exception{mvc.perform(multipart("/api/upload").file("file",new byte[]{1,2,3})).andExpect(status().isUnauthorized());}
 // BUG-17 : l'adresse est normalisee (trim + minuscules) a chaque point d'entree.
 // Un compte cree avec des majuscules doit rester joignable a la connexion, et
 // aucune variante de casse ne doit permettre un second compte.
 @Test void emailIsCaseInsensitiveAcrossRegistrationAndLogin()throws Exception{
  String local="Casse."+java.util.UUID.randomUUID().toString().substring(0,8);
  mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Casse\",\"email\":\""+local+"@Exemple.DJ\",\"password\":\"motdepasse\"}")).andExpect(status().isOk());
  mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\""+local.toLowerCase()+"@exemple.dj\",\"password\":\"motdepasse\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.token").exists()).andExpect(jsonPath("$.email").value(local.toLowerCase()+"@exemple.dj"));
  mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Casse\",\"email\":\""+local.toUpperCase()+"@EXEMPLE.dj\",\"password\":\"motdepasse\"}")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("L'email est déjà utilisé."));
 }
}
