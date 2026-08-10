package com.djibtout.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name="product_interactions",indexes={@Index(name="idx_product_interaction_product_type",columnList="product_id,type"),@Index(name="idx_product_interaction_created",columnList="created_at")})
public class ProductInteraction {
    public enum Type { IMPRESSION, CLICK }
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="product_id",nullable=false) private Long productId;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private Type type;
    @Column(length=80) private String placement;
    @CreationTimestamp @Column(name="created_at",nullable=false,updatable=false) private LocalDateTime createdAt;
    public Long getId(){return id;} public Long getProductId(){return productId;} public void setProductId(Long value){productId=value;}
    public Type getType(){return type;} public void setType(Type value){type=value;} public String getPlacement(){return placement;}
    public void setPlacement(String value){placement=value;} public LocalDateTime getCreatedAt(){return createdAt;}
}
