package com.djibtout.backend.entity;
import jakarta.persistence.*;import jakarta.validation.constraints.NotBlank;import java.time.LocalDateTime;
@Entity @Table(name="campaigns") public class Campaign{
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @NotBlank @Column(nullable=false,length=100) private String title;
 @NotBlank @Column(nullable=false,length=240) private String subtitle;
 @NotBlank @Column(nullable=false,length=50) private String badge;
 @NotBlank @Column(nullable=false,length=255) private String linkUrl;
 private String imageUrl;
 @Column(nullable=false,length=120) private String gradient="from-[#063b8f] via-[#0052cc] to-[#2c7ef8]";
 @Column(nullable=false) private boolean active=true; private int displayOrder=0; private LocalDateTime startsAt; private LocalDateTime endsAt;
 public Long getId(){return id;}public String getTitle(){return title;}public void setTitle(String v){title=v;}public String getSubtitle(){return subtitle;}public void setSubtitle(String v){subtitle=v;}public String getBadge(){return badge;}public void setBadge(String v){badge=v;}public String getLinkUrl(){return linkUrl;}public void setLinkUrl(String v){linkUrl=v;}public String getImageUrl(){return imageUrl;}public void setImageUrl(String v){imageUrl=v;}public String getGradient(){return gradient;}public void setGradient(String v){gradient=v;}public boolean isActive(){return active;}public void setActive(boolean v){active=v;}public int getDisplayOrder(){return displayOrder;}public void setDisplayOrder(int v){displayOrder=v;}public LocalDateTime getStartsAt(){return startsAt;}public void setStartsAt(LocalDateTime v){startsAt=v;}public LocalDateTime getEndsAt(){return endsAt;}public void setEndsAt(LocalDateTime v){endsAt=v;}
}
