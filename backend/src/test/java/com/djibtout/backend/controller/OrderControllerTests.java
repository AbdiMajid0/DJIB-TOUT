package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;import com.djibtout.backend.service.SellerEventService;
import org.junit.jupiter.api.AfterEach;import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;import org.springframework.security.core.authority.AuthorityUtils;import org.springframework.security.core.context.SecurityContextHolder;
import java.math.BigDecimal;import java.util.List;import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.ArgumentMatchers.*;import static org.mockito.Mockito.*;

class OrderControllerTests{
 OrderRepository orders=mock(OrderRepository.class);
 ProductRepository productsRepo=mock(ProductRepository.class);
 UserRepository users=mock(UserRepository.class);
 AddressRepository addresses=mock(AddressRepository.class);
 CouponRepository coupons=mock(CouponRepository.class);
 ProductVariantRepository variants=mock(ProductVariantRepository.class);
 SellerEventService events=mock(SellerEventService.class);
 OrderController controller=new OrderController(orders,productsRepo,users,addresses,coupons,variants,events);

 User buyer;

 @org.junit.jupiter.api.BeforeEach void setUp(){
  buyer=new User();buyer.setId(1L);buyer.setEmail("buyer@test.local");
  when(users.findByEmail(buyer.getEmail())).thenReturn(Optional.of(buyer));
  SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(buyer.getEmail(),"x",AuthorityUtils.NO_AUTHORITIES));
  when(orders.save(any(Order.class))).thenAnswer(inv->{Order o=inv.getArgument(0);if(o.getId()==null)o.setId(99L);return o;});
 }

 @AfterEach void clearContext(){SecurityContextHolder.clearContext();}

 Product product(long id,String price,int stock){
  Product p=new Product();p.setId(id);p.setPrice(new BigDecimal(price));p.setStockQuantity(stock);p.setName("Produit "+id);
  User seller=new User();seller.setId(5L);seller.setEmail("seller@test.local");p.setSeller(seller);
  return p;
 }

 CreateOrderRequest request(String couponCode,String deliveryMethod,long productId,int qty){
  CreateOrderRequest r=new CreateOrderRequest();
  r.setPaymentMethod("CASH");r.setDeliveryAddress("Quartier 7, Djibouti");r.setCouponCode(couponCode);r.setDeliveryMethod(deliveryMethod);
  OrderItemRequest item=new OrderItemRequest();item.setProductId(productId);item.setQuantity(qty);
  r.setItems(List.of(item));
  return r;
 }

 int cmp(BigDecimal expected,BigDecimal actual){return expected.compareTo(actual);}

 @Test void unauthenticatedCreateOrderIsRejected(){
  SecurityContextHolder.clearContext();
  ResponseEntity<?> response=controller.createOrder("key-1",request(null,null,1,1));
  assertEquals(401,response.getStatusCode().value());
 }

 @Test void missingIdempotencyKeyIsRejected(){
  ResponseEntity<?> response=controller.createOrder(null,request(null,null,1,1));
  assertEquals(400,response.getStatusCode().value());
 }

 @Test void duplicateIdempotencyKeyReturnsExistingOrderWithoutRecreating(){
  Order existing=new Order();existing.setId(42L);existing.setTotalAmount(new BigDecimal("5000"));
  when(orders.findByBuyerAndIdempotencyKey(buyer,"key-1")).thenReturn(Optional.of(existing));
  ResponseEntity<?> response=controller.createOrder("key-1",request(null,null,1,1));
  assertEquals(200,response.getStatusCode().value());
  assertEquals(42L,((OrderResponse)response.getBody()).getOrderId());
  verify(productsRepo,never()).findByIdForUpdate(anyLong());
  verify(orders,never()).save(any());
 }

 @Test void insufficientStockIsRejected(){
  when(orders.findByBuyerAndIdempotencyKey(any(),any())).thenReturn(Optional.empty());
  when(productsRepo.findByIdForUpdate(1L)).thenReturn(Optional.of(product(1L,"1000",1)));
  ResponseEntity<?> response=controller.createOrder("key-1",request(null,null,1,5));
  assertEquals(400,response.getStatusCode().value());
  verify(productsRepo,never()).save(any());
  verify(orders,never()).save(any());
 }

 @Test void invalidCouponIsRejected(){
  when(orders.findByBuyerAndIdempotencyKey(any(),any())).thenReturn(Optional.empty());
  when(productsRepo.findByIdForUpdate(1L)).thenReturn(Optional.of(product(1L,"1000",10)));
  when(coupons.findByCodeIgnoreCase("BADCODE")).thenReturn(Optional.empty());
  ResponseEntity<?> response=controller.createOrder("key-1",request("BADCODE",null,1,1));
  assertEquals(400,response.getStatusCode().value());
 }

 @Test void percentageCouponAppliesCorrectDiscountAndStandardDeliveryFeeApplies(){
  when(orders.findByBuyerAndIdempotencyKey(any(),any())).thenReturn(Optional.empty());
  when(productsRepo.findByIdForUpdate(1L)).thenReturn(Optional.of(product(1L,"10000",10)));
  Coupon coupon=new Coupon();coupon.setCode("PROMO10");coupon.setDiscountType(DiscountType.PERCENTAGE);coupon.setDiscountValue(new BigDecimal("10"));coupon.setActive(true);
  when(coupons.findByCodeIgnoreCase("PROMO10")).thenReturn(Optional.of(coupon));

  ResponseEntity<?> response=controller.createOrder("key-1",request("PROMO10",null,1,1));
  assertEquals(200,response.getStatusCode().value());
  OrderResponse body=(OrderResponse)response.getBody();
  assertEquals(0,cmp(new BigDecimal("10000"),body.getSubtotalAmount()));
  assertEquals(0,cmp(new BigDecimal("1000"),body.getDiscountAmount()));
  assertEquals(0,cmp(new BigDecimal("1500"),body.getDeliveryFee()));
  assertEquals(0,cmp(new BigDecimal("10500"),body.getTotalAmount()));
  assertEquals(1,coupon.getUsedCount());
 }

 @Test void fixedCouponDiscountIsCappedAtSubtotalAndNeverGoesNegative(){
  when(orders.findByBuyerAndIdempotencyKey(any(),any())).thenReturn(Optional.empty());
  when(productsRepo.findByIdForUpdate(1L)).thenReturn(Optional.of(product(1L,"1000",10)));
  Coupon coupon=new Coupon();coupon.setCode("BIG5000");coupon.setDiscountType(DiscountType.FIXED);coupon.setDiscountValue(new BigDecimal("5000"));coupon.setActive(true);
  when(coupons.findByCodeIgnoreCase("BIG5000")).thenReturn(Optional.of(coupon));

  ResponseEntity<?> response=controller.createOrder("key-1",request("BIG5000",null,1,1));
  OrderResponse body=(OrderResponse)response.getBody();
  assertEquals(0,cmp(new BigDecimal("1000"),body.getDiscountAmount()));
  assertEquals(0,cmp(new BigDecimal("1500"),body.getTotalAmount()));
 }

 @Test void expressDeliveryIsFlatFeeRegardlessOfSubtotal(){
  when(orders.findByBuyerAndIdempotencyKey(any(),any())).thenReturn(Optional.empty());
  when(productsRepo.findByIdForUpdate(1L)).thenReturn(Optional.of(product(1L,"100000",10)));
  ResponseEntity<?> response=controller.createOrder("key-1",request(null,"EXPRESS",1,1));
  OrderResponse body=(OrderResponse)response.getBody();
  assertEquals(0,cmp(new BigDecimal("3000"),body.getDeliveryFee()));
  assertEquals(0,cmp(new BigDecimal("103000"),body.getTotalAmount()));
 }

 @Test void standardDeliveryIsFreeAboveThreshold(){
  when(orders.findByBuyerAndIdempotencyKey(any(),any())).thenReturn(Optional.empty());
  when(productsRepo.findByIdForUpdate(1L)).thenReturn(Optional.of(product(1L,"60000",10)));
  ResponseEntity<?> response=controller.createOrder("key-1",request(null,null,1,1));
  OrderResponse body=(OrderResponse)response.getBody();
  assertEquals(0,cmp(BigDecimal.ZERO,body.getDeliveryFee()));
  assertEquals(0,cmp(new BigDecimal("60000"),body.getTotalAmount()));
 }

 @Test void addressNotOwnedByBuyerIsRejected(){
  when(orders.findByBuyerAndIdempotencyKey(any(),any())).thenReturn(Optional.empty());
  when(productsRepo.findByIdForUpdate(1L)).thenReturn(Optional.of(product(1L,"1000",10)));
  User someoneElse=new User();someoneElse.setId(2L);
  Address foreignAddress=new Address();foreignAddress.setUser(someoneElse);foreignAddress.setLabel("Maison");foreignAddress.setFullAddress("Rue X");foreignAddress.setCity("Djibouti");
  when(addresses.findById(7L)).thenReturn(Optional.of(foreignAddress));
  CreateOrderRequest r=request(null,null,1,1);r.setAddressId(7L);
  ResponseEntity<?> response=controller.createOrder("key-1",r);
  assertEquals(400,response.getStatusCode().value());
 }

 @Test void cancelRejectedWhenOrderNoLongerPendingOrProcessing(){
  Order order=new Order();order.setId(10L);order.setBuyer(buyer);order.setStatus(OrderStatus.DELIVERED);
  when(orders.findById(10L)).thenReturn(Optional.of(order));
  ResponseEntity<?> response=controller.cancelOrder(10L);
  assertEquals(400,response.getStatusCode().value());
 }

 @Test void cancelByNonBuyerNonAdminIsForbidden(){
  User otherBuyer=new User();otherBuyer.setId(2L);otherBuyer.setEmail("other@test.local");
  Order order=new Order();order.setId(10L);order.setBuyer(otherBuyer);order.setStatus(OrderStatus.PENDING);
  when(orders.findById(10L)).thenReturn(Optional.of(order));
  ResponseEntity<?> response=controller.cancelOrder(10L);
  assertEquals(403,response.getStatusCode().value());
 }

 @Test void cancelRestoresStockForEveryItem(){
  Product p=product(3L,"2000",4);
  OrderItem item=new OrderItem();item.setProduct(p);item.setQuantity(2);item.setPrice(p.getPrice());
  Order order=new Order();order.setId(10L);order.setBuyer(buyer);order.setStatus(OrderStatus.PENDING);order.addItem(item);
  when(orders.findById(10L)).thenReturn(Optional.of(order));
  when(productsRepo.findByIdForUpdate(3L)).thenReturn(Optional.of(p));
  ResponseEntity<?> response=controller.cancelOrder(10L);
  assertEquals(200,response.getStatusCode().value());
  assertEquals(OrderStatus.CANCELLED,order.getStatus());
  assertEquals(6,p.getStockQuantity());
  verify(productsRepo).save(p);
 }

 @Test void getOrderByIdIsForbiddenForStrangers(){
  User owner=new User();owner.setId(2L);
  Order order=new Order();order.setId(10L);order.setBuyer(owner);order.setItems(List.of());
  when(orders.findById(10L)).thenReturn(Optional.of(order));
  ResponseEntity<?> response=controller.getOrderById(10L);
  assertEquals(403,response.getStatusCode().value());
 }

 @Test void getOrderByIdIsAllowedForSellerOfAnItem(){
  Product p=product(4L,"1000",5);
  OrderItem item=new OrderItem();item.setProduct(p);item.setQuantity(1);item.setPrice(p.getPrice());
  User owner=new User();owner.setId(2L);
  Order order=new Order();order.setId(10L);order.setBuyer(owner);order.addItem(item);
  when(orders.findById(10L)).thenReturn(Optional.of(order));
  SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(p.getSeller().getEmail(),"x",AuthorityUtils.NO_AUTHORITIES));
  when(users.findByEmail(p.getSeller().getEmail())).thenReturn(Optional.of(p.getSeller()));
  ResponseEntity<?> response=controller.getOrderById(10L);
  assertEquals(200,response.getStatusCode().value());
 }
}
