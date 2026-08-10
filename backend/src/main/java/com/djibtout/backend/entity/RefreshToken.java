package com.djibtout.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="refresh_tokens", indexes=@Index(name="idx_refresh_token_hash", columnList="token_hash", unique=true))
public class RefreshToken {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false, fetch=FetchType.LAZY) private User user;
    @Column(name="token_hash", nullable=false, unique=true, length=64) private String tokenHash;
    @Column(nullable=false) private LocalDateTime expiresAt;
    @Column(nullable=false) private boolean revoked;
    private LocalDateTime revokedAt;
    private LocalDateTime createdAt=LocalDateTime.now();
    public Long getId(){return id;} public User getUser(){return user;} public void setUser(User v){user=v;}
    public String getTokenHash(){return tokenHash;} public void setTokenHash(String v){tokenHash=v;}
    public LocalDateTime getExpiresAt(){return expiresAt;} public void setExpiresAt(LocalDateTime v){expiresAt=v;}
    public boolean isRevoked(){return revoked;} public void setRevoked(boolean v){revoked=v;}
    public LocalDateTime getRevokedAt(){return revokedAt;} public void setRevokedAt(LocalDateTime v){revokedAt=v;}
    public LocalDateTime getCreatedAt(){return createdAt;}
}
