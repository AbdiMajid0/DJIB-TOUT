package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;import com.djibtout.backend.service.SellerAccessService;import jakarta.validation.Valid;import jakarta.validation.constraints.*;import org.springframework.http.ResponseEntity;import org.springframework.security.core.Authentication;import org.springframework.web.bind.annotation.*;import java.time.LocalDateTime;

@RestController @RequestMapping("/api/seller/questions")
public class SellerQuestionController{
 private final ProductQuestionRepository questions;private final UserRepository users;private final SellerAccessService access;
 public SellerQuestionController(ProductQuestionRepository q,UserRepository u,SellerAccessService x){questions=q;users=u;access=x;}
 private User actor(Authentication a){return a==null?null:users.findByEmail(a.getName()).orElse(null);}
 @GetMapping public ResponseEntity<?> list(Authentication a){User s=access.ownerForSupport(actor(a));return s==null?ResponseEntity.status(403).build():ResponseEntity.ok(questions.findByProductSellerIdOrderByCreatedAtDesc(s.getId()));}
 @PutMapping("/{id}/answer") public ResponseEntity<?> answer(Authentication a,@PathVariable Long id,@Valid @RequestBody AnswerInput input){User actor=actor(a);ProductQuestion q=questions.findById(id).orElse(null);if(q==null||q.getProduct().getSeller()==null||!access.canSupport(actor,q.getProduct().getSeller()))return ResponseEntity.status(403).build();q.setAnswer(input.answer().trim());q.setAnsweredAt(LocalDateTime.now());q.setAnsweredBy(actor);return ResponseEntity.ok(questions.save(q));}
 public record AnswerInput(@NotBlank @Size(max=1000) String answer){}
}
