package com.djibtout.backend.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
@Entity @Table(name="wallets")
public class Wallet {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @JsonIgnore @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id",nullable=false,unique=true) private User user;
 @Column(nullable=false,precision=14,scale=2) private BigDecimal balance=BigDecimal.ZERO;
 @Version private Long version;
 public Long getId(){return id;} public User getUser(){return user;} public void setUser(User v){user=v;}
 public BigDecimal getBalance(){return balance;} public void setBalance(BigDecimal v){balance=v;}
}
