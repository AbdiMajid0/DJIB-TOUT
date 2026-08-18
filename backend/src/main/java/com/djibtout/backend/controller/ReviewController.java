package com.djibtout.backend.controller;
import com.djibtout.backend.security.CurrentUser;

import com.djibtout.backend.entity.Product;
import com.djibtout.backend.entity.Review;
import com.djibtout.backend.entity.User;
import com.djibtout.backend.repository.ProductRepository;
import com.djibtout.backend.repository.ReviewRepository;
import com.djibtout.backend.repository.UserRepository;
import com.djibtout.backend.service.SellerEventService;
import com.djibtout.backend.service.OwnershipService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SellerEventService events;
    private final OwnershipService ownership;

    public ReviewController(ReviewRepository reviewRepository, ProductRepository productRepository, UserRepository userRepository, SellerEventService events,OwnershipService ownership) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.events = events;
        this.ownership=ownership;
    }

    private User getAuthenticatedUser() {
        return CurrentUser.ofContext(userRepository);
    }

    // Public: Get reviews for a product
    @Transactional(readOnly = true)
    @GetMapping("/products/{productId}/reviews")
    public ResponseEntity<?> getProductReviews(@PathVariable Long productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            return ResponseEntity.badRequest().body("Produit introuvable.");
        }
        List<Review> reviews = reviewRepository.findVisibleByProduct(product);
        return ResponseEntity.ok(reviews);
    }

    // Public: Get review summary (average rating & count)
    @Transactional(readOnly = true)
    @GetMapping("/products/{productId}/reviews/summary")
    public ResponseEntity<?> getProductReviewSummary(@PathVariable Long productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            return ResponseEntity.badRequest().body("Produit introuvable.");
        }

        long count = reviewRepository.countVisibleByProduct(product);
        Double avgRating = reviewRepository.getAverageRatingForProduct(product);

        return ResponseEntity.ok(new ReviewSummaryResponse(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0, count));
    }

    // Authenticated: Create a review for a product
    @Transactional
    @PostMapping("/products/{productId}/reviews")
    public ResponseEntity<?> createProductReview(
            @PathVariable Long productId,
            @RequestBody ReviewRequest request
    ) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body("Vous devez être connecté pour laisser un avis.");
        }

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            return ResponseEntity.badRequest().body("Produit introuvable.");
        }
        if(!ownership.purchasedProduct(user,product))return ResponseEntity.status(403).body("Seuls les acheteurs d’un produit livré peuvent publier un avis.");

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            return ResponseEntity.badRequest().body("La note doit être comprise entre 1 et 5 étoiles.");
        }

        if (request.getComment() == null || request.getComment().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Le commentaire ne peut pas être vide.");
        }

        Review review = new Review(product, user, request.getRating(), request.getComment().trim());
        Review saved = reviewRepository.save(review);
        events.notify(product.getSeller(),"Nouvel avis","Un avis de "+request.getRating()+" étoile(s) a été publié sur « "+product.getName()+" ».");

        return ResponseEntity.ok(saved);
    }

    // Authenticated: Get current user's reviews
    @Transactional(readOnly = true)
    @GetMapping("/reviews/my-reviews")
    public ResponseEntity<?> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body("Vous devez être connecté.");
        }

        return ResponseEntity.ok(reviewRepository.findByUserOrderByCreatedAtDesc(
                user, com.djibtout.backend.controller.OrderController.pageRequest(page, size)));
    }
}

class ReviewRequest {
    private Integer rating;
    private String comment;

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}

class ReviewSummaryResponse {
    private double averageRating;
    private long reviewCount;

    public ReviewSummaryResponse(double averageRating, long reviewCount) {
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
    }

    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }

    public long getReviewCount() { return reviewCount; }
    public void setReviewCount(long reviewCount) { this.reviewCount = reviewCount; }
}
