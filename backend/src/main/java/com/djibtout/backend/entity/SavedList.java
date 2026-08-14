package com.djibtout.backend.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;import jakarta.persistence.*;import org.hibernate.annotations.CreationTimestamp;import java.time.LocalDateTime;import java.util.LinkedHashSet;import java.util.Set;
@Entity @Table(name="saved_lists") public class SavedList{
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @JsonIgnore @ManyToOne(optional=false) @JoinColumn(name="user_id") private User user;
 @Column(nullable=false,length=80) private String name;
 @ElementCollection @CollectionTable(name="saved_list_products",joinColumns=@JoinColumn(name="list_id")) @Column(name="product_id") private Set<Long> productIds=new LinkedHashSet<>();
 @CreationTimestamp private LocalDateTime createdAt;
 public Long getId(){return id;} public User getUser(){return user;} public void setUser(User v){user=v;} public String getName(){return name;} public void setName(String v){name=v;} public Set<Long> getProductIds(){return productIds;} public LocalDateTime getCreatedAt(){return createdAt;}
}
