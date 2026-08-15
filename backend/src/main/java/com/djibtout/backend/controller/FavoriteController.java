package com.djibtout.backend.controller;

import com.djibtout.backend.entity.Favorite;
import com.djibtout.backend.entity.Product;
import com.djibtout.backend.entity.User;
import com.djibtout.backend.repository.FavoriteRepository;
import com.djibtout.backend.repository.ProductRepository;
import com.djibtout.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public FavoriteController(FavoriteRepository favoriteRepository, ProductRepository productRepository, UserRepository userRepository) {
        this.favoriteRepository = favoriteRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return null;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    @Transactional(readOnly = true)
    @GetMapping
    public ResponseEntity<?> getMyFavorites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body("Vous devez être connecté.");
        }

        // `Page.map` conserve les métadonnées de pagination tout en exposant les
        // produits, seule chose dont l'écran a besoin.
        return ResponseEntity.ok(favoriteRepository
                .findByUserOrderByCreatedAtDesc(user, OrderController.pageRequest(page, size))
                .map(f -> {
                    Product p = f.getProduct();
                    if (p.getImages() != null) {
                        p.getImages().size(); // Force initialization inside transaction
                    }
                    return p;
                }));
    }

    @Transactional(readOnly = true)
    @GetMapping("/ids")
    public ResponseEntity<?> getMyFavoriteIds() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body("Vous devez être connecté.");
        }

        List<Favorite> favorites = favoriteRepository.findByUserOrderByCreatedAtDesc(user);
        List<Long> productIds = favorites.stream()
                .map(f -> f.getProduct().getId())
                .collect(Collectors.toList());

        return ResponseEntity.ok(productIds);
    }

    @Transactional
    @PostMapping("/{productId}")
    public ResponseEntity<?> addFavorite(@PathVariable Long productId) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body("Vous devez être connecté pour ajouter des favoris.");
        }

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            return ResponseEntity.badRequest().body("Produit introuvable.");
        }

        if (!favoriteRepository.existsByUserAndProduct(user, product)) {
            Favorite favorite = new Favorite(user, product);
            favoriteRepository.save(favorite);
        }

        return ResponseEntity.ok(new FavoriteResponse(true, "Produit ajouté aux favoris.", productId));
    }

    @Transactional
    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeFavorite(@PathVariable Long productId) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body("Vous devez être connecté.");
        }

        Product product = productRepository.findById(productId).orElse(null);
        if (product != null) {
            favoriteRepository.deleteByUserAndProduct(user, product);
        }

        return ResponseEntity.ok(new FavoriteResponse(true, "Produit retiré des favoris.", productId));
    }
}

class FavoriteResponse {
    private boolean success;
    private String message;
    private Long productId;

    public FavoriteResponse(boolean success, String message, Long productId) {
        this.success = success;
        this.message = message;
        this.productId = productId;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
}
