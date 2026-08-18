package com.djibtout.backend.controller;
import com.djibtout.backend.security.CurrentUser;
import com.djibtout.backend.entity.*; import com.djibtout.backend.repository.*;
import jakarta.validation.Valid; import jakarta.validation.constraints.*; import org.springframework.security.core.Authentication; import org.springframework.transaction.annotation.Transactional; import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal; import java.util.*;
@RestController @RequestMapping("/api/wallet") public class WalletController{
 // Le rechargement ne cree pas d'argent : il doit correspondre a un paiement
 // reel. Tant qu'aucune passerelle n'existe, il reste cantonne aux profils
 // qui l'activent explicitement (developpement et tests).
 @org.springframework.beans.factory.annotation.Value("${app.payments.simulated:false}") private boolean rechargementSimule;
 private final WalletRepository wallets;private final WalletTransactionRepository transactions;private final UserRepository users;
 public WalletController(WalletRepository w,WalletTransactionRepository t,UserRepository u){wallets=w;transactions=t;users=u;}
 private Wallet wallet(Authentication a){User u=Optional.ofNullable(CurrentUser.of(users,a)).orElseThrow();return wallets.findByUser(u).orElseGet(()->{Wallet w=new Wallet();w.setUser(u);return wallets.save(w);});}
 @GetMapping public WalletView get(Authentication a){Wallet w=wallet(a);return new WalletView(w.getId(),w.getBalance());}
 @GetMapping("/transactions") public List<WalletTransaction> history(Authentication a){return transactions.findByWalletOrderByCreatedAtDesc(wallet(a));}
 @PostMapping("/topup") @Transactional public org.springframework.http.ResponseEntity<?> topup(Authentication a,@Valid @RequestBody TopupRequest r){
  if(!rechargementSimule)return org.springframework.http.ResponseEntity.status(503).body(Map.of("message","Rechargement indisponible : aucune passerelle de paiement n'est configurée."));
  Wallet w=wallet(a);w.setBalance(w.getBalance().add(r.amount));wallets.save(w);WalletTransaction t=new WalletTransaction();t.setWallet(w);t.setType(WalletTransactionType.CREDIT);t.setAmount(r.amount);t.setReason("Rechargement simulé");transactions.save(t);return org.springframework.http.ResponseEntity.ok(new WalletView(w.getId(),w.getBalance()));}
 public record WalletView(Long id,BigDecimal balance){} public static class TopupRequest{@NotNull @DecimalMin("1.00") @Digits(integer=12,fraction=2) public BigDecimal amount;}
}
