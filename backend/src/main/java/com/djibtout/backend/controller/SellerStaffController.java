package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;import jakarta.validation.Valid;import jakarta.validation.constraints.*;import org.springframework.http.ResponseEntity;import org.springframework.security.core.Authentication;import org.springframework.web.bind.annotation.*;import java.util.Locale;
@RestController @RequestMapping("/api/seller/team") public class SellerStaffController{
 private final UserRepository users;private final SellerStoreRepository stores;private final SellerStaffRepository staff;
 public SellerStaffController(UserRepository u,SellerStoreRepository s,SellerStaffRepository t){users=u;stores=s;staff=t;}
 private User owner(Authentication a){User u=a==null?null:users.findByEmail(a.getName()).orElse(null);return u!=null&&(u.getRole()==Role.SELLER||u.getRole()==Role.ADMIN)?u:null;}
 private SellerStore store(User u){return u==null?null:stores.findBySeller(u).orElse(null);}
 @GetMapping public ResponseEntity<?> list(Authentication a){SellerStore s=store(owner(a));return s==null?ResponseEntity.status(403).build():ResponseEntity.ok(staff.findByStoreOrderByCreatedAtDesc(s));}
 @PostMapping public ResponseEntity<?> invite(Authentication a,@Valid @RequestBody Invite input){SellerStore s=store(owner(a));if(s==null)return ResponseEntity.status(403).build();User member=users.findByEmail(input.email().trim().toLowerCase(Locale.ROOT)).orElse(null);if(member==null)return ResponseEntity.badRequest().body("Ce collaborateur doit d’abord créer un compte DjibTout.");if(member.getId().equals(s.getSeller().getId()))return ResponseEntity.badRequest().body("Le propriétaire ne peut pas être ajouté comme employé.");SellerStaff entry=staff.findByStoreAndUser(s,member).orElseGet(SellerStaff::new);entry.setStore(s);entry.setUser(member);entry.setStaffRole(input.role());return ResponseEntity.ok(staff.save(entry));}
 @DeleteMapping("/{id}") public ResponseEntity<?> remove(Authentication a,@PathVariable Long id){SellerStore s=store(owner(a));SellerStaff entry=staff.findById(id).orElse(null);if(s==null||entry==null||!entry.getStore().getId().equals(s.getId()))return ResponseEntity.status(403).build();staff.delete(entry);return ResponseEntity.noContent().build();}
 public record Invite(@NotBlank @Email String email,@NotNull SellerStaffRole role){}
}
