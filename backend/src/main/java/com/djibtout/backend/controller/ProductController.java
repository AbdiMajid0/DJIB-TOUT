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

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
        Product product = productService.getProductById(id).orElse(null);
        if (product == null || (!product.isVisible() && !sellerAccess.canManageCatalog(getAuthenticatedUser(), product)))
            return ResponseEntity.notFound().build();
        if (product.getImages() != null) product.getImages().size();
        return ResponseEntity.ok(product);
    }

    @Transactional
    @PostMapping
    public ResponseEntity<?> createProduct(@Valid @RequestBody ProductInput input) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vous devez être connecté.");
        User owner=sellerAccess.ownerForCatalog(user);
        if (owner == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Permission catalogue requise.");
        Product product = new Product();
        appliquer(product, input);
        product.setSeller(owner);
        return ResponseEntity.ok(productService.saveProduct(product));
    }

    @Transactional
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductInput input) {
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

        appliquer(existingProduct, input);
        return ResponseEntity.ok(productService.saveProduct(existingProduct));
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

    /**
     * Champs obligatoires toujours appliques, facultatifs seulement s'ils sont
     * fournis : une mise a jour partielle ne doit pas effacer ce qu'elle
     * n'envoie pas.
     */
    private void appliquer(Product product, ProductInput input) {
        product.setName(input.name().trim());
        product.setPrice(input.price());
        product.setStockQuantity(input.stockQuantity());
        product.setCategory(input.category().trim());
        if (input.description() != null) product.setDescription(input.description());
        if (input.images() != null) product.setImages(input.images());
        if (input.videoUrl() != null) product.setVideoUrl(input.videoUrl());
        if (input.originalPrice() != null) product.setOriginalPrice(input.originalPrice());
        if (input.brand() != null) product.setBrand(input.brand());
        if (input.warrantyMonths() != null) product.setWarrantyMonths(input.warrantyMonths());
        if (input.deliveryDays() != null) product.setDeliveryDays(input.deliveryDays());
        if (input.flashSaleEndsAt() != null) product.setFlashSaleEndsAt(input.flashSaleEndsAt());
        // `Product.isVisible()` renvoie true quand le champ est nul : appliquer
        // systematiquement la valeur recue repassait en visible tout produit
        // masque par l'administration des que le vendeur modifiait son prix.
        if (input.visible() != null) product.setVisible(input.visible());
    }

    /**
     * Entree de creation et de mise a jour.
     *
     * L'entite Product etait liee directement au corps de la requete. Un vendeur
     * pouvait y placer un `id` : `save()` faisait alors un merge et ecrasait le
     * produit d'un concurrent, en se l'attribuant au passage. Le DTO ferme aussi
     * l'acces a `version`, `createdAt` et aux champs calcules, et impose enfin
     * une validation — un prix negatif etait accepte, un nom absent produisait
     * une erreur 500.
     */
    public record ProductInput(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 5000) String description,
            @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal price,
            @NotNull @PositiveOrZero Integer stockQuantity,
            @NotBlank @Size(max = 100) String category,
            @Size(max = 8) List<@Size(max = 1000) @Pattern(regexp = "(?i)^(https?://|/uploads/|data:image/).*") String> images,
            @Size(max = 1000) String videoUrl,
            @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal originalPrice,
            @Size(max = 100) String brand,
            @PositiveOrZero @Max(120) Integer warrantyMonths,
            @PositiveOrZero @Max(365) Integer deliveryDays,
            LocalDateTime flashSaleEndsAt,
            Boolean visible) {}
}
