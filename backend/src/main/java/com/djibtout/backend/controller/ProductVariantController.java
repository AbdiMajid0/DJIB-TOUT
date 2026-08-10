package com.djibtout.backend.controller;

import com.djibtout.backend.entity.*;
import com.djibtout.backend.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products/{productId}/variants")
public class ProductVariantController {
    private final ProductRepository products;
    private final ProductVariantRepository variants;
    private final UserRepository users;

    public ProductVariantController(ProductRepository products, ProductVariantRepository variants, UserRepository users) {
        this.products = products; this.variants = variants; this.users = users;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> list(@PathVariable Long productId, Authentication authentication) {
        Product product = products.findById(productId).orElse(null);
        if (product == null) return ResponseEntity.notFound().build();
        User user = current(authentication);
        boolean owner = user != null && (user.getRole() == Role.ADMIN || product.getSeller() != null && product.getSeller().getId().equals(user.getId()));
        return ResponseEntity.ok(owner ? variants.findByProductIdOrderByIdAsc(productId) : variants.findByProductIdAndActiveTrueOrderByIdAsc(productId));
    }

    @PostMapping
    public ResponseEntity<?> create(@PathVariable Long productId, Authentication authentication, @Valid @RequestBody VariantInput input) {
        Product product = ownedProduct(productId, authentication);
        if (product == null) return ResponseEntity.status(403).body("Produit inaccessible.");
        if (variants.findByProductIdAndSkuIgnoreCase(productId, input.sku().trim()).isPresent()) return ResponseEntity.status(409).body("Ce SKU existe déjà pour ce produit.");
        ProductVariant variant = new ProductVariant(); variant.setProduct(product); apply(variant, input);
        return ResponseEntity.ok(variants.save(variant));
    }

    @PutMapping("/{variantId}")
    public ResponseEntity<?> update(@PathVariable Long productId, @PathVariable Long variantId, Authentication authentication, @Valid @RequestBody VariantInput input) {
        if (ownedProduct(productId, authentication) == null) return ResponseEntity.status(403).body("Produit inaccessible.");
        ProductVariant variant = variants.findById(variantId).orElse(null);
        if (variant == null || !variant.getProduct().getId().equals(productId)) return ResponseEntity.notFound().build();
        var duplicate = variants.findByProductIdAndSkuIgnoreCase(productId, input.sku().trim());
        if (duplicate.isPresent() && !duplicate.get().getId().equals(variantId)) return ResponseEntity.status(409).body("Ce SKU existe déjà pour ce produit.");
        apply(variant, input); return ResponseEntity.ok(variants.save(variant));
    }

    @DeleteMapping("/{variantId}")
    public ResponseEntity<?> delete(@PathVariable Long productId, @PathVariable Long variantId, Authentication authentication) {
        if (ownedProduct(productId, authentication) == null) return ResponseEntity.status(403).body("Produit inaccessible.");
        ProductVariant variant = variants.findById(variantId).orElse(null);
        if (variant == null || !variant.getProduct().getId().equals(productId)) return ResponseEntity.notFound().build();
        variants.delete(variant); return ResponseEntity.noContent().build();
    }

    private void apply(ProductVariant variant, VariantInput input) {
        variant.setSku(input.sku().trim()); variant.setPrice(input.price()); variant.setStockQuantity(input.stockQuantity());
        variant.setActive(input.active()); variant.setAttributes(input.attributes()); variant.setImages(input.images());
    }
    private User current(Authentication authentication) { return authentication == null ? null : users.findByEmail(authentication.getName()).orElse(null); }
    private Product ownedProduct(Long id, Authentication authentication) {
        User user = current(authentication); Product product = products.findById(id).orElse(null);
        return user != null && product != null && (user.getRole() == Role.ADMIN || product.getSeller() != null && product.getSeller().getId().equals(user.getId())) ? product : null;
    }
    public record VariantInput(@NotBlank @Size(max = 80) String sku, @NotNull @PositiveOrZero BigDecimal price,
                               @NotNull @PositiveOrZero Integer stockQuantity, boolean active,
                               @Size(max = 12) Map<@NotBlank @Size(max = 80) String, @NotBlank @Size(max = 160) String> attributes,
                               @Size(max=8) List<@Size(max=1000) String> images) {}
}
