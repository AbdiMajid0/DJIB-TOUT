package com.djibtout.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Notification destinee a l'acheteur. Volontairement distincte de
 * SellerNotification : celle-ci porte une colonne `seller_id` et son controleur
 * refuse les comptes non-SELLER. Melanger les deux aurait rendu la table
 * ambigue pour toute lecture ulterieure.
 */
@Entity @Table(name = "buyer_notifications")
public class BuyerNotification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id") private User user;
    @Column(nullable = false, length = 120) private String title;
    @Column(length = 1000) private String message;
    /** Cible facultative dans l'application, ex. /orders/12. */
    @Column(length = 255) private String link;
    @Column(nullable = false) private boolean read = false;
    @Column(nullable = false) private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId(){return id;}
    public User getUser(){return user;} public void setUser(User v){user=v;}
    public String getTitle(){return title;} public void setTitle(String v){title=v;}
    public String getMessage(){return message;} public void setMessage(String v){message=v;}
    public String getLink(){return link;} public void setLink(String v){link=v;}
    public boolean isRead(){return read;} public void setRead(boolean v){read=v;}
    public LocalDateTime getCreatedAt(){return createdAt;}
}
