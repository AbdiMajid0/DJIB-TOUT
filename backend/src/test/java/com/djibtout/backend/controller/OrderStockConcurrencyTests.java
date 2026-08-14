package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;
import org.junit.jupiter.api.Test;import org.springframework.beans.factory.annotation.Autowired;import org.springframework.boot.test.context.SpringBootTest;import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;import org.springframework.security.core.authority.AuthorityUtils;import org.springframework.security.core.context.SecurityContextHolder;
import java.math.BigDecimal;import java.util.List;import java.util.UUID;import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test against the real local PostgreSQL database (no mocks): proves that
 * ProductRepository.findByIdForUpdate's row lock genuinely serializes two concurrent
 * checkouts racing for the last unit of stock, instead of both succeeding and driving
 * stock negative.
 */
@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
class OrderStockConcurrencyTests{
 @Autowired OrderController controller;
 @Autowired ProductRepository products;
 @Autowired UserRepository users;
 @Autowired OrderRepository orders;
 @Autowired SellerNotificationRepository notifications;

 User persistUser(String email,Role role){
  User u=new User();u.setName("Concurrency test");u.setEmail(email);u.setPassword("{noop}unused");u.setRole(role);
  return users.save(u);
 }

 private Callable<Integer> checkoutTask(String buyerEmail,String idempotencyKey,Long productId,CountDownLatch ready,CountDownLatch go){
  return () -> {
   try{
    SecurityContextHolder.setContext(SecurityContextHolder.createEmptyContext());
    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(buyerEmail,"x",AuthorityUtils.NO_AUTHORITIES));
    ready.countDown();
    go.await(10,TimeUnit.SECONDS);
    CreateOrderRequest request=new CreateOrderRequest();
    request.setPaymentMethod("CASH");request.setDeliveryAddress("Quartier test, Djibouti");
    OrderItemRequest item=new OrderItemRequest();item.setProductId(productId);item.setQuantity(1);
    request.setItems(List.of(item));
    ResponseEntity<?> response=controller.createOrder(idempotencyKey,request);
    return response.getStatusCode().value();
   }finally{
    SecurityContextHolder.clearContext();
   }
  };
 }

 @Test void onlyOneOfTwoConcurrentBuyersWinsTheLastUnitOfStock() throws Exception{
  String suffix=UUID.randomUUID().toString();
  User seller=persistUser("seller-"+suffix+"@djibtout-test.local",Role.SELLER);
  User buyerA=persistUser("buyera-"+suffix+"@djibtout-test.local",Role.BUYER);
  User buyerB=persistUser("buyerb-"+suffix+"@djibtout-test.local",Role.BUYER);

  Product product=new Product();
  product.setName("Concurrency stock test "+suffix);product.setDescription("test");
  product.setPrice(new BigDecimal("1000"));product.setStockQuantity(1);product.setCategory("test");product.setSeller(seller);
  product=products.save(product);
  Long productId=product.getId();

  CountDownLatch ready=new CountDownLatch(2);
  CountDownLatch go=new CountDownLatch(1);
  ExecutorService pool=Executors.newFixedThreadPool(2);
  try{
   Future<Integer> resultA=pool.submit(checkoutTask(buyerA.getEmail(),"concurrency-a-"+suffix,productId,ready,go));
   Future<Integer> resultB=pool.submit(checkoutTask(buyerB.getEmail(),"concurrency-b-"+suffix,productId,ready,go));

   assertTrue(ready.await(10,TimeUnit.SECONDS),"les deux threads doivent démarrer avant le signal de départ");
   go.countDown();

   int statusA=resultA.get(15,TimeUnit.SECONDS);
   int statusB=resultB.get(15,TimeUnit.SECONDS);

   long successCount=List.of(statusA,statusB).stream().filter(s->s==200).count();
   long rejectedCount=List.of(statusA,statusB).stream().filter(s->s==400).count();
   assertEquals(1,successCount,"exactement un des deux achats concurrents doit réussir");
   assertEquals(1,rejectedCount,"l'autre doit être rejeté pour stock insuffisant");

   Product reloaded=products.findById(productId).orElseThrow();
   assertEquals(0,reloaded.getStockQuantity(),"le stock ne doit jamais devenir négatif ni rester à 1");
  }finally{
   pool.shutdownNow();
   cleanUp(productId,seller,buyerA,buyerB);
  }
 }

 private void cleanUp(Long productId,User seller,User buyerA,User buyerB){
  try{
   for(User buyer:List.of(buyerA,buyerB)){
    for(Order o:orders.findByBuyerOrderByCreatedAtDesc(buyer)){orders.delete(o);}
   }
   notifications.findBySellerOrderByCreatedAtDesc(seller).forEach(notifications::delete);
   products.deleteById(productId);
   users.delete(buyerA);users.delete(buyerB);users.delete(seller);
  }catch(Exception ignored){}
 }
}
