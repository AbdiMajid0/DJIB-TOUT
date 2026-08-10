package com.djibtout.backend.controller;
import com.djibtout.backend.entity.Coupon; import com.djibtout.backend.repository.CouponRepository; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/coupons") public class CouponController{
 private final CouponRepository repository; public CouponController(CouponRepository r){repository=r;}
 @GetMapping("/active") public List<Coupon> active(){return repository.findByActiveTrue().stream().filter(Coupon::isUsable).toList();}
 @GetMapping("/validate/{code}") public Coupon validate(@PathVariable String code){return repository.findByCodeIgnoreCase(code).filter(Coupon::isUsable).orElseThrow(()->new IllegalArgumentException("Coupon invalide ou expiré."));}
}
