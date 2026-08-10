package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*; import com.djibtout.backend.repository.*;
import jakarta.validation.Valid; import jakarta.validation.constraints.*;
import org.springframework.http.*; import org.springframework.security.core.Authentication; import org.springframework.transaction.annotation.Transactional; import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/addresses")
public class AddressController {
 private final AddressRepository addresses; private final UserRepository users;
 public AddressController(AddressRepository a,UserRepository u){addresses=a;users=u;}
 private User user(Authentication a){return a==null?null:users.findByEmail(a.getName()).orElse(null);}
 @GetMapping public List<Address> list(Authentication a){return addresses.findByUserOrderByIsDefaultDescIdDesc(user(a));}
 @PostMapping @Transactional public ResponseEntity<?> create(Authentication a,@Valid @RequestBody AddressRequest r){User u=user(a); Address x=new Address(); apply(x,r); x.setUser(u); normalizeDefault(u,x); return ResponseEntity.status(201).body(addresses.save(x));}
 @PutMapping("/{id}") @Transactional public ResponseEntity<?> update(Authentication a,@PathVariable Long id,@Valid @RequestBody AddressRequest r){User u=user(a); Address x=addresses.findById(id).orElse(null); if(x==null)return ResponseEntity.notFound().build(); if(!x.getUser().getId().equals(u.getId()))return ResponseEntity.status(403).body("Accès refusé."); apply(x,r); normalizeDefault(u,x); return ResponseEntity.ok(addresses.save(x));}
 @DeleteMapping("/{id}") public ResponseEntity<?> delete(Authentication a,@PathVariable Long id){User u=user(a); Address x=addresses.findById(id).orElse(null); if(x==null)return ResponseEntity.notFound().build(); if(!x.getUser().getId().equals(u.getId()))return ResponseEntity.status(403).body("Accès refusé."); addresses.delete(x); return ResponseEntity.noContent().build();}
 private void apply(Address x,AddressRequest r){x.setLabel(r.label);x.setFullAddress(r.fullAddress);x.setCity(r.city);x.setDefault(r.isDefault);}
 private void normalizeDefault(User u,Address current){List<Address> list=addresses.findByUserOrderByIsDefaultDescIdDesc(u); if(list.isEmpty())current.setDefault(true); if(current.isDefault())list.stream().filter(x->!Objects.equals(x.getId(),current.getId())).forEach(x->{x.setDefault(false);addresses.save(x);});}
 static class AddressRequest{@NotBlank @Size(max=80) public String label;@NotBlank @Size(max=500) public String fullAddress;@NotBlank @Size(max=100) public String city;public boolean isDefault;}
}
