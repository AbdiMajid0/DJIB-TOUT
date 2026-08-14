package com.djibtout.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "addresses")
public class Address {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JsonIgnore @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false, length = 80) private String label;
    @Column(nullable = false, length = 500) private String fullAddress;
    @Column(nullable = false, length = 100) private String city;
    @Column(length = 30) private String phone;
    @Column(length = 500) private String deliveryInstructions;
    @Column(nullable = false) private boolean isDefault;
    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getFullAddress() { return fullAddress; }
    public void setFullAddress(String fullAddress) { this.fullAddress = fullAddress; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public boolean isDefault() { return isDefault; }
    public void setDefault(boolean value) { isDefault = value; }
    public String getPhone(){return phone;} public void setPhone(String value){phone=value;}
    public String getDeliveryInstructions(){return deliveryInstructions;} public void setDeliveryInstructions(String value){deliveryInstructions=value;}
}
