package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;
import org.junit.jupiter.api.AfterEach;import org.junit.jupiter.api.BeforeEach;import org.junit.jupiter.api.Test;
import org.springframework.data.domain.*;import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.ArgumentMatchers.*;import static org.mockito.Mockito.*;

class FavoriteControllerTests{
 FavoriteRepository favorites=mock(FavoriteRepository.class);
 ProductRepository products=mock(ProductRepository.class);
 UserRepository users=mock(UserRepository.class);
 FavoriteController controller=new FavoriteController(favorites,products,users);

 User buyer;

 @BeforeEach void setUp(){
  buyer=new User();buyer.setId(1L);buyer.setEmail("buyer@test.local");
  when(users.findByEmail(buyer.getEmail())).thenReturn(Optional.of(buyer));
 }

 @AfterEach void clearContext(){SecurityContextHolder.clearContext();}

 void authenticate(){SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(buyer.getEmail(),"x",AuthorityUtils.NO_AUTHORITIES));}
 void authenticateAnonymously(){SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken("key","anonymousUser",AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));}

 Product product(long id){Product p=new Product();p.setId(id);p.setName("Produit "+id);p.setImages(new ArrayList<>(List.of("a.webp")));return p;}

 @Test void listRequiresAuthentication(){
  assertEquals(401,controller.getMyFavorites(0,12).getStatusCode().value());
 }

 @Test void anonymousTokenIsTreatedAsUnauthenticated(){
  authenticateAnonymously();
  assertEquals(401,controller.getMyFavorites(0,12).getStatusCode().value());
 }

 @Test void unknownEmailIsTreatedAsUnauthenticated(){
  SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("ghost@test.local","x",AuthorityUtils.NO_AUTHORITIES));
  when(users.findByEmail("ghost@test.local")).thenReturn(Optional.empty());
  assertEquals(401,controller.getMyFavorites(0,12).getStatusCode().value());
 }

 @Test void listExposesProductsAndKeepsPaginationMetadata(){
  authenticate();
  Favorite favorite=new Favorite(buyer,product(4L));
  when(favorites.findByUserOrderByCreatedAtDesc(eq(buyer),any(Pageable.class)))
   .thenReturn(new PageImpl<>(List.of(favorite),PageRequest.of(0,12),1));
  ResponseEntity<?> response=controller.getMyFavorites(0,12);
  assertEquals(200,response.getStatusCode().value());
  Page<?> page=(Page<?>)response.getBody();
  assertEquals(1,page.getTotalElements());
  assertEquals(4L,((Product)page.getContent().get(0)).getId());
 }

 @Test void idsListRequiresAuthentication(){
  assertEquals(401,controller.getMyFavoriteIds().getStatusCode().value());
 }

 @Test void idsListReturnsProductIdsOnly(){
  authenticate();
  when(favorites.findByUserOrderByCreatedAtDesc(buyer)).thenReturn(List.of(new Favorite(buyer,product(4L)),new Favorite(buyer,product(9L))));
  assertEquals(List.of(4L,9L),controller.getMyFavoriteIds().getBody());
 }

 @Test void addRequiresAuthentication(){
  assertEquals(401,controller.addFavorite(4L).getStatusCode().value());
  verify(favorites,never()).save(any());
 }

 @Test void addRejectsUnknownProduct(){
  authenticate();
  when(products.findById(4L)).thenReturn(Optional.empty());
  assertEquals(400,controller.addFavorite(4L).getStatusCode().value());
  verify(favorites,never()).save(any());
 }

 @Test void addStoresFavoriteOnce(){
  authenticate();
  Product p=product(4L);
  when(products.findById(4L)).thenReturn(Optional.of(p));
  when(favorites.existsByUserAndProduct(buyer,p)).thenReturn(false);
  assertEquals(200,controller.addFavorite(4L).getStatusCode().value());
  verify(favorites).save(any(Favorite.class));
 }

 @Test void addIsIdempotentWhenAlreadyFavorite(){
  authenticate();
  Product p=product(4L);
  when(products.findById(4L)).thenReturn(Optional.of(p));
  when(favorites.existsByUserAndProduct(buyer,p)).thenReturn(true);
  assertEquals(200,controller.addFavorite(4L).getStatusCode().value());
  verify(favorites,never()).save(any());
 }

 @Test void removeRequiresAuthentication(){
  assertEquals(401,controller.removeFavorite(4L).getStatusCode().value());
  verify(favorites,never()).deleteByUserAndProduct(any(),any());
 }

 @Test void removeDeletesTheFavorite(){
  authenticate();
  Product p=product(4L);
  when(products.findById(4L)).thenReturn(Optional.of(p));
  assertEquals(200,controller.removeFavorite(4L).getStatusCode().value());
  verify(favorites).deleteByUserAndProduct(buyer,p);
 }

 @Test void removeStaysSuccessfulWhenProductNoLongerExists(){
  authenticate();
  when(products.findById(4L)).thenReturn(Optional.empty());
  assertEquals(200,controller.removeFavorite(4L).getStatusCode().value());
  verify(favorites,never()).deleteByUserAndProduct(any(),any());
 }
}
