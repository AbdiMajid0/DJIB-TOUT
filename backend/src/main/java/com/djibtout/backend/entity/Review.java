package com.djibtout.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"seller", "hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @JsonIgnoreProperties({"password", "role", "hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer rating; // 1 to 5

    @Column(columnDefinition = "TEXT", nullable = false)
    private String comment;
    private Boolean hidden=false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "seller_response", length = 1000) private String sellerResponse;
    @Column(name = "seller_responded_at") private LocalDateTime sellerRespondedAt;
    @JsonIgnoreProperties({"password", "email", "role", "hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "seller_responded_by_id") private User sellerRespondedBy;

    public Review() {
    }

    public Review(Product product, User user, Integer rating, String comment) {
        this.product = product;
        this.user = user;
        this.rating = rating;
        this.comment = comment;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public String getSellerResponse(){return sellerResponse;} public void setSellerResponse(String v){sellerResponse=v;}
    public LocalDateTime getSellerRespondedAt(){return sellerRespondedAt;} public void setSellerRespondedAt(LocalDateTime v){sellerRespondedAt=v;}
    public User getSellerRespondedBy(){return sellerRespondedBy;} public void setSellerRespondedBy(User v){sellerRespondedBy=v;} public boolean isHidden(){return Boolean.TRUE.equals(hidden);} public void setHidden(boolean v){hidden=v;}
}
