package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.ArgumentMatchers.any;import static org.mockito.Mockito.*;

class BuyerNotificationControllerTests{
 BuyerNotificationRepository notifications=mock(BuyerNotificationRepository.class);
 UserRepository users=mock(UserRepository.class);
 BuyerNotificationController controller=new BuyerNotificationController(notifications,users);

 User buyer;Authentication auth;

 @BeforeEach void setUp(){
  buyer=new User();buyer.setId(1L);buyer.setEmail("buyer@test.local");
  auth=new UsernamePasswordAuthenticationToken(buyer.getEmail(),"x",AuthorityUtils.NO_AUTHORITIES);
  when(users.findByEmail(buyer.getEmail())).thenReturn(Optional.of(buyer));
  when(notifications.save(any(BuyerNotification.class))).thenAnswer(inv->inv.getArgument(0));
 }

 BuyerNotification notification(long id,User user){
  BuyerNotification n=new BuyerNotification();ReflectionTestUtils.setField(n,"id",id);
  n.setUser(user);n.setTitle("Commande expediee");n.setMessage("Colis en route");n.setLink("/orders/12");
  when(notifications.findById(id)).thenReturn(Optional.of(n));
  return n;
 }

 @Test void listRequiresAuthentication(){
  assertEquals(401,controller.list(null).getStatusCode().value());
 }

 @Test void listNeverExposesTheOwningUser(){
  BuyerNotification n=notification(3L,buyer);
  when(notifications.findByUserOrderByCreatedAtDesc(buyer)).thenReturn(List.of(n));
  ResponseEntity<?> response=controller.list(auth);
  @SuppressWarnings("unchecked") Map<String,Object> view=(Map<String,Object>)((List<?>)response.getBody()).get(0);
  assertEquals(Set.of("id","title","message","link","read","createdAt"),view.keySet());
  assertEquals(Boolean.FALSE,view.get("read"));
 }

 @Test void unreadCountRequiresAuthentication(){
  assertEquals(401,controller.unread(null).getStatusCode().value());
 }

 @Test void unreadCountIsReportedForTheCurrentUser(){
  when(notifications.countByUserAndReadFalse(buyer)).thenReturn(4L);
  assertEquals(Map.of("count",4L),controller.unread(auth).getBody());
 }

 @Test void readRefusesANotificationOwnedBySomeoneElse(){
  User other=new User();other.setId(2L);
  BuyerNotification n=notification(3L,other);
  assertEquals(403,controller.read(auth,3L).getStatusCode().value());
  assertFalse(n.isRead());
 }

 @Test void readRefusesUnknownNotification(){
  when(notifications.findById(99L)).thenReturn(Optional.empty());
  assertEquals(403,controller.read(auth,99L).getStatusCode().value());
 }

 @Test void readRefusesAnonymousCaller(){
  notification(3L,buyer);
  assertEquals(403,controller.read(null,3L).getStatusCode().value());
 }

 @Test void readMarksTheNotificationAsRead(){
  BuyerNotification n=notification(3L,buyer);
  assertEquals(200,controller.read(auth,3L).getStatusCode().value());
  assertTrue(n.isRead());
  verify(notifications).save(n);
 }

 @Test void readAllRequiresAuthentication(){
  assertEquals(401,controller.readAll(null).getStatusCode().value());
 }

 @Test void readAllMarksEveryNotification(){
  BuyerNotification first=notification(3L,buyer),second=notification(4L,buyer);
  when(notifications.findByUserOrderByCreatedAtDesc(buyer)).thenReturn(List.of(first,second));
  assertEquals(200,controller.readAll(auth).getStatusCode().value());
  assertTrue(first.isRead());
  assertTrue(second.isRead());
  verify(notifications).saveAll(List.of(first,second));
 }
}
