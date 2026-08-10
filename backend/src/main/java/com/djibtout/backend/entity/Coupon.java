package com.djibtout.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="coupons")
public class Coupon {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true, length=40) private String code;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private DiscountType discountType;
    @Column(nullable=false, precision=12, scale=2) private BigDecimal discountValue;
    private LocalDateTime expiresAt;
    private Integer usageLimit;
    @Column(nullable=false) private int usedCount = 0;
    @Column(nullable=false) private boolean active = true;
    public Long getId(){return id;} public String getCode(){return code;} public void setCode(String v){code=v;}
    public DiscountType getDiscountType(){return discountType;} public void setDiscountType(DiscountType v){discountType=v;}
    public BigDecimal getDiscountValue(){return discountValue;} public void setDiscountValue(BigDecimal v){discountValue=v;}
    public LocalDateTime getExpiresAt(){return expiresAt;} public void setExpiresAt(LocalDateTime v){expiresAt=v;}
    public Integer getUsageLimit(){return usageLimit;} public void setUsageLimit(Integer v){usageLimit=v;}
    public int getUsedCount(){return usedCount;} public void setUsedCount(int v){usedCount=v;}
    public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
    public boolean isUsable(){return active && (expiresAt==null || expiresAt.isAfter(LocalDateTime.now())) && (usageLimit==null || usedCount<usageLimit);}
}
