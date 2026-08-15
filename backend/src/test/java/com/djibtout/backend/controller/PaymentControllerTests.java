package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;
import org.junit.jupiter.api.Test;import org.springframework.http.ResponseEntity;import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import java.math.BigDecimal;import java.time.LocalDateTime;import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.ArgumentMatchers.*;import static org.mockito.Mockito.*;

class PaymentControllerTests{
 PaymentRepository payments=mock(PaymentRepository.class);
 OrderRepository orders=mock(OrderRepository.class);
 ProductRepository products=mock(ProductRepository.class);
 UserRepository users=mock(UserRepository.class);
 WalletRepository wallets=mock(WalletRepository.class);
 WalletTransactionRepository walletTransactions=mock(WalletTransactionRepository.class);
 com.djibtout.backend.service.BuyerNotificationService buyerNotifications=mock(com.djibtout.backend.service.BuyerNotificationService.class);
 PaymentController controller=new PaymentController(payments,orders,products,users,wallets,walletTransactions,buyerNotifications);

 User buyer(long id){User u=new User();u.setId(id);u.setEmail("buyer"+id+"@test.local");return u;}
 UsernamePasswordAuthenticationToken auth(User u){when(users.findByEmail(u.getEmail())).thenReturn(Optional.of(u));return new UsernamePasswordAuthenticationToken(u.getEmail(),"x");}

 Order pendingOrder(long id,User buyer,String total){
  Order o=new Order();o.setId(id);o.setBuyer(buyer);o.setStatus(OrderStatus.PENDING);o.setTotalAmount(new BigDecimal(total));o.setReservedUntil(LocalDateTime.now().plusMinutes(10));
  return o;
 }

 PaymentController.PaymentRequest request(long orderId,String method,String phone,String amount){
  PaymentController.PaymentRequest r=new PaymentController.PaymentRequest();
  r.orderId=orderId;r.paymentMethod=method;r.phoneNumber=phone;r.amount=new BigDecimal(amount);
  return r;
 }

 @Test void amountMismatchIsRejected(){
  User b=buyer(1);
  when(orders.findById(1L)).thenReturn(Optional.of(pendingOrder(1L,b,"5000")));
  ResponseEntity<?> response=controller.process(auth(b),request(1L,"CASH",null,"4000"));
  assertEquals(400,response.getStatusCode().value());
 }

 @Test void nonBuyerCannotPayForAnotherUsersOrder(){
  User owner=buyer(1);User attacker=buyer(2);
  when(orders.findById(1L)).thenReturn(Optional.of(pendingOrder(1L,owner,"5000")));
  ResponseEntity<?> response=controller.process(auth(attacker),request(1L,"CASH",null,"5000"));
  assertEquals(403,response.getStatusCode().value());
 }

 @Test void alreadyProcessedOrderCannotBePaidTwice(){
  User b=buyer(1);
  Order o=pendingOrder(1L,b,"5000");o.setStatus(OrderStatus.PROCESSING);
  when(orders.findById(1L)).thenReturn(Optional.of(o));
  ResponseEntity<?> response=controller.process(auth(b),request(1L,"CASH",null,"5000"));
  assertEquals(400,response.getStatusCode().value());
 }

 @Test void expiredStockReservationIsRejectedAndOrderCancelled(){
  User b=buyer(1);
  Order o=pendingOrder(1L,b,"5000");o.setReservedUntil(LocalDateTime.now().minusMinutes(1));
  when(orders.findById(1L)).thenReturn(Optional.of(o));
  ResponseEntity<?> response=controller.process(auth(b),request(1L,"CASH",null,"5000"));
  assertEquals(400,response.getStatusCode().value());
  assertEquals(OrderStatus.CANCELLED,o.getStatus());
  verify(payments).save(any(Payment.class));
 }

 @Test void djibpaySuccessfulPaymentDebitsWallet(){
  User b=buyer(1);
  Order o=pendingOrder(1L,b,"5000");
  when(orders.findById(1L)).thenReturn(Optional.of(o));
  Wallet wallet=new Wallet();wallet.setUser(b);wallet.setBalance(new BigDecimal("10000"));
  when(wallets.findByUser(b)).thenReturn(Optional.of(wallet));
  ResponseEntity<?> response=controller.process(auth(b),request(1L,"DJIBPAY",null,"5000"));
  assertEquals(200,response.getStatusCode().value());
  PaymentController.PaymentResponse body=(PaymentController.PaymentResponse)response.getBody();
  assertTrue(body.isSuccess());
  assertNotNull(body.getTransactionId());
  assertEquals(0,new BigDecimal("5000").compareTo(wallet.getBalance()));
  assertEquals(OrderStatus.PROCESSING,o.getStatus());
  verify(walletTransactions).save(argThat(wt->wt.getType()==WalletTransactionType.DEBIT&&wt.getAmount().compareTo(new BigDecimal("5000"))==0));
 }

 @Test void djibpayInsufficientBalanceIsRejected(){
  User b=buyer(1);
  Order o=pendingOrder(1L,b,"5000");
  when(orders.findById(1L)).thenReturn(Optional.of(o));
  Wallet wallet=new Wallet();wallet.setUser(b);wallet.setBalance(new BigDecimal("1000"));
  when(wallets.findByUser(b)).thenReturn(Optional.of(wallet));
  ResponseEntity<?> response=controller.process(auth(b),request(1L,"DJIBPAY",null,"5000"));
  assertEquals(400,response.getStatusCode().value());
  assertEquals(OrderStatus.PENDING,o.getStatus());
 }

 @Test void djibpayWithoutWalletIsRejected(){
  User b=buyer(1);
  Order o=pendingOrder(1L,b,"5000");
  when(orders.findById(1L)).thenReturn(Optional.of(o));
  when(wallets.findByUser(b)).thenReturn(Optional.empty());
  ResponseEntity<?> response=controller.process(auth(b),request(1L,"DJIBPAY",null,"5000"));
  assertEquals(400,response.getStatusCode().value());
 }

 @Test void mobilePaymentWithoutPhoneNumberIsRejected(){
  User b=buyer(1);
  when(orders.findById(1L)).thenReturn(Optional.of(pendingOrder(1L,b,"5000")));
  ResponseEntity<?> response=controller.process(auth(b),request(1L,"WAAFI",null,"5000"));
  assertEquals(400,response.getStatusCode().value());
 }

 @Test void mobilePaymentMagicRefusalNumberFailsAndRestoresStock(){
  User b=buyer(1);
  Order o=pendingOrder(1L,b,"5000");
  Product p=new Product();p.setId(9L);p.setStockQuantity(3);p.setPrice(new BigDecimal("5000"));
  OrderItem item=new OrderItem();item.setProduct(p);item.setQuantity(2);item.setPrice(p.getPrice());
  o.addItem(item);
  when(orders.findById(1L)).thenReturn(Optional.of(o));
  ResponseEntity<?> response=controller.process(auth(b),request(1L,"WAAFI","77000000",""+"5000"));
  assertEquals(200,response.getStatusCode().value());
  PaymentController.PaymentResponse body=(PaymentController.PaymentResponse)response.getBody();
  assertFalse(body.isSuccess());
  assertEquals(OrderStatus.CANCELLED,o.getStatus());
  assertEquals(5,p.getStockQuantity());
  verify(products).save(p);
 }

 @Test void mobilePaymentSucceedsForOrdinaryPhoneNumber(){
  User b=buyer(1);
  Order o=pendingOrder(1L,b,"5000");
  when(orders.findById(1L)).thenReturn(Optional.of(o));
  ResponseEntity<?> response=controller.process(auth(b),request(1L,"WAAFI","77123456","5000"));
  assertEquals(200,response.getStatusCode().value());
  PaymentController.PaymentResponse body=(PaymentController.PaymentResponse)response.getBody();
  assertTrue(body.isSuccess());
  assertEquals(OrderStatus.PROCESSING,o.getStatus());
 }

 @Test void paymentDetailsForbiddenForStranger(){
  User owner=buyer(1);User stranger=buyer(2);
  Order o=pendingOrder(1L,owner,"5000");
  when(orders.findById(1L)).thenReturn(Optional.of(o));
  ResponseEntity<?> response=controller.details(auth(stranger),1L);
  assertEquals(403,response.getStatusCode().value());
 }

 @Test void paymentDetailsVisibleToAdmin(){
  User owner=buyer(1);User admin=buyer(2);admin.setRole(Role.ADMIN);
  Order o=pendingOrder(1L,owner,"5000");
  when(orders.findById(1L)).thenReturn(Optional.of(o));
  when(payments.findByOrderOrderByCreatedAtDesc(o)).thenReturn(java.util.List.of());
  ResponseEntity<?> response=controller.details(auth(admin),1L);
  assertEquals(200,response.getStatusCode().value());
 }
}
