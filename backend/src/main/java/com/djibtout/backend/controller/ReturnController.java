package com.djibtout.backend.controller;
import com.djibtout.backend.service.SellerEventService;

import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;import com.djibtout.backend.service.SellerAccessService;import jakarta.validation.Valid;import jakarta.validation.constraints.*;
import org.springframework.http.ResponseEntity;import org.springframework.security.core.Authentication;import org.springframework.transaction.annotation.Transactional;import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;import java.util.List;

@RestController @RequestMapping("/api")
public class ReturnController {
    private final ReturnRequestRepository returns; private final OrderRepository orders; private final UserRepository users; private final SellerAccessService access;private final SellerEventService events;
    public ReturnController(ReturnRequestRepository returns,OrderRepository orders,UserRepository users,SellerAccessService access,SellerEventService events){this.returns=returns;this.orders=orders;this.users=users;this.access=access;this.events=events;}
    private User current(Authentication a){return a==null?null:users.findByEmail(a.getName()).orElse(null);}

    @GetMapping("/returns/my") public ResponseEntity<?> mine(Authentication a){User user=current(a);return user==null?ResponseEntity.status(401).build():ResponseEntity.ok(returns.findByBuyerOrderByCreatedAtDesc(user));}

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
        ReturnRequest saved=returns.save(request);events.notify(request.getSeller(),"Nouvelle demande de retour","Le client a demandé le retour de « "+item.getProduct().getName()+" ».");return ResponseEntity.ok(saved);
    }

    @GetMapping("/seller/returns") public ResponseEntity<?> sellerReturns(Authentication a){User seller=access.ownerForOrders(current(a));if(seller==null)return ResponseEntity.status(403).build();return ResponseEntity.ok(returns.findBySellerOrderByCreatedAtDesc(seller));}

    @PatchMapping("/seller/returns/{id}")
    public ResponseEntity<?> update(Authentication a,@PathVariable Long id,@Valid @RequestBody UpdateReturn input){
        User seller=current(a);ReturnRequest request=returns.findById(id).orElse(null);if(request==null||!access.canManageOrders(seller,request.getSeller()))return ResponseEntity.status(403).build();
        ReturnStatus next=input.status();ReturnStatus current=request.getStatus();
        boolean valid=(current==ReturnStatus.REQUESTED&&(next==ReturnStatus.APPROVED||next==ReturnStatus.REJECTED))||(current==ReturnStatus.APPROVED&&next==ReturnStatus.RECEIVED);
        if(!valid)return ResponseEntity.status(409).body("Transition de retour invalide.");
        if(next==ReturnStatus.REJECTED&&(input.response()==null||input.response().isBlank()))return ResponseEntity.badRequest().body("Un motif de refus est obligatoire.");
        request.setStatus(next);request.setSellerResponse(input.response());events.audit(seller,"RETURN_UPDATED","return="+id+", status="+next);return ResponseEntity.ok(returns.save(request));
    }

    public record CreateReturn(@NotNull Long orderId,@NotNull Long orderItemId,@Min(1) int quantity,@NotBlank @Size(max=120) String reason,@Size(max=1000) String comment,@Size(max=5) List<String> evidenceUrls){}
    public record UpdateReturn(@NotNull ReturnStatus status,@Size(max=1000) String response){}
}
