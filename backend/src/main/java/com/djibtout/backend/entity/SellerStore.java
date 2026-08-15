package com.djibtout.backend.entity;
import com.fasterxml.jackson.annotation.JsonIncludeProperties;
import jakarta.persistence.*;
@Entity @Table(name="seller_stores")
public class SellerStore{
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY)private Long id;
 @Version private Long version;
 @JsonIncludeProperties({"id","name","email","suspended"})@OneToOne(optional=false)@JoinColumn(name="seller_id",unique=true)private User seller;
 @Column(nullable=false,length=120)private String name;
 @Column(length=1000)private String description;
 private String logoUrl,bannerUrl;
 @Column(length=1000)private String policies;
 private String businessType,phone;
 private String contactEmail,whatsappNumber;
 @Column(length=1000) private String openingHours;
 @Column(length=2000) private String deliveryPolicy,returnPolicy;
 @Column(length=500)private String businessAddress;
 private String registrationNumber,identityDocumentUrl,businessDocumentUrl;
 private Boolean termsAccepted=false,onboardingSubmitted=false;
 private boolean validated=false;
 public Long getId(){return id;}public User getSeller(){return seller;}public void setSeller(User v){seller=v;}public String getName(){return name;}public void setName(String v){name=v;}public String getDescription(){return description;}public void setDescription(String v){description=v;}public String getLogoUrl(){return logoUrl;}public void setLogoUrl(String v){logoUrl=v;}public String getBannerUrl(){return bannerUrl;}public void setBannerUrl(String v){bannerUrl=v;}public String getPolicies(){return policies;}public void setPolicies(String v){policies=v;}public String getBusinessType(){return businessType;}public void setBusinessType(String v){businessType=v;}public String getPhone(){return phone;}public void setPhone(String v){phone=v;}public String getBusinessAddress(){return businessAddress;}public void setBusinessAddress(String v){businessAddress=v;}public String getRegistrationNumber(){return registrationNumber;}public void setRegistrationNumber(String v){registrationNumber=v;}public String getIdentityDocumentUrl(){return identityDocumentUrl;}public void setIdentityDocumentUrl(String v){identityDocumentUrl=v;}public String getBusinessDocumentUrl(){return businessDocumentUrl;}public void setBusinessDocumentUrl(String v){businessDocumentUrl=v;}public boolean isTermsAccepted(){return Boolean.TRUE.equals(termsAccepted);}public void setTermsAccepted(boolean v){termsAccepted=v;}public boolean isOnboardingSubmitted(){return Boolean.TRUE.equals(onboardingSubmitted);}public void setOnboardingSubmitted(boolean v){onboardingSubmitted=v;}public boolean isValidated(){return validated;}public void setValidated(boolean v){validated=v;}
 public String getContactEmail(){return contactEmail;}public void setContactEmail(String v){contactEmail=v;}public String getWhatsappNumber(){return whatsappNumber;}public void setWhatsappNumber(String v){whatsappNumber=v;}public String getOpeningHours(){return openingHours;}public void setOpeningHours(String v){openingHours=v;}public String getDeliveryPolicy(){return deliveryPolicy;}public void setDeliveryPolicy(String v){deliveryPolicy=v;}public String getReturnPolicy(){return returnPolicy;}public void setReturnPolicy(String v){returnPolicy=v;}
}
