package com.djibtout.backend.entity;
import jakarta.persistence.*;import jakarta.validation.constraints.NotBlank;
@Entity @Table(name="home_sections",uniqueConstraints=@UniqueConstraint(columnNames="section_key")) public class HomeSection{
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @NotBlank @Column(name="section_key",nullable=false,length=60) private String key;
 @NotBlank @Column(nullable=false,length=100) private String title;
 @Column(length=180) private String subtitle;@Column(nullable=false) private boolean active=true;@Column(nullable=false) private int displayOrder;@Column(length=100) private String category;@Column(nullable=false) private int maxItems=10;
 public Long getId(){return id;}public String getKey(){return key;}public void setKey(String v){key=v;}public String getTitle(){return title;}public void setTitle(String v){title=v;}public String getSubtitle(){return subtitle;}public void setSubtitle(String v){subtitle=v;}public boolean isActive(){return active;}public void setActive(boolean v){active=v;}public int getDisplayOrder(){return displayOrder;}public void setDisplayOrder(int v){displayOrder=v;}public String getCategory(){return category;}public void setCategory(String v){category=v;}public int getMaxItems(){return maxItems;}public void setMaxItems(int v){maxItems=Math.max(1,Math.min(v,30));}
}
