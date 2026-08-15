package com.djibtout.backend.controller;
import com.djibtout.backend.service.SellerEventService;

import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;import com.djibtout.backend.service.SellerAccessService;import jakarta.validation.Valid;import jakarta.validation.constraints.*;
import org.springframework.http.ResponseEntity;import org.springframework.security.core.Authentication;import org.springframework.transaction.annotation.Transactional;import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;import java.util.List;

@RestController @RequestMapping("/api")
public class ReturnController {
    private final ReturnRequestRepository returns; private final OrderRepository orders; private final UserRepository users; private final SellerAccessService access;private final SellerEventService events;private final com.djibtout.backend.service.BuyerNotificationService buyerNotifications;
    public ReturnController(ReturnRequestRepository returns,OrderRepository orders,UserRepository users,SellerAccessService access,SellerEventService events,com.djibtout.backend.service.BuyerNotificationService buyerNotifications){this.returns=returns;this.orders=orders;this.users=users;this.access=access;this.events=events;this.buyerNotifications=buyerNotifications;}
    private User current(Authentication a){return a==null?null:users.findByEmail(a.getName()).orElse(null);}

    /**
     * L'entite ne peut pas etre serialisee telle quelle : `orderItem.product`
     * est un proxy LAZY et `open-in-view=false` ferme la session avant
     * l'ecriture de la reponse — tout retour deja persiste sortait en 500.
     * Cette vue est construite dans la transaction et suffit aux deux ecrans,
     * qui ne lisent du graphe que le nom du produit.
     */
    private java.util.Map<String,Object> view(ReturnRequest r){
        java.util.Map<String,Object> v=new java.util.LinkedHashMap<>();
        v.put("id",r.getId());v.put("status",r.getStatus());v.put("quantity",r.getQuantity());
        v.put("reason",r.getReason());v.put("customerComment",r.getCustomerComment());
        v.put("sellerResponse",r.getSellerResponse());v.put("refundAmount",r.getRefundAmount());
        // Copie et non reference : passer la collection paresseuse telle quelle
        // ne l'initialise pas, et Jackson la lit apres la fermeture de session.
        v.put("evidenceUrls",new java.util.ArrayList<>(r.getEvidenceUrls()));
        v.put("createdAt",r.getCreatedAt());v.put("updatedAt",r.getUpdatedAt());
        OrderItem item=r.getOrderItem();
        java.util.Map<String,Object> itemView=new java.util.LinkedHashMap<>();
        if(item!=null){
            itemView.put("id",item.getId());itemView.put("quantity",item.getQuantity());itemView.put("price",item.getPrice());
            Product p=item.getProduct();
            java.util.Map<String,Object> produit=new java.util.LinkedHashMap<>();
            if(p!=null){produit.put("id",p.getId());produit.put("name",p.getName());produit.put("images",p.getImages()==null?java.util.List.of():new java.util.ArrayList<>(p.getImages()));}
            itemView.put("product",produit);
        }
        v.put("orderItem",itemView);
        if(r.getBuyer()!=null){java.util.Map<String,Object> b=new java.util.LinkedHashMap<>();b.put("id",r.getBuyer().getId());b.put("name",r.getBuyer().getName());v.put("buyer",b);}
        return v;
    }

    @GetMapping("/returns/my") @Transactional(readOnly=true) public ResponseEntity<?> mine(Authentication a){User user=current(a);return user==null?ResponseEntity.status(401).build():ResponseEntity.ok(returns.findByBuyerOrderByCreatedAtDesc(user).stream().map(this::view).toList());}

    @PostMapping("/returns") @Transactional
    public ResponseEntity<?> create(Authentication a,@Valid @RequestBody CreateReturn input){
        User buyer=current(a);if(buyer==null)return ResponseEntity.status(401).build();
        Order order=orders.findById(input.orderId()).orElse(null);if(order==null||!order.getBuyer().getId().equals(buyer.getId()))return ResponseEntity.status(403).body("Commande inaccessible.");
        if(order.getStatus()!=OrderStatus.DELIVERED)return ResponseEntity.status(409).body("Un retour ne peut être demandé qu’après livraison.");
        OrderItem item=order.getItems().stream().filter(i->i.getId().equals(input.orderItemId())).findFirst().orElse(null);
        if(item==null||item.getProduct().getSeller()==null)return ResponseEntity.badRequest().body("Article invalide.");
        if(input.quantity()>item.getQuantity())return ResponseEntity.badRequest().body("La quantité retournée dépasse la quantité achetée.");
        if(returns.existsByOrderItemAndStatusIn(item,List.of(ReturnStatus.REQUESTED,ReturnStatus.APPROVED,ReturnStatus.RECEIVED)))return ResponseEntity.status(409).body("Un retour est déjà ouvert pour cet article.");
        ReturnRequest request=new ReturnRequest();request.setOrderItem(item);request.setBuyer(buyer);request.setSeller(item.getProduct().getSeller());request.setQuantity(input.quantity());request.setReason(input.reason().trim());request.setCustomerComment(input.comment());request.setEvidenceUrls(input.evidenceUrls());request.setRefundAmount(item.getPrice().multiply(BigDecimal.valueOf(input.quantity())));
        ReturnRequest saved=returns.save(request);events.notify(request.getSeller(),"Nouvelle demande de retour","Le client a demandé le retour de « "+item.getProduct().getName()+" ».");return ResponseEntity.ok(view(saved));
    }

    /**
     * Retrait de la demande par l'acheteur. Autorise uniquement tant que le
     * vendeur ne s'est pas prononce : une fois APPROVED ou REJECTED, la decision
     * lui appartient. Le vendeur est prevenu, sans quoi il continuerait a voir
     * une demande que le client a abandonnee.
     */
    @PostMapping("/returns/{id}/cancel") @Transactional
    public ResponseEntity<?> cancel(Authentication a,@PathVariable Long id){
        User buyer=current(a);if(buyer==null)return ResponseEntity.status(401).build();
        ReturnRequest request=returns.findById(id).orElse(null);
        if(request==null||!request.getBuyer().getId().equals(buyer.getId()))return ResponseEntity.status(403).body("Retour inaccessible.");
        if(request.getStatus()!=ReturnStatus.REQUESTED)return ResponseEntity.status(409).body("Ce retour ne peut plus être annulé : le vendeur l'a déjà traité.");
        request.setStatus(ReturnStatus.CANCELLED);
        ReturnRequest saved=returns.save(request);
        events.notify(request.getSeller(),"Demande de retour annulée","Le client a retiré sa demande de retour.");
        events.audit(buyer,"RETURN_CANCELLED","return="+id);
        return ResponseEntity.ok(view(saved));
    }

    @GetMapping("/seller/returns") @Transactional(readOnly=true) public ResponseEntity<?> sellerReturns(Authentication a){User seller=access.ownerForOrders(current(a));if(seller==null)return ResponseEntity.status(403).build();return ResponseEntity.ok(returns.findBySellerOrderByCreatedAtDesc(seller).stream().map(this::view).toList());}

    @PatchMapping("/seller/returns/{id}") @Transactional
    public ResponseEntity<?> update(Authentication a,@PathVariable Long id,@Valid @RequestBody UpdateReturn input){
        User seller=current(a);ReturnRequest request=returns.findById(id).orElse(null);if(request==null||!access.canManageOrders(seller,request.getSeller()))return ResponseEntity.status(403).build();
        ReturnStatus next=input.status();ReturnStatus current=request.getStatus();
        boolean valid=(current==ReturnStatus.REQUESTED&&(next==ReturnStatus.APPROVED||next==ReturnStatus.REJECTED))||(current==ReturnStatus.APPROVED&&next==ReturnStatus.RECEIVED);
        if(!valid)return ResponseEntity.status(409).body("Transition de retour invalide.");
        if(next==ReturnStatus.REJECTED&&(input.response()==null||input.response().isBlank()))return ResponseEntity.badRequest().body("Un motif de refus est obligatoire.");
        request.setStatus(next);request.setSellerResponse(input.response());events.audit(seller,"RETURN_UPDATED","return="+id+", status="+next);
        String titre=switch(next){case APPROVED->"Retour accepté";case REJECTED->"Retour refusé";case RECEIVED->"Retour reçu";default->"Retour mis à jour";};
        String detail=next==ReturnStatus.REJECTED&&input.response()!=null?" Motif : "+input.response():"";
        buyerNotifications.notify(request.getBuyer(),titre,"Votre demande de retour #"+id+" a été traitée par le vendeur."+detail,"/account/returns");
        return ResponseEntity.ok(view(returns.save(request)));
    }

    public record CreateReturn(@NotNull Long orderId,@NotNull Long orderItemId,@Min(1) int quantity,@NotBlank @Size(max=120) String reason,@Size(max=1000) String comment,@Size(max=5) List<String> evidenceUrls){}
    public record UpdateReturn(@NotNull ReturnStatus status,@Size(max=1000) String response){}
}
