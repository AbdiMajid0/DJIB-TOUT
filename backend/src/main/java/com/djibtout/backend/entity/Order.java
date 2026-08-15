package com.djibtout.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "orders",uniqueConstraints=@UniqueConstraint(name="uk_order_buyer_idempotency",columnNames={"buyer_id","idempotency_key"})) // 'order' is reserved
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Version
    private Long version;

    // GET /api/orders/{id} renvoyait l'entite : le vendeur recevait le compte
    // complet de l'acheteur. Aucun ecran ne lit ce champ — les vues qui ont
    // besoin du nom le construisent explicitement.
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    @Column(precision=10,scale=2) private BigDecimal subtotalAmount;
    @Column(precision=10,scale=2) private BigDecimal discountAmount=BigDecimal.ZERO;
    @Column(precision=10,scale=2) private BigDecimal deliveryFee=BigDecimal.ZERO;
    @Column(length=50) private String couponCode;
    @Column(name="idempotency_key",length=80) private String idempotencyKey;
    @Column(name="reserved_until") private LocalDateTime reservedUntil;

    // Delivery Address fields could go here or in a separate entity
    @Column(nullable = false)
    private String deliveryAddress;

    @Column(nullable = false)
    private String paymentMethod; // e.g., "COD", "WAAFI"
    @Column(length=30) private String deliveryMethod="STANDARD";

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Order() {
    }

    public Order(Long id, User buyer, OrderStatus status, BigDecimal totalAmount, String deliveryAddress, String paymentMethod, List<OrderItem> items, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.buyer = buyer;
        this.status = status;
        this.totalAmount = totalAmount;
        this.deliveryAddress = deliveryAddress;
        this.paymentMethod = paymentMethod;
        this.items = items;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getBuyer() {
        return buyer;
    }

    public void setBuyer(User buyer) {
        this.buyer = buyer;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
    public BigDecimal getSubtotalAmount(){return subtotalAmount;} public void setSubtotalAmount(BigDecimal v){subtotalAmount=v;}
    public BigDecimal getDiscountAmount(){return discountAmount;} public void setDiscountAmount(BigDecimal v){discountAmount=v;}
    public BigDecimal getDeliveryFee(){return deliveryFee;} public void setDeliveryFee(BigDecimal v){deliveryFee=v;}
    public String getCouponCode(){return couponCode;} public void setCouponCode(String v){couponCode=v;}
    public String getIdempotencyKey(){return idempotencyKey;} public void setIdempotencyKey(String v){idempotencyKey=v;}
    public LocalDateTime getReservedUntil(){return reservedUntil;} public void setReservedUntil(LocalDateTime v){reservedUntil=v;}

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
    public String getDeliveryMethod(){return deliveryMethod;} public void setDeliveryMethod(String v){deliveryMethod=v;}

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
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

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
