package com.djibtout.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "return_requests")
public class ReturnRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "order_item_id") @JsonIgnoreProperties("order") private OrderItem orderItem;
    @ManyToOne(optional = false) @JoinColumn(name = "buyer_id") @JsonIgnoreProperties({"password","emailVerificationToken","resetPasswordToken"}) private User buyer;
    @ManyToOne(optional = false) @JoinColumn(name = "seller_id") @JsonIgnoreProperties({"password","emailVerificationToken","resetPasswordToken"}) private User seller;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private ReturnStatus status = ReturnStatus.REQUESTED;
    @Column(nullable = false) private Integer quantity;
    @Column(nullable = false, length = 120) private String reason;
    @Column(length = 1000) private String customerComment;
    @Column(length = 1000) private String sellerResponse;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal refundAmount;
    @ElementCollection @CollectionTable(name = "return_evidence", joinColumns = @JoinColumn(name = "return_id")) @Column(name = "image_url", length = 500) private List<String> evidenceUrls = new ArrayList<>();
    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp private LocalDateTime updatedAt;
    public Long getId(){return id;} public OrderItem getOrderItem(){return orderItem;} public void setOrderItem(OrderItem v){orderItem=v;}
    public User getBuyer(){return buyer;} public void setBuyer(User v){buyer=v;} public User getSeller(){return seller;} public void setSeller(User v){seller=v;}
    public ReturnStatus getStatus(){return status;} public void setStatus(ReturnStatus v){status=v;} public Integer getQuantity(){return quantity;} public void setQuantity(Integer v){quantity=v;}
    public String getReason(){return reason;} public void setReason(String v){reason=v;} public String getCustomerComment(){return customerComment;} public void setCustomerComment(String v){customerComment=v;}
    public String getSellerResponse(){return sellerResponse;} public void setSellerResponse(String v){sellerResponse=v;} public BigDecimal getRefundAmount(){return refundAmount;} public void setRefundAmount(BigDecimal v){refundAmount=v;}
    public List<String> getEvidenceUrls(){return evidenceUrls;} public void setEvidenceUrls(List<String> v){evidenceUrls=v==null?new ArrayList<>():v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
