package com.djibtout.backend;
import com.djibtout.backend.controller.CouponController;import com.djibtout.backend.entity.Coupon;import com.djibtout.backend.entity.DiscountType;import com.djibtout.backend.repository.CouponRepository;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;import java.time.LocalDateTime;import java.util.List;import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.Mockito.*;

class CouponControllerTests{
 CouponRepository repository=mock(CouponRepository.class);
 CouponController controller=new CouponController(repository);

 Coupon coupon(String code,boolean active,LocalDateTime expiresAt,Integer usageLimit,int usedCount){
  Coupon c=new Coupon();c.setCode(code);c.setDiscountType(DiscountType.PERCENTAGE);c.setDiscountValue(new BigDecimal("10"));
  c.setActive(active);c.setExpiresAt(expiresAt);c.setUsageLimit(usageLimit);c.setUsedCount(usedCount);
  return c;
 }

 @Test void validateRejectsExpiredCoupon(){
  when(repository.findByCodeIgnoreCase("OLD10")).thenReturn(Optional.of(coupon("OLD10",true,LocalDateTime.now().minusDays(1),null,0)));
  assertThrows(IllegalArgumentException.class,()->controller.validate("OLD10"));
 }

 @Test void validateRejectsInactiveCoupon(){
  when(repository.findByCodeIgnoreCase("OFF")).thenReturn(Optional.of(coupon("OFF",false,null,null,0)));
  assertThrows(IllegalArgumentException.class,()->controller.validate("OFF"));
 }

 @Test void validateRejectsCouponAtUsageLimit(){
  when(repository.findByCodeIgnoreCase("MAXED")).thenReturn(Optional.of(coupon("MAXED",true,null,5,5)));
  assertThrows(IllegalArgumentException.class,()->controller.validate("MAXED"));
 }

 @Test void validateRejectsUnknownCode(){
  when(repository.findByCodeIgnoreCase("NOPE")).thenReturn(Optional.empty());
  assertThrows(IllegalArgumentException.class,()->controller.validate("NOPE"));
 }

 @Test void validateAcceptsUsableCoupon(){
  Coupon c=coupon("OK10",true,LocalDateTime.now().plusDays(1),10,2);
  when(repository.findByCodeIgnoreCase("OK10")).thenReturn(Optional.of(c));
  assertEquals(c,controller.validate("OK10"));
 }

 @Test void activeListFiltersOutExpiredAndExhaustedCoupons(){
  Coupon usable=coupon("GOOD",true,null,null,0);
  Coupon expired=coupon("EXPIRED",true,LocalDateTime.now().minusHours(1),null,0);
  Coupon exhausted=coupon("EXHAUSTED",true,null,1,1);
  when(repository.findByActiveTrue()).thenReturn(List.of(usable,expired,exhausted));
  List<Coupon> result=controller.active();
  assertEquals(1,result.size());
  assertEquals("GOOD",result.get(0).getCode());
 }
}
