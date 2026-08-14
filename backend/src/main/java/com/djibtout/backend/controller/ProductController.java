package com.djibtout.backend.controller;

import com.djibtout.backend.entity.Product;
import com.djibtout.backend.entity.Role;
import com.djibtout.backend.entity.User;
import com.djibtout.backend.repository.UserRepository;
import com.djibtout.backend.service.ProductService;
import com.djibtout.backend.service.SellerAccessService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;
    private final SellerAccessService sellerAccess;

    public ProductController(ProductService productService, UserRepository userRepository, SellerAccessService sellerAccess) {
        this.productService = productService;
        this.userRepository = userRepository;
        this.sellerAccess=sellerAccess;
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return null;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getProducts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Long sellerId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) Integer maxDeliveryDays,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Page<Product> productPage = productService.searchProducts(
                q, category, brand, sellerId, minPrice, maxPrice, minRating, maxDeliveryDays, inStock, sort, page, size
        );
        return ResponseEntity.ok(productPage);
    }

    @Transactional(readOnly = true)
    @GetMapping("/my-products")
    public ResponseEntity<?> getMyProducts() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vous devez être connecté.");
        }

        List<Product> myProducts = productService.getProductsBySellerId(user.getId());
        myProducts.forEach(p -> {
            if (p.getImages() != null) p.getImages().size(); // force lazy load
        });
        return ResponseEntity.ok(myProducts);
    }

    @Transactional(readOnly = true)
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(product -> {
                    if (product.getImages() != null) product.getImages().size();
                    return ResponseEntity.ok(product);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vous devez être connecté.");
        User owner=sellerAccess.ownerForCatalog(user);
        if (owner == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Permission catalogue requise.");
        product.setSeller(owner);
        Product saved = productService.saveProduct(product);
        return ResponseEntity.ok(saved);
    }

    @Transactional
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vous devez être connecté.");
        }

        Product existingProduct = productService.getProductById(id).orElse(null);
        if (existingProduct == null) {
            return ResponseEntity.notFound().build();
        }

        // Ownership verification: Must be seller owner or ADMIN
        if (!sellerAccess.canManageCatalog(user, existingProduct)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Vous n'avez pas la permission de modifier ce produit.");
        }

        if (productDetails.getName() != null) existingProduct.setName(productDetails.getName());
        if (productDetails.getDescription() != null) existingProduct.setDescription(productDetails.getDescription());
        if (productDetails.getPrice() != null) existingProduct.setPrice(productDetails.getPrice());
        if (productDetails.getStockQuantity() != null) existingProduct.setStockQuantity(productDetails.getStockQuantity());
        if (productDetails.getCategory() != null) existingProduct.setCategory(productDetails.getCategory());
        if (productDetails.getImages() != null) existingProduct.setImages(productDetails.getImages());
        if (productDetails.getVideoUrl() != null) existingProduct.setVideoUrl(productDetails.getVideoUrl());
        if (productDetails.getOriginalPrice() != null) existingProduct.setOriginalPrice(productDetails.getOriginalPrice());
        if (productDetails.getBrand() != null) existingProduct.setBrand(productDetails.getBrand());
        if (productDetails.getWarrantyMonths() != null) existingProduct.setWarrantyMonths(productDetails.getWarrantyMonths());
        if (productDetails.getDeliveryDays() != null) existingProduct.setDeliveryDays(productDetails.getDeliveryDays());
        if (productDetails.getFlashSaleEndsAt() != null) existingProduct.setFlashSaleEndsAt(productDetails.getFlashSaleEndsAt());
        existingProduct.setVisible(productDetails.isVisible());

        Product updated = productService.saveProduct(existingProduct);
        return ResponseEntity.ok(updated);
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vous devez être connecté.");
        }

        Product existingProduct = productService.getProductById(id).orElse(null);
        if (existingProduct == null) {
            return ResponseEntity.notFound().build();
        }

        // Ownership verification: Must be seller owner or ADMIN
        if (!sellerAccess.canManageCatalog(user, existingProduct)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Vous n'avez pas la permission de supprimer ce produit.");
        }

        productService.deleteProduct(id);
        return ResponseEntity.ok("Produit supprimé avec succès.");
    }
}
