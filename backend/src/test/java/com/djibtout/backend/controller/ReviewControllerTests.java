package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;
import com.djibtout.backend.service.OwnershipService;import com.djibtout.backend.service.SellerEventService;
import org.junit.jupiter.api.AfterEach;import org.junit.jupiter.api.BeforeEach;import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.ArgumentMatchers.*;import static org.mockito.Mockito.*;

class ReviewControllerTests{
 ReviewRepository reviews=mock(ReviewRepository.class);
 ProductRepository products=mock(ProductRepository.class);
 UserRepository users=mock(UserRepository.class);
 SellerEventService events=mock(SellerEventService.class);
 OwnershipService ownership=mock(OwnershipService.class);
 ReviewController controller=new ReviewController(reviews,products,users,events,ownership);

 User buyer;User seller;Product product;

 @BeforeEach void setUp(){
  buyer=new User();buyer.setId(1L);buyer.setEmail("buyer@test.local");
  seller=new User();seller.setId(5L);seller.setEmail("seller@test.local");
  product=new Product();product.setId(4L);product.setName("Ventilateur");product.setSeller(seller);
  when(users.findByEmail(buyer.getEmail())).thenReturn(Optional.of(buyer));
  when(products.findById(4L)).thenReturn(Optional.of(product));
  when(reviews.save(any(Review.class))).thenAnswer(inv->inv.getArgument(0));
 }

 @AfterEach void clearContext(){SecurityContextHolder.clearContext();}

 void authenticate(){SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(buyer.getEmail(),"x",AuthorityUtils.NO_AUTHORITIES));}

 ReviewRequest request(Integer rating,String comment){ReviewRequest r=new ReviewRequest();r.setRating(rating);r.setComment(comment);return r;}

 @Test void publicListRejectsUnknownProduct(){
  when(products.findById(77L)).thenReturn(Optional.empty());
  assertEquals(400,controller.getProductReviews(77L).getStatusCode().value());
 }

 @Test void publicListReturnsVisibleReviewsOnly(){
  Review visible=new Review(product,buyer,5,"Parfait");
  when(reviews.findVisibleByProduct(product)).thenReturn(List.of(visible));
  assertEquals(List.of(visible),controller.getProductReviews(4L).getBody());
 }

 @Test void summaryRejectsUnknownProduct(){
  when(products.findById(77L)).thenReturn(Optional.empty());
  assertEquals(400,controller.getProductReviewSummary(77L).getStatusCode().value());
 }

 @Test void summaryRoundsAverageToOneDecimal(){
  when(reviews.countVisibleByProduct(product)).thenReturn(3L);
  when(reviews.getAverageRatingForProduct(product)).thenReturn(4.266);
  ReviewSummaryResponse body=(ReviewSummaryResponse)controller.getProductReviewSummary(4L).getBody();
  assertEquals(4.3,body.getAverageRating());
  assertEquals(3L,body.getReviewCount());
 }

 @Test void summaryReportsZeroWhenNoReviewYet(){
  when(reviews.countVisibleByProduct(product)).thenReturn(0L);
  when(reviews.getAverageRatingForProduct(product)).thenReturn(null);
  ReviewSummaryResponse body=(ReviewSummaryResponse)controller.getProductReviewSummary(4L).getBody();
  assertEquals(0.0,body.getAverageRating());
  assertEquals(0L,body.getReviewCount());
 }

 @Test void createRequiresAuthentication(){
  assertEquals(401,controller.createProductReview(4L,request(5,"Parfait")).getStatusCode().value());
 }

 @Test void createRejectsUnknownProduct(){
  authenticate();
  when(products.findById(77L)).thenReturn(Optional.empty());
  assertEquals(400,controller.createProductReview(77L,request(5,"Parfait")).getStatusCode().value());
 }

 @Test void createRejectsUserWhoNeverReceivedTheProduct(){
  authenticate();
  when(ownership.purchasedProduct(buyer,product)).thenReturn(false);
  assertEquals(403,controller.createProductReview(4L,request(5,"Parfait")).getStatusCode().value());
  verify(reviews,never()).save(any());
 }

 @Test void createRejectsRatingOutsideOneToFive(){
  authenticate();
  when(ownership.purchasedProduct(buyer,product)).thenReturn(true);
  assertEquals(400,controller.createProductReview(4L,request(null,"Parfait")).getStatusCode().value());
  assertEquals(400,controller.createProductReview(4L,request(0,"Parfait")).getStatusCode().value());
  assertEquals(400,controller.createProductReview(4L,request(6,"Parfait")).getStatusCode().value());
  verify(reviews,never()).save(any());
 }

 @Test void createRejectsBlankComment(){
  authenticate();
  when(ownership.purchasedProduct(buyer,product)).thenReturn(true);
  assertEquals(400,controller.createProductReview(4L,request(5,null)).getStatusCode().value());
  assertEquals(400,controller.createProductReview(4L,request(5,"   ")).getStatusCode().value());
  verify(reviews,never()).save(any());
 }

 @Test void createTrimsCommentAndNotifiesSeller(){
  authenticate();
  when(ownership.purchasedProduct(buyer,product)).thenReturn(true);
  ResponseEntity<?> response=controller.createProductReview(4L,request(4,"  Bon produit  "));
  assertEquals(200,response.getStatusCode().value());
  assertEquals("Bon produit",((Review)response.getBody()).getComment());
  verify(events).notify(eq(seller),eq("Nouvel avis"),contains("4 étoile(s)"));
 }

 @Test void myReviewsRequiresAuthentication(){
  assertEquals(401,controller.getMyReviews(0,10).getStatusCode().value());
 }

 @Test void myReviewsIsPaginated(){
  authenticate();
  when(reviews.findByUserOrderByCreatedAtDesc(eq(buyer),any(org.springframework.data.domain.Pageable.class)))
   .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));
  assertEquals(200,controller.getMyReviews(0,10).getStatusCode().value());
  verify(reviews).findByUserOrderByCreatedAtDesc(buyer,OrderController.pageRequest(0,10));
 }
}
