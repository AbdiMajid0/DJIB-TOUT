package com.djibtout.backend.controller;
import com.djibtout.backend.entity.SellerStore;import com.djibtout.backend.repository.*;import org.springframework.http.*;import org.springframework.web.bind.annotation.*;import java.util.*;
@RestController @RequestMapping("/api/public/stores") public class PublicStoreController{
 private final SellerStoreRepository stores;private final ProductRepository products;
 public PublicStoreController(SellerStoreRepository s,ProductRepository p){stores=s;products=p;}
 @GetMapping("/{id}") public ResponseEntity<?> one(@PathVariable Long id){return view(stores.findById(id).orElse(null));}
 @GetMapping("/by-seller/{sellerId}") public ResponseEntity<?> seller(@PathVariable Long sellerId){return view(stores.findBySellerId(sellerId).orElse(null));}
 private ResponseEntity<?> view(SellerStore s){if(s==null||!s.isValidated())return ResponseEntity.notFound().build();Map<String,Object> v=new LinkedHashMap<>();v.put("id",s.getId());v.put("sellerId",s.getSeller().getId());v.put("name",s.getName());v.put("description",Objects.toString(s.getDescription(),""));v.put("logoUrl",Objects.toString(s.getLogoUrl(),""));v.put("bannerUrl",Objects.toString(s.getBannerUrl(),""));v.put("phone",Objects.toString(s.getPhone(),""));v.put("contactEmail",Objects.toString(s.getContactEmail(),""));v.put("whatsappNumber",Objects.toString(s.getWhatsappNumber(),""));v.put("businessAddress",Objects.toString(s.getBusinessAddress(),""));v.put("openingHours",Objects.toString(s.getOpeningHours(),""));v.put("deliveryPolicy",Objects.toString(s.getDeliveryPolicy(),""));v.put("returnPolicy",Objects.toString(s.getReturnPolicy(),""));v.put("products",products.findBySellerIdOrderByIdDesc(s.getSeller().getId()).stream().filter(p->p.isVisible()).toList());return ResponseEntity.ok(v);}
}
