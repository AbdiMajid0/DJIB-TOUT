package com.djibtout.backend.entity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name="product_questions",indexes=@Index(name="idx_question_product_created",columnList="product_id,created_at"))
public class ProductQuestion {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="product_id") @JsonIgnoreProperties({"hibernateLazyInitializer","handler"}) private Product product;
 @ManyToOne(fetch=FetchType.EAGER,optional=false) @JoinColumn(name="user_id") @JsonIgnoreProperties({"password","email","role","hibernateLazyInitializer","handler"}) private User user;
 @Column(nullable=false,length=500) private String question;
 @Column(name="hidden") private Boolean hidden=false;
 @Column(length=1000) private String answer;
 @Column(name="answered_at") private LocalDateTime answeredAt;
 @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="answered_by_id") @JsonIgnoreProperties({"password","email","role","hibernateLazyInitializer","handler"}) private User answeredBy;
 @CreationTimestamp @Column(name="created_at",nullable=false,updatable=false) private LocalDateTime createdAt;
 public Long getId(){return id;} public Product getProduct(){return product;} public void setProduct(Product v){product=v;} public User getUser(){return user;} public void setUser(User v){user=v;} public String getQuestion(){return question;} public void setQuestion(String v){question=v;} public String getAnswer(){return answer;} public void setAnswer(String v){answer=v;} public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getAnsweredAt(){return answeredAt;} public void setAnsweredAt(LocalDateTime v){answeredAt=v;} public User getAnsweredBy(){return answeredBy;} public void setAnsweredBy(User v){answeredBy=v;} public boolean isHidden(){return Boolean.TRUE.equals(hidden);} public void setHidden(boolean v){hidden=v;}
}
