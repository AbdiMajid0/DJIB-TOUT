package com.djibtout.backend;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.OrderRepository;import com.djibtout.backend.service.OwnershipService;
import org.junit.jupiter.api.BeforeEach;import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.Mockito.*;

class OwnershipServiceTests{
 OrderRepository orders=mock(OrderRepository.class);
 OwnershipService ownership=new OwnershipService(orders);

 User buyer;User seller;User admin;User stranger;

 @BeforeEach void setUp(){
  buyer=user(1L,Role.BUYER);seller=user(5L,Role.SELLER);admin=user(6L,Role.ADMIN);stranger=user(9L,Role.BUYER);
 }

 User user(long id,Role role){User u=new User();u.setId(id);u.setRole(role);return u;}

 Order order(User orderBuyer,User itemSeller){
  Order o=new Order();o.setId(3L);o.setBuyer(orderBuyer);
  Product p=new Product();p.setId(4L);p.setSeller(itemSeller);
  OrderItem item=new OrderItem();item.setProduct(p);
  o.setItems(new ArrayList<>(List.of(item)));
  return o;
 }

 @Test void ownsOrderIsFalseWithoutUserOrOrder(){
  assertFalse(ownership.ownsOrder(null,order(buyer,seller)));
  assertFalse(ownership.ownsOrder(buyer,null));
 }

 @Test void ownsOrderComparesTheBuyer(){
  assertTrue(ownership.ownsOrder(buyer,order(buyer,seller)));
  assertFalse(ownership.ownsOrder(stranger,order(buyer,seller)));
 }

 @Test void canViewOrderIsFalseWithoutUserOrOrder(){
  assertFalse(ownership.canViewOrder(null,order(buyer,seller)));
  assertFalse(ownership.canViewOrder(buyer,null));
 }

 @Test void adminAndBuyerCanViewTheOrder(){
  assertTrue(ownership.canViewOrder(admin,order(buyer,seller)));
  assertTrue(ownership.canViewOrder(buyer,order(buyer,seller)));
 }

 @Test void sellerOfOneItemCanViewTheOrder(){
  assertTrue(ownership.canViewOrder(seller,order(buyer,seller)));
 }

 @Test void unrelatedUserCannotViewTheOrder(){
  assertFalse(ownership.canViewOrder(stranger,order(buyer,seller)));
 }

 @Test void itemWithoutSellerDoesNotGrantAccess(){
  assertFalse(ownership.canViewOrder(stranger,order(buyer,null)));
 }

 @Test void purchasedProductIsFalseWithoutUserOrProduct(){
  Product p=new Product();p.setId(4L);
  assertFalse(ownership.purchasedProduct(null,p));
  assertFalse(ownership.purchasedProduct(buyer,null));
  verify(orders,never()).existsDeliveredPurchase(any(),any());
 }

 @Test void purchasedProductDelegatesToTheDeliveredOrderQuery(){
  Product p=new Product();p.setId(4L);
  when(orders.existsDeliveredPurchase(1L,4L)).thenReturn(true);
  assertTrue(ownership.purchasedProduct(buyer,p));
  when(orders.existsDeliveredPurchase(1L,4L)).thenReturn(false);
  assertFalse(ownership.purchasedProduct(buyer,p));
 }
}
