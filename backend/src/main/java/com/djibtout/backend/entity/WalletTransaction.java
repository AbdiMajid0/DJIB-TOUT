package com.djibtout.backend.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name="wallet_transactions")
public class WalletTransaction {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @JsonIgnore @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="wallet_id",nullable=false) private Wallet wallet;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private WalletTransactionType type;
 @Column(nullable=false,precision=14,scale=2) private BigDecimal amount;
 @Column(nullable=false,length=255) private String reason;
 @CreationTimestamp private LocalDateTime createdAt;
 public Long getId(){return id;} public Wallet getWallet(){return wallet;} public void setWallet(Wallet v){wallet=v;}
 public WalletTransactionType getType(){return type;} public void setType(WalletTransactionType v){type=v;}
 public BigDecimal getAmount(){return amount;} public void setAmount(BigDecimal v){amount=v;}
 public String getReason(){return reason;} public void setReason(String v){reason=v;} public LocalDateTime getCreatedAt(){return createdAt;}
}
