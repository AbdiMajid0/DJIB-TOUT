package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.test.util.ReflectionTestUtils;
import java.math.BigDecimal;import java.util.*;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.ArgumentMatchers.any;import static org.mockito.Mockito.*;

class SavedListControllerTests{
 SavedListRepository lists=mock(SavedListRepository.class);
 UserRepository users=mock(UserRepository.class);
 ProductRepository products=mock(ProductRepository.class);
 SavedListController controller=new SavedListController(lists,users,products);

 User owner;Authentication auth;

 @BeforeEach void setUp(){
  owner=new User();owner.setId(1L);owner.setEmail("buyer@test.local");
  auth=new UsernamePasswordAuthenticationToken(owner.getEmail(),"x",AuthorityUtils.NO_AUTHORITIES);
  when(users.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
  when(lists.save(any(SavedList.class))).thenAnswer(inv->inv.getArgument(0));
 }

 SavedList list(long id,User user,Long... productIds){
  SavedList x=new SavedList();ReflectionTestUtils.setField(x,"id",id);x.setUser(user);x.setName("Envies");
  x.getProductIds().addAll(List.of(productIds));
  when(lists.findById(id)).thenReturn(Optional.of(x));
  return x;
 }

 Product product(long id){Product p=new Product();p.setId(id);p.setName("Produit "+id);p.setPrice(new BigDecimal("1200"));p.setCategory("maison");p.setVisible(true);return p;}

 @SuppressWarnings("unchecked") Map<String,Object> body(ResponseEntity<?> response){return (Map<String,Object>)response.getBody();}

 @Test void allRequiresAuthentication(){
  assertEquals(401,controller.all(null).getStatusCode().value());
 }

 @Test void allJoinsProductDetailsAndSkipsDeletedOnes(){
  SavedList x=list(3L,owner,7L,8L);
  when(products.findAllById(any())).thenReturn(List.of(product(8L)));
  when(lists.findByUserOrderByCreatedAtDesc(owner)).thenReturn(List.of(x));
  ResponseEntity<?> response=controller.all(auth);
  assertEquals(200,response.getStatusCode().value());
  List<?> views=(List<?>)response.getBody();
  @SuppressWarnings("unchecked") Map<String,Object> view=(Map<String,Object>)views.get(0);
  assertEquals(Set.of(7L,8L),view.get("productIds"));
  List<?> items=(List<?>)view.get("products");
  assertEquals(1,items.size());
  @SuppressWarnings("unchecked") Map<String,Object> item=(Map<String,Object>)items.get(0);
  assertEquals(8L,item.get("id"));
  assertEquals("Produit 8",item.get("name"));
 }

 @Test void createRequiresAuthentication(){
  assertEquals(401,controller.create(null,Map.of("name","Envies")).getStatusCode().value());
 }

 @Test void createRejectsBlankOrOverlongName(){
  assertEquals(400,controller.create(auth,Map.of("name","   ")).getStatusCode().value());
  assertEquals(400,controller.create(auth,Map.of("name","x".repeat(81))).getStatusCode().value());
  assertEquals(400,controller.create(auth,Map.of()).getStatusCode().value());
  verify(lists,never()).save(any());
 }

 @Test void createTrimsNameAndReturns201(){
  when(products.findAllById(any())).thenReturn(List.of());
  ResponseEntity<?> response=controller.create(auth,Map.of("name","  Envies  "));
  assertEquals(201,response.getStatusCode().value());
  assertEquals("Envies",body(response).get("name"));
 }

 @Test void renameRefusesAListOwnedBySomeoneElse(){
  User other=new User();other.setId(2L);
  list(3L,other);
  assertEquals(403,controller.rename(auth,3L,Map.of("name","Autre")).getStatusCode().value());
 }

 @Test void renameRefusesUnknownList(){
  when(lists.findById(99L)).thenReturn(Optional.empty());
  assertEquals(403,controller.rename(auth,99L,Map.of("name","Autre")).getStatusCode().value());
 }

 @Test void renameValidatesTheNewName(){
  list(3L,owner);
  assertEquals(400,controller.rename(auth,3L,Map.of("name"," ")).getStatusCode().value());
 }

 @Test void renameStoresTheTrimmedName(){
  SavedList x=list(3L,owner);
  when(products.findAllById(any())).thenReturn(List.of());
  assertEquals(200,controller.rename(auth,3L,Map.of("name","  Cadeaux ")).getStatusCode().value());
  assertEquals("Cadeaux",x.getName());
 }

 @Test void addRefusesUnknownProduct(){
  list(3L,owner);
  when(products.existsById(7L)).thenReturn(false);
  assertEquals(404,controller.add(auth,3L,7L).getStatusCode().value());
 }

 @Test void addStoresTheProductId(){
  SavedList x=list(3L,owner);
  when(products.existsById(7L)).thenReturn(true);
  when(products.findAllById(any())).thenReturn(List.of(product(7L)));
  assertEquals(200,controller.add(auth,3L,7L).getStatusCode().value());
  assertTrue(x.getProductIds().contains(7L));
 }

 @Test void removeDropsTheProductId(){
  SavedList x=list(3L,owner,7L);
  when(products.findAllById(any())).thenReturn(List.of());
  assertEquals(200,controller.remove(auth,3L,7L).getStatusCode().value());
  assertFalse(x.getProductIds().contains(7L));
 }

 @Test void deleteRefusesAListOwnedBySomeoneElse(){
  User other=new User();other.setId(2L);
  list(3L,other);
  assertEquals(403,controller.delete(auth,3L).getStatusCode().value());
  verify(lists,never()).delete(any());
 }

 @Test void deleteRemovesTheList(){
  SavedList x=list(3L,owner);
  assertEquals(204,controller.delete(auth,3L).getStatusCode().value());
  verify(lists).delete(x);
 }
}
