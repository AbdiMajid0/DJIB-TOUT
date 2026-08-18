package com.djibtout.backend.controller;
import com.djibtout.backend.security.CurrentUser;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;import com.djibtout.backend.service.SellerAccessService;import jakarta.validation.Valid;import jakarta.validation.constraints.*;import org.springframework.http.ResponseEntity;import org.springframework.security.core.Authentication;import org.springframework.web.bind.annotation.*;import java.time.LocalDateTime;

@RestController @RequestMapping("/api/seller/reviews")
public class SellerReviewController{
 private final ReviewRepository reviews;private final UserRepository users;private final SellerAccessService access;
 public SellerReviewController(ReviewRepository r,UserRepository u,SellerAccessService x){reviews=r;users=u;access=x;}
 private User actor(Authentication a){return CurrentUser.of(users,a);}
 @GetMapping public ResponseEntity<?> list(Authentication a){User s=access.ownerForSupport(actor(a));return s==null?ResponseEntity.status(403).build():ResponseEntity.ok(reviews.findByProductSellerIdOrderByCreatedAtDesc(s.getId()));}
 @PutMapping("/{id}/response") public ResponseEntity<?> respond(Authentication a,@PathVariable Long id,@Valid @RequestBody ResponseInput input){User actor=actor(a);Review r=reviews.findById(id).orElse(null);if(r==null||r.getProduct().getSeller()==null||!access.canSupport(actor,r.getProduct().getSeller()))return ResponseEntity.status(403).build();r.setSellerResponse(input.response().trim());r.setSellerRespondedAt(LocalDateTime.now());r.setSellerRespondedBy(actor);return ResponseEntity.ok(reviews.save(r));}
 public record ResponseInput(@NotBlank @Size(max=1000) String response){}
}
