package com.djibtout.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "users") // 'user' is a reserved keyword in Postgres
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @JsonIgnore
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    private AuthProvider provider = AuthProvider.LOCAL;
    private Boolean emailVerified = false;
    // Jamais serialises : GET /api/admin/users renvoie l'entite complete, et un
    // passwordResetToken suffit a prendre le controle d'un compte. Ils sont lus
    // depuis le corps de requete, jamais recus en JSON : masquer ne casse rien.
    @JsonIgnore @Column(unique = true) private String emailVerificationToken;
    @JsonIgnore @Column(unique = true) private String passwordResetToken;
    @JsonIgnore private LocalDateTime passwordResetExpiresAt;
    @Column(length=30) private String phone;
    private LocalDate birthDate;
    @Column(length=5) private String preferredLanguage="fr";
    @Column(length=500) private String deliveryInstructions;
    private Boolean orderNotifications=true;
    private Boolean promotionNotifications=false;
    private Boolean accountDeleted=false;
    private Boolean suspended=false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public User() {
    }

    public User(Long id, String name, String email, String password, Role role, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
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

    public AuthProvider getProvider() {
        return provider;
    }

    public void setProvider(AuthProvider provider) {
        this.provider = provider;
    }
    public boolean isEmailVerified(){return Boolean.TRUE.equals(emailVerified);} public void setEmailVerified(boolean v){emailVerified=v;}
    public String getEmailVerificationToken(){return emailVerificationToken;} public void setEmailVerificationToken(String v){emailVerificationToken=v;}
    public String getPasswordResetToken(){return passwordResetToken;} public void setPasswordResetToken(String v){passwordResetToken=v;}
    public LocalDateTime getPasswordResetExpiresAt(){return passwordResetExpiresAt;} public void setPasswordResetExpiresAt(LocalDateTime v){passwordResetExpiresAt=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;} public boolean isOrderNotifications(){return !Boolean.FALSE.equals(orderNotifications);} public void setOrderNotifications(boolean v){orderNotifications=v;} public boolean isPromotionNotifications(){return Boolean.TRUE.equals(promotionNotifications);} public void setPromotionNotifications(boolean v){promotionNotifications=v;} public boolean isAccountDeleted(){return Boolean.TRUE.equals(accountDeleted);} public void setAccountDeleted(boolean v){accountDeleted=v;}
    public boolean isSuspended(){return Boolean.TRUE.equals(suspended);} public void setSuspended(boolean value){suspended=value;}
    public LocalDate getBirthDate(){return birthDate;} public void setBirthDate(LocalDate value){birthDate=value;}
    public String getPreferredLanguage(){return preferredLanguage==null?"fr":preferredLanguage;} public void setPreferredLanguage(String value){preferredLanguage=value;}
    public String getDeliveryInstructions(){return deliveryInstructions;} public void setDeliveryInstructions(String value){deliveryInstructions=value;}
}
