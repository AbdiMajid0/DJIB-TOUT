package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;import jakarta.validation.constraints.*;import org.springframework.http.*;import org.springframework.security.core.Authentication;import org.springframework.web.bind.annotation.*;import java.util.*;
@RestController @RequestMapping("/api/lists") public class SavedListController{
 private final SavedListRepository lists;private final UserRepository users;private final ProductRepository products;public SavedListController(SavedListRepository l,UserRepository u,ProductRepository p){lists=l;users=u;products=p;}
 private User user(Authentication a){return a==null?null:users.findByEmail(a.getName()).orElse(null);} private SavedList owned(Authentication a,Long id){User u=user(a);SavedList x=lists.findById(id).orElse(null);return u!=null&&x!=null&&x.getUser().getId().equals(u.getId())?x:null;}
 /** `open-in-view=false` : la session est fermee des la sortie du repository.
  *  Sans transaction ici, lire `productIds` (@ElementCollection LAZY) leve une
  *  LazyInitializationException — que Spring transforme en 401 trompeur via le
  *  renvoi vers /error. C'etait deja le cas avant, Jackson echouant a la
  *  serialisation de l'entite. */
 @GetMapping @org.springframework.transaction.annotation.Transactional(readOnly=true) public ResponseEntity<?> all(Authentication a){User u=user(a);return u==null?ResponseEntity.status(401).build():ResponseEntity.ok(lists.findByUserOrderByCreatedAtDesc(u).stream().map(this::view).toList());}
 /** La liste ne portait que des identifiants : l'écran affichait « Produit #12 ».
  *  On joint ici le nécessaire à l'affichage. `productIds` est conservé tel quel
  *  pour ne rien casser côté client (comptage, bouton « Retirer »). */
 private Map<String,Object> view(SavedList x){
  Map<Long,Product> byId=new LinkedHashMap<>();
  for(Product p:products.findAllById(x.getProductIds()))byId.put(p.getId(),p);
  List<Map<String,Object>> items=new ArrayList<>();
  for(Long pid:x.getProductIds()){Product p=byId.get(pid);if(p==null)continue;
   Map<String,Object> m=new LinkedHashMap<>();m.put("id",p.getId());m.put("name",p.getName());
   m.put("price",p.getPrice());m.put("images",p.getImages());m.put("category",p.getCategory());
   m.put("visible",p.isVisible());items.add(m);}
  Map<String,Object> v=new LinkedHashMap<>();
  v.put("id",x.getId());v.put("name",x.getName());v.put("createdAt",x.getCreatedAt());
  v.put("productIds",x.getProductIds());v.put("products",items);
  return v;
 }
 @PostMapping @org.springframework.transaction.annotation.Transactional public ResponseEntity<?> create(Authentication a,@RequestBody Map<String,String>b){User u=user(a);String n=b.getOrDefault("name","").trim();if(u==null)return ResponseEntity.status(401).build();if(n.isBlank()||n.length()>80)return ResponseEntity.badRequest().body("Nom de liste invalide.");SavedList x=new SavedList();x.setUser(u);x.setName(n);return ResponseEntity.status(201).body(view(lists.save(x)));}
 @PutMapping("/{id}") @org.springframework.transaction.annotation.Transactional public ResponseEntity<?> rename(Authentication a,@PathVariable Long id,@RequestBody Map<String,String>b){SavedList x=owned(a,id);String n=b.getOrDefault("name","").trim();if(x==null)return ResponseEntity.status(403).build();if(n.isBlank()||n.length()>80)return ResponseEntity.badRequest().body("Nom de liste invalide.");x.setName(n);return ResponseEntity.ok(view(lists.save(x)));}
 @PostMapping("/{id}/products/{productId}") @org.springframework.transaction.annotation.Transactional public ResponseEntity<?> add(Authentication a,@PathVariable Long id,@PathVariable Long productId){SavedList x=owned(a,id);if(x==null)return ResponseEntity.status(403).build();if(!products.existsById(productId))return ResponseEntity.notFound().build();x.getProductIds().add(productId);return ResponseEntity.ok(view(lists.save(x)));}
 @DeleteMapping("/{id}/products/{productId}") @org.springframework.transaction.annotation.Transactional public ResponseEntity<?> remove(Authentication a,@PathVariable Long id,@PathVariable Long productId){SavedList x=owned(a,id);if(x==null)return ResponseEntity.status(403).build();x.getProductIds().remove(productId);return ResponseEntity.ok(view(lists.save(x)));}
 @DeleteMapping("/{id}") public ResponseEntity<?> delete(Authentication a,@PathVariable Long id){SavedList x=owned(a,id);if(x==null)return ResponseEntity.status(403).build();lists.delete(x);return ResponseEntity.noContent().build();}
}
