package com.djibtout.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIncludeProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Formula;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Product {
    private Boolean visible = true;
    @Column(precision = 10, scale = 2) private BigDecimal originalPrice;
    @Column(length = 100) private String brand;
    private Integer warrantyMonths;
    private Integer deliveryDays;
    private LocalDateTime flashSaleEndsAt;
    @Formula("(select coalesce(avg(r.rating), 0) from reviews r where r.product_id = id and (r.hidden is null or r.hidden = false))") private Double averageRating;
    @Formula("(select count(r.id) from reviews r where r.product_id = id and (r.hidden is null or r.hidden = false))") private Long reviewCount;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Version
    private Long version;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stockQuantity;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    private List<String> images = new ArrayList<>();

    private String videoUrl;

    @Column(nullable = false)
    private String category;

    // Liste blanche et non liste noire : ce graphe est serialise sur des
    // endpoints publics, et toute colonne ajoutee plus tard a User serait
    // sinon exposee par defaut. L'ancienne liste noire laissait passer
    // email, telephone, date de naissance et instructions de livraison.
    @JsonIncludeProperties({"id", "name"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id")
    private User seller;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Product() {
    }

    public Product(Long id, String name, String description, BigDecimal price, Integer stockQuantity, List<String> images, String videoUrl, String category, User seller, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.images = images;
        this.videoUrl = videoUrl;
        this.category = category;
        this.seller = seller;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public User getSeller() {
        return seller;
    }

    public void setSeller(User seller) {
        this.seller = seller;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    public boolean isVisible() { return visible == null || visible; }
    public void setVisible(boolean visible) { this.visible = visible; }
    public BigDecimal getOriginalPrice(){return originalPrice;} public void setOriginalPrice(BigDecimal v){originalPrice=v;}
    public String getBrand(){return brand;} public void setBrand(String v){brand=v;}
    public Integer getWarrantyMonths(){return warrantyMonths;} public void setWarrantyMonths(Integer v){warrantyMonths=v;}
    public Integer getDeliveryDays(){return deliveryDays;} public void setDeliveryDays(Integer v){deliveryDays=v;}
    public LocalDateTime getFlashSaleEndsAt(){return flashSaleEndsAt;} public void setFlashSaleEndsAt(LocalDateTime v){flashSaleEndsAt=v;}
    public Double getAverageRating(){return averageRating==null?0:averageRating;} public Long getReviewCount(){return reviewCount==null?0:reviewCount;}
    public Integer getDiscountPercentage(){if(originalPrice==null||price==null||originalPrice.signum()<=0||originalPrice.compareTo(price)<=0)return 0;return originalPrice.subtract(price).multiply(new BigDecimal("100")).divide(originalPrice,0,java.math.RoundingMode.HALF_UP).intValue();}
}
