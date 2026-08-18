package com.djibtout.backend.controller;
import com.djibtout.backend.security.CurrentUser;
import com.djibtout.backend.entity.*; import com.djibtout.backend.repository.*;
import jakarta.validation.Valid; import jakarta.validation.constraints.*; import org.springframework.http.ResponseEntity; import org.springframework.security.core.Authentication; import org.springframework.transaction.annotation.Transactional; import org.springframework.web.bind.annotation.*;
import com.djibtout.backend.service.payment.*;
import org.springframework.beans.factory.annotation.Value;
import java.math.BigDecimal; import java.util.*;
@RestController @RequestMapping("/api/payments") public class PaymentController{
 private final PaymentRepository payments;private final OrderRepository orders;private final ProductRepository products;private final UserRepository users;private final WalletRepository wallets;private final WalletTransactionRepository walletTransactions;private final com.djibtout.backend.service.BuyerNotificationService buyerNotifications;
 // Optional et non @Autowired : hors developpement aucune passerelle n'est
 // publiee, et l'absence doit se traduire par un refus explicite plutot que
 // par un paiement accepte sans contrepartie.
 private final Optional<PaymentGateway> passerelle;
 @Value("${app.frontend-url:}") private String frontendUrl;
 public PaymentController(PaymentRepository p,OrderRepository o,ProductRepository pr,UserRepository u,WalletRepository w,WalletTransactionRepository wt,com.djibtout.backend.service.BuyerNotificationService bn,Optional<PaymentGateway> passerelle){payments=p;orders=o;products=pr;users=u;wallets=w;walletTransactions=wt;buyerNotifications=bn;this.passerelle=passerelle;}
 @PostMapping("/process") @Transactional public ResponseEntity<?> process(Authentication auth,@Valid @RequestBody PaymentRequest r){Order o=orders.findById(r.orderId).orElse(null);if(o==null)return bad("Commande introuvable.",r.orderId);User u=CurrentUser.of(users,auth);if(u==null||!o.getBuyer().getId().equals(u.getId()))return ResponseEntity.status(403).body(new PaymentResponse(false,"Accès refusé.",null,o.getId()));if(o.getStatus()!=OrderStatus.PENDING)return bad("Cette commande ne peut plus être payée.",o.getId());if(r.amount.compareTo(o.getTotalAmount())!=0)return bad("Le montant ne correspond pas au total de la commande.",o.getId());
  if(o.getReservedUntil()!=null&&o.getReservedUntil().isBefore(java.time.LocalDateTime.now())){failed(o,r,o.getTotalAmount(),"Réservation expirée.");return bad("La réservation de stock a expiré.",o.getId());}BigDecimal amount=o.getTotalAmount();String method=r.paymentMethod.toUpperCase();
  String transactionId;
  if("DJIBPAY".equals(method)){
   // Portefeuille interne : aucun mouvement externe, donc pas de passerelle.
   // Son alimentation, elle, en depend (voir WalletController.topup).
   Wallet w=wallets.findByUser(u).orElse(null);if(w==null||w.getBalance().compareTo(amount)<0)return bad("Solde Djibpay insuffisant.",o.getId());
   w.setBalance(w.getBalance().subtract(amount));wallets.save(w);
   WalletTransaction wt=new WalletTransaction();wt.setWallet(w);wt.setType(WalletTransactionType.DEBIT);wt.setAmount(amount);wt.setReason("Paiement commande #"+o.getId());walletTransactions.save(wt);
   transactionId=reference();
  }else{
   if(r.phoneNumber==null||r.phoneNumber.isBlank())return bad("Numéro de téléphone requis.",o.getId());
   PaymentGateway gateway=passerelle.orElse(null);
   // Sans prestataire configure, le code precedent marquait la commande payee
   // sans qu'aucun argent n'ait bouge. On refuse desormais franchement.
   if(gateway==null)return ResponseEntity.status(503).body(new PaymentResponse(false,"Paiement indisponible : aucune passerelle n'est configurée.",null,o.getId()));
   PaymentResult resultat=gateway.initiate(new PaymentIntent(o.getId(),amount,method,r.phoneNumber,frontendUrl==null||frontendUrl.isBlank()?null:frontendUrl+"/confirmation?order="+o.getId()));
   if(resultat.outcome()==PaymentOutcome.REFUSE){failed(o,r,amount,resultat.failureReason()==null?"Paiement refusé.":resultat.failureReason());return ResponseEntity.ok(new PaymentResponse(false,"Paiement refusé.",null,o.getId()));}
   if(resultat.outcome()==PaymentOutcome.REDIRECTION){
    // Le paiement n'est pas acquis : la commande reste PENDING et seul le
    // webhook du prestataire la confirmera. Le client doit etre renvoye vers
    // redirectUrl (parcours 3-D Secure) — le frontend ne le gere pas encore.
    payments.save(new Payment(o,method,r.phoneNumber,amount,"PENDING",resultat.transactionId(),null));
    return ResponseEntity.ok(new PaymentResponse(false,"Redirection requise pour finaliser le paiement.",resultat.transactionId(),o.getId(),resultat.redirectUrl()));
   }
   transactionId=resultat.transactionId();
  }
  payments.save(new Payment(o,method,r.phoneNumber==null?"DJIBPAY":r.phoneNumber,amount,"SUCCESS",transactionId,null));o.setStatus(OrderStatus.PROCESSING);orders.save(o);
  buyerNotifications.notify(u,"Paiement confirmé","Votre paiement de "+amount+" FDJ pour la commande #"+o.getId()+" a été accepté.","/orders/"+o.getId());
  return ResponseEntity.ok(new PaymentResponse(true,"Paiement réussi.",transactionId,o.getId()));}
 @GetMapping("/my/history") public ResponseEntity<?> history(Authentication auth,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size){User u=CurrentUser.of(users,auth);return u==null?ResponseEntity.status(401).build():ResponseEntity.ok(payments.findByOrderBuyerOrderByCreatedAtDesc(u,OrderController.pageRequest(page,size)));}
 @GetMapping("/{orderId}") public ResponseEntity<?> details(Authentication auth,@PathVariable Long orderId){Order o=orders.findById(orderId).orElse(null);if(o==null)return ResponseEntity.notFound().build();User u=CurrentUser.of(users,auth);if(u==null||(!o.getBuyer().getId().equals(u.getId())&&u.getRole()!=Role.ADMIN))return ResponseEntity.status(403).body("Accès refusé.");return ResponseEntity.ok(payments.findByOrderOrderByCreatedAtDesc(o));}
 private String reference(){return "TXN-"+UUID.randomUUID().toString().substring(0,8).toUpperCase();}
 private ResponseEntity<?> bad(String m,Long id){return ResponseEntity.badRequest().body(new PaymentResponse(false,m,null,id));}
 private void failed(Order o,PaymentRequest r,BigDecimal amount,String reason){payments.save(new Payment(o,r.paymentMethod,r.phoneNumber,amount,"FAILED",null,reason));o.setStatus(OrderStatus.CANCELLED);orders.save(o);for(OrderItem i:o.getItems()){Product p=i.getProduct();p.setStockQuantity(p.getStockQuantity()+i.getQuantity());products.save(p);}}
 static class PaymentRequest{@NotNull Long orderId;@NotBlank String paymentMethod;String phoneNumber;@NotNull @DecimalMin("0.01") BigDecimal amount;public Long getOrderId(){return orderId;}public void setOrderId(Long v){orderId=v;}public String getPaymentMethod(){return paymentMethod;}public void setPaymentMethod(String v){paymentMethod=v;}public String getPhoneNumber(){return phoneNumber;}public void setPhoneNumber(String v){phoneNumber=v;}public BigDecimal getAmount(){return amount;}public void setAmount(BigDecimal v){amount=v;}}
 static class PaymentResponse{private final boolean success;private final String message,transactionId,redirectUrl;private final Long orderId;
  PaymentResponse(boolean s,String m,String t,Long o){this(s,m,t,o,null);}
  PaymentResponse(boolean s,String m,String t,Long o,String redirect){success=s;message=m;transactionId=t;orderId=o;redirectUrl=redirect;}
  public boolean isSuccess(){return success;}public String getMessage(){return message;}public String getTransactionId(){return transactionId;}public Long getOrderId(){return orderId;}public String getRedirectUrl(){return redirectUrl;}}
}
