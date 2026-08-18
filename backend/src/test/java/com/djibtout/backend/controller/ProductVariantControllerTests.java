package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.test.util.ReflectionTestUtils;
import java.math.BigDecimal;import java.util.*;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.ArgumentMatchers.*;import static org.mockito.Mockito.*;

class ProductVariantControllerTests{
 ProductRepository products=mock(ProductRepository.class);
 ProductVariantRepository variants=mock(ProductVariantRepository.class);
 UserRepository users=mock(UserRepository.class);
 ProductVariantController controller=new ProductVariantController(products,variants,users);

 User seller;User admin;User intruder;Product product;

 @BeforeEach void setUp(){
  seller=user(5L,"seller@test.local",Role.SELLER);
  admin=user(6L,"admin@test.local",Role.ADMIN);
  intruder=user(7L,"other@test.local",Role.SELLER);
  product=new Product();product.setId(4L);product.setName("Ventilateur");product.setSeller(seller);
  when(products.findById(4L)).thenReturn(Optional.of(product));
  when(variants.save(any(ProductVariant.class))).thenAnswer(inv->inv.getArgument(0));
 }

 User user(long id,String email,Role role){
  User u=new User();u.setId(id);u.setEmail(email);u.setRole(role);
  when(users.findByEmail(email)).thenReturn(Optional.of(u));
  return u;
 }

 Authentication auth(User user){return new UsernamePasswordAuthenticationToken(user.getEmail(),"x",AuthorityUtils.NO_AUTHORITIES);}

 ProductVariant variant(long id,Product owner,String sku,boolean active){
  ProductVariant v=new ProductVariant();ReflectionTestUtils.setField(v,"id",id);
  v.setProduct(owner);v.setSku(sku);v.setPrice(new BigDecimal("1500"));v.setStockQuantity(3);v.setActive(active);
  when(variants.findById(id)).thenReturn(Optional.of(v));
  return v;
 }

 ProductVariantController.VariantInput input(String sku){
  return new ProductVariantController.VariantInput(sku,new BigDecimal("1500"),3,true,Map.of("taille","M"),List.of("a.webp"));
 }

 @Test void listReturns404ForUnknownProduct(){
  when(products.findById(77L)).thenReturn(Optional.empty());
  assertEquals(404,controller.list(77L,auth(seller)).getStatusCode().value());
 }

 @Test void anonymousVisitorSeesActiveVariantsOnly(){
  controller.list(4L,null);
  verify(variants).findByProductIdAndActiveTrueOrderByIdAsc(4L);
  verify(variants,never()).findByProductIdOrderByIdAsc(4L);
 }

 @Test void otherSellerSeesActiveVariantsOnly(){
  controller.list(4L,auth(intruder));
  verify(variants).findByProductIdAndActiveTrueOrderByIdAsc(4L);
 }

 @Test void ownerSeesInactiveVariantsToo(){
  controller.list(4L,auth(seller));
  verify(variants).findByProductIdOrderByIdAsc(4L);
 }

 @Test void adminSeesInactiveVariantsToo(){
  controller.list(4L,auth(admin));
  verify(variants).findByProductIdOrderByIdAsc(4L);
 }

 @Test void createRefusesANonOwner(){
  assertEquals(403,controller.create(4L,auth(intruder),input("SKU-1")).getStatusCode().value());
  assertEquals(403,controller.create(4L,null,input("SKU-1")).getStatusCode().value());
  verify(variants,never()).save(any());
 }

 @Test void createRefusesADuplicateSku(){
  ProductVariant existing=variant(9L,product,"SKU-1",true);
  when(variants.findByProductIdAndSkuIgnoreCase(4L,"SKU-1")).thenReturn(Optional.of(existing));
  assertEquals(409,controller.create(4L,auth(seller),input("SKU-1")).getStatusCode().value());
  verify(variants,never()).save(any());
 }

 @Test void createTrimsSkuAndAttachesTheProduct(){
  when(variants.findByProductIdAndSkuIgnoreCase(eq(4L),any())).thenReturn(Optional.empty());
  ProductVariant saved=(ProductVariant)controller.create(4L,auth(seller),input("  SKU-1  ")).getBody();
  assertEquals("SKU-1",saved.getSku());
  assertEquals(product,saved.getProduct());
  assertEquals(Map.of("taille","M"),saved.getAttributes());
  assertEquals(List.of("a.webp"),saved.getImages());
 }

 @Test void updateRefusesANonOwner(){
  assertEquals(403,controller.update(4L,9L,auth(intruder),input("SKU-1")).getStatusCode().value());
 }

 @Test void updateReturns404WhenTheVariantBelongsToAnotherProduct(){
  Product other=new Product();other.setId(8L);other.setSeller(seller);
  variant(9L,other,"SKU-1",true);
  assertEquals(404,controller.update(4L,9L,auth(seller),input("SKU-1")).getStatusCode().value());
 }

 @Test void updateReturns404ForUnknownVariant(){
  when(variants.findById(99L)).thenReturn(Optional.empty());
  assertEquals(404,controller.update(4L,99L,auth(seller),input("SKU-1")).getStatusCode().value());
 }

 @Test void updateRefusesASkuHeldByAnotherVariant(){
  variant(9L,product,"SKU-1",true);
  ProductVariant other=variant(10L,product,"SKU-2",true);
  when(variants.findByProductIdAndSkuIgnoreCase(4L,"SKU-2")).thenReturn(Optional.of(other));
  assertEquals(409,controller.update(4L,9L,auth(seller),input("SKU-2")).getStatusCode().value());
 }

 @Test void updateAcceptsTheVariantKeepingItsOwnSku(){
  ProductVariant existing=variant(9L,product,"SKU-1",true);
  when(variants.findByProductIdAndSkuIgnoreCase(4L,"SKU-1")).thenReturn(Optional.of(existing));
  ProductVariant saved=(ProductVariant)controller.update(4L,9L,auth(seller),input("SKU-1")).getBody();
  assertEquals("SKU-1",saved.getSku());
  verify(variants).save(existing);
 }

 @Test void deleteRefusesANonOwner(){
  assertEquals(403,controller.delete(4L,9L,auth(intruder)).getStatusCode().value());
  verify(variants,never()).delete(any());
 }

 @Test void deleteReturns404WhenTheVariantBelongsToAnotherProduct(){
  Product other=new Product();other.setId(8L);other.setSeller(seller);
  variant(9L,other,"SKU-1",true);
  assertEquals(404,controller.delete(4L,9L,auth(seller)).getStatusCode().value());
  verify(variants,never()).delete(any());
 }

 @Test void deleteRemovesTheVariant(){
  ProductVariant existing=variant(9L,product,"SKU-1",true);
  assertEquals(204,controller.delete(4L,9L,auth(seller)).getStatusCode().value());
  verify(variants).delete(existing);
 }
}
