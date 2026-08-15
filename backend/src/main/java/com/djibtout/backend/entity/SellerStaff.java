package com.djibtout.backend.entity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;import com.fasterxml.jackson.annotation.JsonIncludeProperties;
import jakarta.persistence.*;import org.hibernate.annotations.CreationTimestamp;import java.time.LocalDateTime;
@Entity @Table(name="seller_staff",uniqueConstraints=@UniqueConstraint(columnNames={"store_id","user_id"})) public class SellerStaff{
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) @JoinColumn(name="store_id") private SellerStore store;
 @ManyToOne(optional=false) @JoinColumn(name="user_id") @JsonIncludeProperties({"id","name","email"}) private User user;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private SellerStaffRole staffRole;
 @CreationTimestamp private LocalDateTime createdAt;
 public Long getId(){return id;} public SellerStore getStore(){return store;} public void setStore(SellerStore v){store=v;} public User getUser(){return user;} public void setUser(User v){user=v;} public SellerStaffRole getStaffRole(){return staffRole;} public void setStaffRole(SellerStaffRole v){staffRole=v;} public LocalDateTime getCreatedAt(){return createdAt;}
}
